
import { AdConfig, AdType, AdStyles } from './types';

declare global {
  interface Window {
    GridAdsConfig: {
      storeId: string;
      apiEndpoint?: string;
      fallbackAds: AdConfig[];
    };
  }
}

/**
 * GridAds Injector v6.0 (Hybrid Live)
 */
class GridAdsInjector {
  private ads: AdConfig[] = [];
  private observer: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    console.log('GridAds: Initializing SDK v6.0...');
    const config = window.GridAdsConfig || { storeId: 'demo', fallbackAds: [] };
    
    // Start with fallback
    this.ads = config.fallbackAds;

    // Attempt Fetch
    if (config.apiEndpoint && !config.apiEndpoint.includes('localhost')) {
        try {
            const res = await fetch(config.apiEndpoint);
            if (res.ok) {
                const liveData = await res.json();
                if (Array.isArray(liveData)) {
                    console.log(`[GridAds] Synced ${liveData.length} active campaigns from server.`);
                    this.ads = liveData;
                }
            }
        } catch (e) {
            console.warn('[GridAds] API unreachable. Using embedded fallback.');
        }
    }

    if (this.ads.length > 0) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.run(this.ads));
        } else {
            this.run(this.ads);
        }
        window.addEventListener('resize', this.debounce(() => this.syncHeights(), 150));
        this.setupObserver();
    }
  }

  private debounce(func: Function, wait: number) {
    let timeout: any;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  private setupObserver() {
    this.observer = new MutationObserver(this.debounce((mutations: MutationRecord[]) => {
      let shouldRun = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) shouldRun = true;
      }
      if (shouldRun) {
          this.run(this.ads);
          this.syncHeights();
      }
    }, 200));
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private detectGrid(root: HTMLElement) {
    const explicitSelectors = [
        'ul.productGrid', '.rca-productGrid', '.productGrid', 
        '#product-listing-container ul', '[data-product-grid]'
    ];
    
    for (const sel of explicitSelectors) {
        const match = root.querySelector(sel);
        if (match && match.children.length > 0) {
            return { container: match as HTMLElement, items: Array.from(match.children) };
        }
    }

    // Visual Density Fallback
    let bestContainer: HTMLElement | null = null;
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

  private createAd(ad: any, tagName: string, referenceItem: Element | null) {
    const id = 'gridads-' + ad.id;
    if(document.getElementById(id)) return null;

    const wrapper = document.createElement(tagName);
    wrapper.id = id;
    wrapper.classList.add('gridads-tile');
    
    if (referenceItem) {
        wrapper.className = referenceItem.className + ' gridads-tile';
        const style = window.getComputedStyle(referenceItem);
        ['margin','padding','float','flex','display','width'].forEach(p => (wrapper.style as any)[p] = style.getPropertyValue(p));
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.opacity = '1';
        wrapper.style.visibility = 'visible';
        wrapper.style.zIndex = '10';
        
        if (ad.styles.marginBottom) {
            const cur = parseFloat(style.marginBottom) || 0;
            wrapper.style.setProperty('margin-bottom', (cur + ad.styles.marginBottom) + 'px', 'important');
        }
    }
    
    const s = ad.styles;
    const inner = document.createElement('article');
    if (referenceItem) {
        const refInner = referenceItem.querySelector('article') || referenceItem.querySelector('.card') || referenceItem.firstElementChild;
        if(refInner && refInner.tagName !== 'IMG') inner.className = refInner.className;
        else inner.className = 'card';
    } else {
        inner.className = 'card';
    }

    inner.style.cssText = `
      position: relative; width: 100%; height: 100%; min-height: 100%;
      display: flex; flex-direction: column; overflow: hidden;
      border: ${s.borderWidth}px solid ${s.borderColor};
      border-radius: ${s.borderRadius}px;
      ${s.backgroundType === 'gradient' ? `background-image: ${s.backgroundGradient};` : `background-color: ${s.backgroundColor};`}
      cursor: pointer; box-sizing: border-box; z-index: 10; opacity: 1; visibility: visible;
    `;
    
    inner.onclick = () => window.location.href = ad.destinationUrl;

    let media = '';
    if (ad.showMedia) {
       const fit = ad.mediaFit || 'cover';
       if (ad.type === 'video') {
         media = `<video src="${ad.mediaUrl}" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};z-index:0;pointer-events:none;"></video>`;
       } else {
         media = `<img src="${ad.mediaUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};z-index:0;pointer-events:none;" />`;
       }
    }

    const justify = s.verticalAlignment === 'top' ? 'flex-start' : s.verticalAlignment === 'bottom' ? 'flex-end' : 'center';
    const align = s.contentAlignment === 'left' ? 'flex-start' : s.contentAlignment === 'right' ? 'flex-end' : 'center';
    
    const content = `
      <div style="position:relative; z-index:2; width:100%; flex:1; padding:${s.contentPadding}px; display:flex; flex-direction:column; justify-content:${justify}; align-items:${align}; text-align:${s.contentAlignment};">
        ${ad.showHeadline ? `<h3 style="margin:0 0 12px 0; color:${s.headlineColor}; font-size:${s.headlineFontSize}px; font-weight:${s.headlineFontWeight}; line-height:${s.headlineLineHeight}; letter-spacing:${s.headlineLetterSpacing}px; font-family: inherit;">${ad.headline}</h3>` : ''}
        ${ad.showDescription ? `<p style="margin:0 0 24px 0; color:${s.descriptionColor}; font-size:${s.descriptionFontSize}px; font-weight:${s.descriptionFontWeight}; line-height:${s.descriptionLineHeight}; letter-spacing:${s.descriptionLetterSpacing}px; font-family: inherit;">${ad.description}</p>` : ''}
        ${ad.showButton ? `<span style="display:inline-block; text-decoration:none; padding:12px 32px; border-radius:999px; background-color:${s.buttonColor}; color:${s.buttonTextColor}; font-weight:600; font-size:14px; font-family: inherit;">${ad.buttonText}</span>` : ''}
      </div>
    `;
    
    const overlay = `<div style="position:absolute;inset:0;background-color:${s.overlayColor};opacity:${s.overlayOpacity};z-index:1;pointer-events:none;"></div>`;

    inner.innerHTML = media + overlay + content;
    wrapper.appendChild(inner);
    return wrapper;
  }

  private syncHeights() {
    requestAnimationFrame(() => {
        const ads = document.querySelectorAll('.gridads-tile') as NodeListOf<HTMLElement>;
        ads.forEach(ad => {
            const parent = ad.parentElement;
            if(!parent) return;
            const sibling = Array.from(parent.children).find(c => !c.classList.contains('gridads-tile') && (c as HTMLElement).offsetHeight > 0) as HTMLElement;
            if (sibling && Math.abs(ad.offsetHeight - sibling.offsetHeight) > 2) {
                ad.style.height = sibling.offsetHeight + 'px';
                const inner = ad.querySelector('article') || ad.firstElementChild;
                if(inner) (inner as HTMLElement).style.height = '100%';
            }
        });
    });
  }

  private run(ads: AdConfig[]) {
    const res = this.detectGrid(document.body);
    if (!res) return;
    const { container, items } = res;
    const refItem = items.find(i => !i.classList.contains('gridads-tile') && i.tagName !== 'SCRIPT');
    if (!refItem) return;
    const tagName = refItem.tagName;

    ads.forEach(ad => {
      if (ad.status !== 'active' || document.getElementById('gridads-' + ad.id)) return;
      const el = this.createAd(ad, tagName, refItem);
      if(!el) return;

      const pos = Math.max(0, ad.position - 1);
      if (pos < items.length) {
        if(items[pos].parentNode === container) container.insertBefore(el, items[pos]);
      } else {
        container.appendChild(el);
      }
    });
    this.syncHeights();
  }
}

new GridAdsInjector();
