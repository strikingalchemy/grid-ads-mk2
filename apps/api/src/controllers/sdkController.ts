
import { Request, Response } from 'express';

export const getSdk = (req: Request, res: Response) => {
  const scriptContent = `
(function() {
  // GridAds v8.0 (External SDK)
  // Served dynamically from API
  
  // 1. Resolve Configuration from Script Tag
  const currentScript = document.currentScript;
  if (!currentScript) {
      console.warn('[GridAds] Could not determine current script context.');
      return;
  }

  const srcUrl = new URL(currentScript.src);
  const storeId = srcUrl.searchParams.get('store_id');
  const apiBase = srcUrl.origin; // Auto-detects Railway URL

  if (!storeId) {
      console.error('[GridAds] Missing store_id parameter in script URL.');
      return;
  }

  const CONFIG = {
    storeId: storeId,
    apiEndpoint: \`\${apiBase}/storefront/\${storeId}/ads\`
  };

  // --- CORE LOGIC ---
  function detectGrid(root) {
    // Priority 1: Specific Theme Classes
    const explicitSelectors = [
        'ul.productGrid', '.rca-productGrid', '.productGrid', 
        '#product-listing-container ul', '[data-product-grid]',
        '.product-list', '.grid-layout'
    ];
    
    for (const sel of explicitSelectors) {
        const match = root.querySelector(sel);
        if (match && match.children.length > 0) {
            return { container: match, items: Array.from(match.children) };
        }
    }

    // Priority 2: Visual Density (Fallback for custom themes)
    let bestContainer = null;
    let maxItems = 0;

    const productCandidates = Array.from(root.querySelectorAll('*')).filter(el => {
        if (!el.className || typeof el.className !== 'string') return false;
        const c = el.className.toLowerCase();
        const t = el.tagName;
        return t !== 'SCRIPT' && t !== 'STYLE' && (c.includes('product') || c.includes('card'));
    });
    
    const parentMap = new Map();
    productCandidates.forEach(el => {
        const parent = el.parentElement;
        if (!parent) return;
        if (!parentMap.has(parent)) parentMap.set(parent, 0);
        parentMap.set(parent, parentMap.get(parent) + 1);
    });

    for (const [parent, count] of parentMap.entries()) {
        if (count >= 1 && count > maxItems) {
            maxItems = count;
            bestContainer = parent;
        }
    }
    
    return bestContainer ? { container: bestContainer, items: Array.from(bestContainer.children) } : null;
  }

  function createAd(ad, tagName, refItem) {
    const id = 'gridads-' + ad.id;
    if(document.getElementById(id)) return null;

    const wrapper = document.createElement(tagName);
    wrapper.id = id;
    wrapper.classList.add('gridads-tile');
    
    if (refItem) {
        wrapper.className = refItem.className + ' gridads-tile';
        const s = window.getComputedStyle(refItem);
        
        // Clone critical layout props
        ['margin','padding','float','flex','display','width'].forEach(p => wrapper.style[p] = s[p]);
        wrapper.style.boxSizing = 'border-box';
        
        // Row Spacing Fix
        if (ad.styles && ad.styles.marginBottom) {
            const cur = parseFloat(s.marginBottom) || 0;
            wrapper.style.setProperty('margin-bottom', (cur + ad.styles.marginBottom) + 'px', 'important');
        }
    }

    const s = ad.styles || {};
    const inner = document.createElement('article');
    if (refItem) {
        const refInner = refItem.querySelector('article') || refItem.querySelector('.card') || refItem.firstElementChild;
        if(refInner && refInner.tagName !== 'IMG') inner.className = refInner.className;
        else inner.className = 'card';
    } else {
        inner.className = 'card';
    }

    inner.style.cssText = \`
        position: relative; width: 100%; height: 100%; min-height: 100%;
        display: flex; flex-direction: column; overflow: hidden;
        border: \${s.borderWidth || 0}px solid \${s.borderColor || 'transparent'};
        border-radius: \${s.borderRadius || 0}px;
        \${s.backgroundType === 'gradient' ? \`background-image: \${s.backgroundGradient};\` : \`background-color: \${s.backgroundColor || '#fff'};\`}
        cursor: pointer; box-sizing: border-box; z-index: 10;
        opacity: 1; visibility: visible;
    \`;
    
    inner.onclick = function() { window.location.href = ad.destinationUrl || '#'; };

    // Media
    let media = '';
    if (ad.showMedia) {
       const fit = ad.mediaFit || 'cover';
       if (ad.type === 'video') {
         media = \`<video src="\${ad.mediaUrl}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${fit};z-index:0;pointer-events:none;"></video>\`;
       } else {
         media = \`<img src="\${ad.mediaUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${fit};z-index:0;pointer-events:none;" />\`;
       }
    }

    // Content
    const justify = s.verticalAlignment === 'top' ? 'flex-start' : s.verticalAlignment === 'bottom' ? 'flex-end' : 'center';
    const align = s.contentAlignment === 'left' ? 'flex-start' : s.contentAlignment === 'right' ? 'flex-end' : 'center';
    
    const content = \`
      <div style="position:relative; z-index:2; width:100%; flex:1; padding:\${s.contentPadding || 20}px; display:flex; flex-direction:column; justify-content:\${justify}; align-items:\${align}; text-align:\${s.contentAlignment || 'center'};">
        \${ad.showHeadline ? \`<h3 style="margin:0 0 12px 0; color:\${s.headlineColor}; font-size:\${s.headlineFontSize}px; font-weight:\${s.headlineFontWeight}; line-height:\${s.headlineLineHeight}; letter-spacing:\${s.headlineLetterSpacing}px; font-family:inherit;">\${ad.headline}</h3>\` : ''}
        \${ad.showDescription ? \`<p style="margin:0 0 24px 0; color:\${s.descriptionColor}; font-size:\${s.descriptionFontSize}px; font-weight:\${s.descriptionFontWeight}; line-height:\${s.descriptionLineHeight}; letter-spacing:\${s.descriptionLetterSpacing}px; font-family:inherit;">\${ad.description}</p>\` : ''}
        \${ad.showButton ? \`<span style="display:inline-block; text-decoration:none; padding:12px 32px; border-radius:999px; background-color:\${s.buttonColor}; color:\${s.buttonTextColor}; font-weight:600; font-size:14px; font-family:inherit;">\${ad.buttonText}</span>\` : ''}
      </div>
    \`;
    
    const overlay = \`<div style="position:absolute;inset:0;background-color:\${s.overlayColor || '#000'};opacity:\${s.overlayOpacity || 0};z-index:1;pointer-events:none;"></div>\`;

    inner.innerHTML = media + overlay + content;
    wrapper.appendChild(inner);
    return wrapper;
  }

  function syncHeights() {
      const ads = document.querySelectorAll('.gridads-tile');
      if(ads.length === 0) return;
      
      requestAnimationFrame(() => {
          ads.forEach(ad => {
              const parent = ad.parentElement;
              const sibling = Array.from(parent.children).find(c => !c.classList.contains('gridads-tile') && c.offsetHeight > 0);
              if(sibling) {
                  if(Math.abs(ad.offsetHeight - sibling.offsetHeight) > 2) {
                      ad.style.height = sibling.offsetHeight + 'px';
                      const inner = ad.querySelector('article') || ad.querySelector('.card') || ad.firstElementChild;
                      if(inner) inner.style.height = '100%';
                  }
              }
          });
      });
  }

  function run(ads) {
      const res = detectGrid(document.body);
      if(!res) return; 
      
      const { container, items } = res;
      const refItem = items.find(i => !i.classList.contains('gridads-tile') && i.tagName !== 'SCRIPT');
      if(!refItem) return;
      
      const tagName = refItem.tagName;

      ads.forEach(ad => {
          if(ad.status !== 'active') return;
          if(document.getElementById('gridads-' + ad.id)) return;

          const el = createAd(ad, tagName, refItem);
          if(!el) return;
          
          const pos = Math.max(0, ad.position - 1);
          if(pos < items.length) {
              if(items[pos].parentNode === container) {
                  container.insertBefore(el, items[pos]);
              }
          } else {
              container.appendChild(el);
          }
      });
      syncHeights();
  }

  // --- INIT ---
  async function init() {
      try {
        // console.log('[GridAds] Fetching live ads from:', CONFIG.apiEndpoint);
        const res = await fetch(CONFIG.apiEndpoint);
        if(res.ok) {
            const liveData = await res.json();
            
            if(Array.isArray(liveData) && liveData.length > 0) {
                if(document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => run(liveData));
                } else {
                    run(liveData);
                }
                
                // Watch for dynamic content (Infinite Scroll)
                let t;
                new MutationObserver(() => {
                    clearTimeout(t);
                    t = setTimeout(() => { run(liveData); syncHeights(); }, 200);
                }).observe(document.body, { childList: true, subtree: true });
                
                window.addEventListener('resize', () => syncHeights());
            }
        }
      } catch(e) {
          // Silent fail for production usage to avoid console noise
      }
  }
  
  init();
})();
  `;

  res.type('javascript').send(scriptContent);
};
    