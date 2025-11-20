
import { Request, Response } from 'express';

export const getSdk = (req: Request, res: Response) => {
  // CRITICAL HEADERS for CORB/CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  const scriptContent = `
(function() {
  console.log('[GridAds] v13.0 (Live External SDK) Initialized');
  
  // --- Configuration & Environment Setup ---
  const currentScript = document.currentScript;
  const scriptUrl = currentScript ? new URL(currentScript.src) : null;
  
  // Determine Store ID
  let storeId = window.GridAdsConfig?.storeId;
  if (!storeId && currentScript) {
      storeId = currentScript.getAttribute('data-store-id') || scriptUrl?.searchParams.get('store_id');
  }

  if (!storeId) {
    console.error('[GridAds] Critical Error: Missing store_id. Configure via window.GridAdsConfig or data-store-id attribute.');
    return;
  }

  // Determine API Base URL
  let apiEndpoint = window.GridAdsConfig?.apiEndpoint;
  if (!apiEndpoint && scriptUrl) {
      // Default to the origin of this script + /storefront/{storeId}/ads
      apiEndpoint = \`\${scriptUrl.origin}/storefront/\${storeId}/ads\`;
  }

  const CONFIG = {
    storeId: storeId,
    apiEndpoint: apiEndpoint
  };

  // --- CORE LOGIC ---
  function detectGrid(root) {
    // Priority 1: Explicit Selectors (Cornerstone, Roots, etc.)
    const explicitSelectors = [
        'ul.productGrid', '.rca-productGrid', '.productGrid', 
        '#product-listing-container ul', '[data-product-grid]',
        '.product-list', '[data-test="product-grid"]'
    ];
    
    for (const sel of explicitSelectors) {
        const match = root.querySelector(sel);
        if (match && match.children.length > 0) {
            console.log('[GridAds] Grid detected via selector:', sel);
            const items = Array.from(match.children).filter(c => {
                const t = c.tagName;
                return t === 'LI' || c.classList.contains('product') || c.classList.contains('card');
            });
            return { container: match, items };
        }
    }
    
    // Priority 2: Visual Density Scan (Fallback)
    // Find the container with the most "product-like" children
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
        if (count >= 2 && count > maxItems) { // Threshold of 2 items
            maxItems = count;
            bestContainer = parent;
        }
    }
    
    if (bestContainer) {
         console.log('[GridAds] Grid detected via scanning:', bestContainer.className);
         return { container: bestContainer, items: Array.from(bestContainer.children) };
    }
    
    return null;
  }

  function createAd(ad, tagName, refItem) {
    const id = 'gridads-' + ad.id;
    if(document.getElementById(id)) return null;

    const wrapper = document.createElement(tagName);
    wrapper.id = id;
    wrapper.classList.add('gridads-tile');
    
    // Clone layout properties from reference item
    if (refItem) {
        wrapper.className = refItem.className + ' gridads-tile';
        const s = window.getComputedStyle(refItem);
        ['margin','padding','float','flex','display','width'].forEach(p => wrapper.style[p] = s.getPropertyValue(p));
        wrapper.style.boxSizing = 'border-box';
        
        // Apply custom row spacing if configured
        if (ad.styles && ad.styles.marginBottom) {
            const cur = parseFloat(s.marginBottom) || 0;
            wrapper.style.setProperty('margin-bottom', (cur + ad.styles.marginBottom) + 'px', 'important');
        }
    } else {
        wrapper.className = 'product gridads-tile';
    }

    const s = ad.styles || {};
    const inner = document.createElement('article');
    
    // Try to match inner card structure if possible
    if (refItem) {
        const refInner = refItem.querySelector('article') || refItem.querySelector('.card') || refItem.firstElementChild;
        if(refInner && refInner.tagName !== 'IMG') inner.className = refInner.className;
        else inner.className = 'card';
    } else {
        inner.className = 'card';
    }

    // Force inner card styling to ensure visibility
    inner.style.cssText = \`
        position: relative; width: 100%; height: 100%; min-height: 100%;
        display: flex; flex-direction: column; overflow: hidden;
        border: \${s.borderWidth || 0}px solid \${s.borderColor || 'transparent'};
        border-radius: \${s.borderRadius || 0}px;
        \${s.backgroundType === 'gradient' ? \`background-image: \${s.backgroundGradient};\` : \`background-color: \${s.backgroundColor || '#fff'};\`}
        cursor: pointer; box-sizing: border-box; z-index: 10;
        opacity: 1 !important; visibility: visible !important;
    \`;
    
    inner.onclick = function() { window.location.href = ad.destinationUrl || '#'; };

    let media = '';
    if (ad.showMedia) {
       const fit = ad.mediaFit || 'cover';
       if (ad.type === 'video') {
         media = \`<video src="\${ad.mediaUrl}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${fit};z-index:0;pointer-events:none;"></video>\`;
       } else {
         media = \`<img src="\${ad.mediaUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${fit};z-index:0;pointer-events:none;" />\`;
       }
    }

    const justify = s.verticalAlignment === 'top' ? 'flex-start' : s.verticalAlignment === 'bottom' ? 'flex-end' : 'center';
    const align = s.contentAlignment === 'left' ? 'flex-start' : s.contentAlignment === 'right' ? 'flex-end' : 'center';
    
    const content = \`
      <div style="position:relative; z-index:2; width:100%; flex:1; padding:\${s.contentPadding || 20}px; display:flex; flex-direction:column; justify-content:\${justify}; align-items:\${align}; text-align:\${s.contentAlignment || 'center'};">
        \${ad.showHeadline ? \`<h3 style="margin:0 0 12px 0; color:\${s.headlineColor}; font-size:\${s.headlineFontSize}px; font-weight:\${s.headlineFontWeight}; line-height:\${s.headlineLineHeight}; letter-spacing:\${s.headlineLetterSpacing}px; font-family: inherit;">\${ad.headline}</h3>\` : ''}
        \${ad.showDescription ? \`<p style="margin:0 0 24px 0; color:\${s.descriptionColor}; font-size:\${s.descriptionFontSize}px; font-weight:\${s.descriptionFontWeight}; line-height:\${s.descriptionLineHeight}; letter-spacing:\${s.descriptionLetterSpacing}px; font-family: inherit;">\${ad.description}</p>\` : ''}
        \${ad.showButton ? \`<span style="display:inline-block; text-decoration:none; padding:12px 32px; border-radius:999px; background-color:\${s.buttonColor}; color:\${s.buttonTextColor}; font-weight:600; font-size:14px; font-family: inherit;">\${ad.buttonText}</span>\` : ''}
      </div>
    \`;
    
    const overlay = \`<div style="position:absolute;inset:0;background-color:\${s.overlayColor || '#000'};opacity:\${s.overlayOpacity || 0};z-index:1;pointer-events:none;"></div>\`;

    inner.innerHTML = media + overlay + content;
    wrapper.appendChild(inner);
    return wrapper;
  }

  function syncHeights() {
      requestAnimationFrame(() => {
          const ads = document.querySelectorAll('.gridads-tile');
          ads.forEach(ad => {
              const parent = ad.parentElement;
              if(!parent) return;
              // Find a non-ad sibling to match height
              const sibling = Array.from(parent.children).find(c => !c.classList.contains('gridads-tile') && c.offsetHeight > 0);
              if (sibling && Math.abs(ad.offsetHeight - sibling.offsetHeight) > 2) {
                  ad.style.height = sibling.offsetHeight + 'px';
                  const inner = ad.querySelector('article') || ad.firstElementChild;
                  if(inner) inner.style.height = '100%';
              }
          });
      });
  }

  function run(ads) {
      const res = detectGrid(document.body);
      if(!res || !res.items.length) {
          console.log('[GridAds] No grid found yet. Retrying...');
          return;
      }
      
      const { container, items } = res;
      // Find a valid reference item (not a script, not an ad)
      const refItem = items.find(i => !i.classList.contains('gridads-tile') && i.tagName !== 'SCRIPT');
      if (!refItem) return;
      
      const tagName = refItem.tagName;

      ads.forEach(ad => {
          if (ad.status !== 'active' || document.getElementById('gridads-' + ad.id)) return;
          
          const el = createAd(ad, tagName, refItem);
          if(!el) return;

          const pos = Math.max(0, ad.position - 1);
          if(pos < items.length) {
              // Check if we are inserting into the correct container
              if(items[pos].parentNode === container) container.insertBefore(el, items[pos]);
          } else {
              container.appendChild(el);
          }
      });
      setTimeout(syncHeights, 150);
  }

  async function init() {
      try {
        console.log('[GridAds] Fetching live ads from:', CONFIG.apiEndpoint);
        const res = await fetch(CONFIG.apiEndpoint);
        if(!res.ok) throw new Error(\`Server returned \${res.status}\`);
        
        const liveData = await res.json();
        console.log(\`[GridAds] \${liveData.length} active campaigns found.\`);
        
        if(Array.isArray(liveData) && liveData.length > 0) {
            if(document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => run(liveData));
            } else {
                run(liveData);
            }
            
            // Observer to handle infinite scroll / dynamic loading / client-side routing
            let t;
            const observer = new MutationObserver((mutations) => { 
                let shouldRun = false;
                for(const m of mutations) {
                    if(m.addedNodes.length > 0) shouldRun = true;
                }
                if(shouldRun) {
                    clearTimeout(t); 
                    t = setTimeout(() => { run(liveData); syncHeights(); }, 300); 
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
            window.addEventListener('resize', () => {
                clearTimeout(t);
                t = setTimeout(syncHeights, 150);
            });
        }
      } catch(e) { console.error('[GridAds] Connection Failed:', e); }
  }
  
  init();
})();
  `;

  res.type('application/javascript').send(scriptContent);
};
