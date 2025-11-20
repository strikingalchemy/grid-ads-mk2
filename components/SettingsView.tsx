import React, { useState, useMemo, useEffect } from 'react';
import { Check, Search, Eye, X, Clock, Server, Globe, Layers } from './ui/Icons';
import { AdConfig } from '../types';
import { updateStoreConfig } from '../services/api';

interface SettingsViewProps {
  ads?: AdConfig[];
}

const SettingsView: React.FC<SettingsViewProps> = ({ ads = [] }) => {
  const [copied, setCopied] = useState(false);
  const [apiBase, setApiBase] = useState(() => localStorage.getItem('gridads_api_url') || '');
  const [storeHash, setStoreHash] = useState(() => localStorage.getItem('gridads_store_hash') || '');
  const [bcToken, setBcToken] = useState(() => localStorage.getItem('gridads_bc_token') || '');
  
  // Connection States
  const [isSaved, setIsSaved] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Auto-save to local storage for persistence across reloads
  useEffect(() => localStorage.setItem('gridads_api_url', apiBase), [apiBase]);
  useEffect(() => localStorage.setItem('gridads_store_hash', storeHash), [storeHash]);
  useEffect(() => localStorage.setItem('gridads_bc_token', bcToken), [bcToken]);

  const handleApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setApiBase(e.target.value);
      setConnectionError(''); // Clear error when typing
  };

  const handleSaveConfig = async () => {
      setConnectionError('');
      
      // Validation
      if (!storeHash || !bcToken) {
          setConnectionError("Store Hash and Access Token are required.");
          return;
      }
      if (!apiBase) {
          setConnectionError("API Base URL is required.");
          return;
      }

      // Normalize URL (Add https if missing)
      let normalizedApiBase = apiBase.trim();
      if (!normalizedApiBase.startsWith('http://') && !normalizedApiBase.startsWith('https://')) {
          if (normalizedApiBase.includes('localhost')) {
              normalizedApiBase = 'http://' + normalizedApiBase;
          } else {
              normalizedApiBase = 'https://' + normalizedApiBase;
          }
          setApiBase(normalizedApiBase); // Update state with fixed URL
      }
      
      setIsConnecting(true);
      try {
          // Force the update service to use the normalized URL immediately
          localStorage.setItem('gridads_api_url', normalizedApiBase);
          
          await updateStoreConfig(storeHash, bcToken);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
      } catch (e: any) {
          console.error("Connection Test Failed:", e);
          setConnectionError(e.message || "Failed to connect to backend. Check URL and Server logs.");
      } finally {
          setIsConnecting(false);
      }
  };

  const installScript = useMemo(() => {
    // v6.0: Hybrid Live Strategy
    const embeddedAds = JSON.stringify(ads);
    
    // Sanitize API URL (remove trailing slash)
    const cleanApiUrl = apiBase.replace(/\/$/, '');
    const storefrontEndpoint = `${cleanApiUrl}/storefront/${storeHash}/ads`;

    return `<script>
(function() {
  // GridAds v6.0 (Live Hybrid)
  // Generated at: ${new Date().toLocaleTimeString()}
  
  const CONFIG = {
    storeId: '${storeHash}',
    apiEndpoint: '${storefrontEndpoint}',
    fallbackAds: ${embeddedAds} // Safety backup
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
        if (ad.styles.marginBottom) {
            const cur = parseFloat(s.marginBottom) || 0;
            wrapper.style.setProperty('margin-bottom', (cur + ad.styles.marginBottom) + 'px', 'important');
        }
    }

    const s = ad.styles;
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
        border: \${s.borderWidth}px solid \${s.borderColor};
        border-radius: \${s.borderRadius}px;
        \${s.backgroundType === 'gradient' ? \`background-image: \${s.backgroundGradient};\` : \`background-color: \${s.backgroundColor};\`}
        cursor: pointer; box-sizing: border-box; z-index: 10;
        opacity: 1; visibility: visible;
    \`;
    
    inner.onclick = function() { window.location.href = ad.destinationUrl; };

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
      <div style="position:relative; z-index:2; width:100%; flex:1; padding:\${s.contentPadding}px; display:flex; flex-direction:column; justify-content:\${justify}; align-items:\${align}; text-align:\${s.contentAlignment};">
        \${ad.showHeadline ? \`<h3 style="margin:0 0 12px 0; color:\${s.headlineColor}; font-size:\${s.headlineFontSize}px; font-weight:\${s.headlineFontWeight}; line-height:\${s.headlineLineHeight}; letter-spacing:\${s.headlineLetterSpacing}px; font-family:inherit;">\${ad.headline}</h3>\` : ''}
        \${ad.showDescription ? \`<p style="margin:0 0 24px 0; color:\${s.descriptionColor}; font-size:\${s.descriptionFontSize}px; font-weight:\${s.descriptionFontWeight}; line-height:\${s.descriptionLineHeight}; letter-spacing:\${s.descriptionLetterSpacing}px; font-family:inherit;">\${ad.description}</p>\` : ''}
        \${ad.showButton ? \`<span style="display:inline-block; text-decoration:none; padding:12px 32px; border-radius:999px; background-color:\${s.buttonColor}; color:\${s.buttonTextColor}; font-weight:600; font-size:14px; font-family:inherit;">\${ad.buttonText}</span>\` : ''}
      </div>
    \`;
    
    const overlay = \`<div style="position:absolute;inset:0;background-color:\${s.overlayColor};opacity:\${s.overlayOpacity};z-index:1;pointer-events:none;"></div>\`;

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
      let adsToRun = CONFIG.fallbackAds;
      
      // Attempt Live Fetch
      try {
        if(CONFIG.apiEndpoint && !CONFIG.apiEndpoint.includes('localhost')) {
            const res = await fetch(CONFIG.apiEndpoint);
            if(res.ok) {
                const liveData = await res.json();
                if(Array.isArray(liveData) && liveData.length > 0) {
                    console.log('[GridAds] Live config loaded.');
                    adsToRun = liveData;
                }
            }
        }
      } catch(e) {
          console.log('[GridAds] Offline mode (using fallback).');
      }

      if(document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => run(adsToRun));
      } else {
          run(adsToRun);
      }
      
      let t;
      new MutationObserver(() => {
          clearTimeout(t);
          t = setTimeout(() => { run(adsToRun); syncHeights(); }, 200);
      }).observe(document.body, { childList: true, subtree: true });
      
      window.addEventListener('resize', () => syncHeights());
  }
  
  init();

})();
</script>`;
  }, [ads, apiBase, storeHash]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-20">
      
      {/* Server Configuration */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Server Configuration</h2>
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">API Base URL</label>
                    <div className="relative">
                        <Server className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={apiBase}
                            onChange={handleApiUrlChange}
                            placeholder="https://api.myapp.com" 
                            className="block w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg shadow-sm py-2.5 text-sm text-slate-700 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Point this to your deployed API or ngrok tunnel for live updates.</p>
                    {apiBase && apiBase.includes('bigcommerce') && (
                        <p className="text-xs text-red-500 mt-1 font-bold">Warning: This should point to YOUR backend, not the BigCommerce store.</p>
                    )}
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Store Hash</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={storeHash}
                            onChange={(e) => setStoreHash(e.target.value)}
                            placeholder="store_abc123" 
                            className="block w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg shadow-sm py-2.5 text-sm text-slate-700 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">Identifier for this specific store instance.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Catalog Integration */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Catalog Integration</h2>
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-lg">
                    <Layers className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">BigCommerce API Connection</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Connect to pull your Category structure directly into the Ad Builder.</p>
                    
                    <div className="max-w-md">
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Access Token</label>
                        <div className="flex gap-3">
                            <input 
                                type="password" 
                                value={bcToken}
                                onChange={(e) => setBcToken(e.target.value)}
                                placeholder="••••••••••••••••••••" 
                                className={`block w-full bg-slate-50 border rounded-lg shadow-sm py-2.5 px-3 text-sm ${connectionError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'}`}
                            />
                            <button 
                                onClick={handleSaveConfig}
                                disabled={isConnecting}
                                className={`px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 flex-shrink-0 transition-colors flex items-center gap-2 ${isConnecting ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isConnecting ? (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : isSaved ? (
                                    <Check className="w-4 h-4" />
                                ) : null}
                                {isConnecting ? 'Connecting...' : isSaved ? 'Saved' : 'Connect'}
                            </button>
                        </div>
                        {connectionError ? (
                            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-[10px] text-red-700">
                                <strong>Connection Failed:</strong> {connectionError}
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 mt-2">Requires <strong>Products (Read-Only)</strong> scope.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Script Installation */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Storefront Integration</h2>
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
           <div className="p-6 bg-slate-50/50">
               <div className="flex items-center justify-between mb-4">
                  <div>
                      <div className="flex items-center gap-3">
                          <h3 className="text-sm font-bold text-slate-900">Manual Installation Code (v6.0)</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">LIVE HYBRID</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Auto-API Connection + {ads.length} Fallback Campaigns.</p>
                  </div>
                  <button 
                   onClick={copyToClipboard}
                   className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                 >
                   {copied ? <Check className="w-3 h-3" /> : null}
                   {copied ? 'Copied' : 'Copy Code'}
                 </button>
               </div>
               
               <div className="relative group">
                 <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-800 custom-scrollbar max-h-96">
                   <code className="text-xs font-mono text-blue-300 whitespace-pre-wrap">
                     {installScript}
                   </code>
                 </pre>
               </div>
               
               <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs border border-emerald-100 flex gap-2">
                   <Globe className="w-4 h-4 flex-shrink-0" />
                   <span><strong>Pro Tip:</strong> If your API is correctly configured, changes in the editor will appear on your storefront instantly without re-pasting this code.</span>
               </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;