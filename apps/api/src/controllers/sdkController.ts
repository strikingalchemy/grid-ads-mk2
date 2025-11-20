
import { Request, Response } from 'express';

export const getSdk = (req: Request, res: Response) => {
  // CRITICAL HEADERS for CORB/CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  const scriptContent = `
(function() {
  console.log('[GridAds] v12.0 (Live External SDK) Initialized');
  
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const srcUrl = new URL(currentScript.src);
  const storeId = srcUrl.searchParams.get('store_id');
  const apiBase = srcUrl.origin;

  if (!storeId) {
    console.error('[GridAds] Missing store_id in script URL.');
    return;
  }

  const CONFIG = {
    storeId: storeId,
    apiEndpoint: \`\${apiBase}/storefront/\${storeId}/ads\`
  };

  // --- CORE LOGIC ---
  function detectGrid(root) {
    // Priority 1: Explicit Selectors (Cornerstone, Roots, etc.)
    const explicitSelectors = ['ul.productGrid', '.rca-productGrid', '.productGrid', '.product-list', '[data-test="product-grid"]'];
    for (const sel of explicitSelectors) {
        const match = root.querySelector(sel);
        if (match && match.children.length > 0) {
            console.log('[GridAds] Grid detected via selector:', sel);
            const items = Array.from(match.children).filter(c => c.tagName === 'LI' || c.classList.contains('product') || c.classList.contains('card'));
            return { container: match, items };
        }
    }
    
    // Priority 2: Visual Density Scan (Fallback)
    const cards = Array.from(root.querySelectorAll('.product, .card, article'));
    if (cards.length > 2) {
        const parent = cards[0].parentElement;
        if (parent) {
             console.log('[GridAds] Grid detected via scanning:', parent.className);
             return { container: parent, items: Array.from(parent.children) };
        }
    }
    
    return null;
  }

  function createAd(ad, tagName, refItem) {
    const id = 'gridads-' + ad.id;
    if(document.getElementById(id)) return null;

    const wrapper = document.createElement(tagName);
    wrapper.id = id;
    // Clone classes from reference item to match theme layout
    wrapper.className = refItem ? refItem.className + ' gridads-tile' : 'product gridads-tile';
    
    // Clone layout properties explicitly to ensure it behaves like a grid item
    if (refItem) {
        const s = window.getComputedStyle(refItem);
        wrapper.style.float = s.float;
        wrapper.style.flex = s.flex;
        wrapper.style.display = s.display;
        wrapper.style.margin = s.margin;
        wrapper.style.padding = s.padding;
        wrapper.style.width = s.width; // Help with sizing
        wrapper.style.boxSizing = 'border-box';
        
        // Apply custom row spacing if configured
        if (ad.styles && ad.styles.marginBottom) {
            wrapper.style.setProperty('margin-bottom', ad.styles.marginBottom + 'px', 'important');
        }
    }

    const s = ad.styles || {};
    const inner = document.createElement('article');
    inner.className = 'card'; // Standard BC class
    // Force inner card styling
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

    let media = ad.showMedia ? (ad.type === 'video' ? \`<video src="\${ad.mediaUrl}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${ad.mediaFit || 'cover'};z-index:0;"></video>\` : \`<img src="\${ad.mediaUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:\${ad.mediaFit || 'cover'};z-index:0;" />\`) : '';
    const justify = s.verticalAlignment === 'top' ? 'flex-start' : s.verticalAlignment === 'bottom' ? 'flex-end' : 'center';
    const align = s.contentAlignment === 'left' ? 'flex-start' : s.contentAlignment === 'right' ? 'flex-end' : 'center';
    const content = \`<div style="position:relative; z-index:2; width:100%; flex:1; padding:\${s.contentPadding || 20}px; display:flex; flex-direction:column; justify-content:\${justify}; align-items:\${align}; text-align:\${s.contentAlignment || 'center'};">\` +
        (ad.showHeadline ? \`<h3 style="margin:0 0 12px; color:\${s.headlineColor}; font-size:\${s.headlineFontSize}px; font-weight:\${s.headlineFontWeight}; line-height:\${s.headlineLineHeight}; letter-spacing:\${s.headlineLetterSpacing}px;">\${ad.headline}</h3>\` : '') +
        (ad.showDescription ? \`<p style="margin:0 0 24px; color:\${s.descriptionColor}; font-size:\${s.descriptionFontSize}px; font-weight:\${s.descriptionFontWeight}; line-height:\${s.descriptionLineHeight}; letter-spacing:\${s.descriptionLetterSpacing}px;">\${ad.description}</p>\` : '') +
        (ad.showButton ? \`<span style="display:inline-block; padding:12px 32px; border-radius:999px; background-color:\${s.buttonColor}; color:\${s.buttonTextColor}; font-weight:600; font-size:14px;">\${ad.buttonText}</span>\` : '') +
      '</div>';
    const overlay = \`<div style="position:absolute;inset:0;background-color:\${s.overlayColor || '#000'};opacity:\${s.overlayOpacity || 0};z-index:1;"></div>\`;
    inner.innerHTML = media + overlay + content;
    wrapper.appendChild(inner);
    return wrapper;
  }

  function syncHeights() {
      requestAnimationFrame(() => {
          document.querySelectorAll('.gridads-tile').forEach(ad => {
              const sibling = ad.nextElementSibling || ad.previousElementSibling;
              // Match height of sibling product card if available
              if(sibling && sibling.offsetHeight > 0 && Math.abs(ad.offsetHeight - sibling.offsetHeight) > 2) {
                  ad.style.height = sibling.offsetHeight + 'px';
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
      const refItem = items[0];
      const tagName = refItem.tagName;

      ads.forEach(ad => {
          const el = createAd(ad, tagName, refItem);
          if(!el) return;
          const pos = Math.max(0, ad.position - 1);
          if(pos < items.length) container.insertBefore(el, items[pos]);
          else container.appendChild(el);
      });
      setTimeout(syncHeights, 100);
  }

  async function init() {
      try {
        console.log('[GridAds] Fetching live ads from:', CONFIG.apiEndpoint);
        const res = await fetch(CONFIG.apiEndpoint);
        if(!res.ok) throw new Error(\`Server returned \${res.status}\`);
        
        const liveData = await res.json();
        console.log('[GridAds] Campaigns found:', liveData.length);
        
        if(Array.isArray(liveData) && liveData.length > 0) {
            if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => run(liveData));
            else run(liveData);
            
            // Observer to handle infinite scroll / dynamic loading
            let t;
            new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { run(liveData); syncHeights(); }, 300); }).observe(document.body, { childList: true, subtree: true });
            window.addEventListener('resize', () => syncHeights());
        }
      } catch(e) { console.error('[GridAds] Connection Failed:', e); }
  }
  
  init();
})();
  `;

  res.type('application/javascript').send(scriptContent);
};
