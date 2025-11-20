
import React, { useMemo } from 'react';
import { AdConfig, AdType, Product } from '../types';
import { MOCK_PRODUCTS } from '../services/mockData';
import { calculateInjection } from '../lib/injectorLogic';

interface LivePreviewProps {
  ad: AdConfig;
  products?: Product[];
  simulatedColumns?: number;
  simulatedGap?: number;
}

const LivePreview: React.FC<LivePreviewProps> = ({ 
  ad, 
  products = MOCK_PRODUCTS,
  simulatedColumns = 3,
  simulatedGap = 32
}) => {
  
  const gridItems = useMemo(() => {
    return calculateInjection(products, [ad]);
  }, [ad, products]);

  const getAlignmentClasses = (vAlign: string, hAlign: string) => {
    let classes = "flex flex-col w-full h-full z-20 relative ";
    if (vAlign === 'top') classes += "justify-start ";
    else if (vAlign === 'center') classes += "justify-center ";
    else classes += "justify-end ";

    if (hAlign === 'left') classes += "items-start text-left ";
    else if (hAlign === 'center') classes += "items-center text-center ";
    else classes += "items-end text-right ";
    return classes;
  };

  const getObjectFitClass = (fit: string) => {
    switch (fit) {
        case 'contain': return 'object-contain';
        case 'fill': return 'object-fill';
        default: return 'object-cover';
    }
  };

  const getGridColsClass = (cols: number) => {
    switch(cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 4: return 'grid-cols-4';
      default: return 'grid-cols-3';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-4 flex-shrink-0">
         <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/20"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500/20"></div>
            <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/20"></div>
         </div>
         <div className="flex-1 flex justify-center px-20">
            <div className="w-full max-w-md h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center text-xs text-slate-400 font-medium shadow-sm overflow-hidden whitespace-nowrap px-2">
                <span className="text-slate-400 mr-1">https://</span>
                store.mybigcommerce.com/summer-collection
            </div>
         </div>
         <div className="w-16 flex justify-end"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
        <div className="bg-white border-b border-slate-100 mb-8 sticky top-0 z-30 opacity-95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-8 py-6">
             <div className="flex justify-between items-center mb-6">
                <div className="h-6 w-32 bg-slate-900 rounded-sm"></div>
                <div className="flex gap-6 text-sm font-medium text-slate-500">
                    <span>Shop</span>
                    <span>Collections</span>
                    <span>About</span>
                </div>
             </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 pb-20">
            <div className="h-10 w-64 bg-slate-100 rounded mb-8"></div>
            <div 
              id="live-preview-grid" 
              className={`grid ${getGridColsClass(simulatedColumns)}`}
              style={{ gap: `${simulatedGap}px` }}
            >
            {gridItems.map((item: any, index: number) => {
                if (item.isAd) {
                const config = item.config as AdConfig;
                const backgroundStyle = config.styles.backgroundType === 'gradient' 
                    ? { backgroundImage: config.styles.backgroundGradient }
                    : { backgroundColor: config.styles.backgroundColor };
                
                const objectFitClass = getObjectFitClass(config.mediaFit);

                return (
                    <div 
                    key={`ad-${index}`} 
                    className="relative group w-full aspect-[3/4] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-black/5"
                    style={{
                        border: `${config.styles.borderWidth}px solid ${config.styles.borderColor}`,
                        borderRadius: `${config.styles.borderRadius}px`,
                        marginBottom: `${config.styles.marginBottom || 0}px`,
                        ...backgroundStyle
                    }}
                    >
                    {config.showMedia && (
                      <div className="absolute inset-0 z-0">
                          {config.type === AdType.VIDEO && config.mediaUrl ? (
                          <video 
                              src={config.mediaUrl}
                              className={`w-full h-full ${objectFitClass}`}
                              autoPlay
                              muted
                              loop
                              playsInline
                          />
                          ) : config.mediaUrl ? (
                          <img 
                              src={config.mediaUrl} 
                              alt={config.altText} 
                              className={`w-full h-full ${objectFitClass}`}
                          />
                          ) : null}
                      </div>
                    )}
                    
                    <div 
                        className="absolute inset-0 z-10 transition-opacity duration-300"
                        style={{ 
                        backgroundColor: config.styles.overlayColor,
                        opacity: config.styles.overlayOpacity 
                        }}
                    />

                    <div 
                      className={getAlignmentClasses(config.styles.verticalAlignment, config.styles.contentAlignment)}
                      style={{ padding: `${config.styles.contentPadding || 24}px` }}
                    >
                        {config.showHeadline && config.headline && (
                        <h3 
                            className="mb-3 drop-shadow-sm transition-all duration-200"
                            style={{ 
                                color: config.styles.headlineColor,
                                fontSize: `${config.styles.headlineFontSize || 32}px`,
                                lineHeight: config.styles.headlineLineHeight || 1.2,
                                letterSpacing: `${config.styles.headlineLetterSpacing || 0}px`,
                                fontWeight: config.styles.headlineFontWeight || 700
                            }}
                        >
                            {config.headline}
                        </h3>
                        )}
                        
                        {config.showDescription && config.description && (
                        <p 
                            className="mb-6 max-w-[90%] drop-shadow-sm transition-all duration-200"
                            style={{ 
                                color: config.styles.descriptionColor,
                                fontSize: `${config.styles.descriptionFontSize || 16}px`,
                                lineHeight: config.styles.descriptionLineHeight || 1.5,
                                letterSpacing: `${config.styles.descriptionLetterSpacing || 0}px`,
                                fontWeight: config.styles.descriptionFontWeight || 500
                            }}
                        >
                            {config.description}
                        </p>
                        )}

                        {config.showButton && config.buttonText && (
                        <button
                            className="py-3 px-8 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                            style={{
                            backgroundColor: config.styles.buttonColor,
                            color: config.styles.buttonTextColor,
                            }}
                        >
                            {config.buttonText}
                        </button>
                        )}
                    </div>
                    </div>
                );
                }

                const product = item as Product;
                return (
                <div key={`prod-${product.id}`} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-slate-100">
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    </div>
                    <h3 className="text-base font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">${product.price.toFixed(2)}</p>
                </div>
                );
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;