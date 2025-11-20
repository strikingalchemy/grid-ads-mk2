
import React, { useState, useRef, useEffect } from 'react';
import { AdConfig, AdStatus, AdType, ContentAlignment, VerticalAlignment, MediaFit, Category } from '../types';
import { fetchCategories } from '../services/api';
import LivePreview from './LivePreview';
import { Video, Image, Check, Plus, Search, X, ChevronDown, Eye, EyeOff, LayoutDashboard } from './ui/Icons';

interface AdBuilderProps {
  initialData?: AdConfig | null;
  onSave: (ad: AdConfig) => void;
  onCancel: () => void;
}

const DEFAULT_AD: AdConfig = {
  id: '',
  name: 'New Campaign',
  status: AdStatus.DRAFT,
  type: AdType.IMAGE,
  mediaUrl: 'https://picsum.photos/600/800',
  mediaFit: 'cover',
  showMedia: true,
  altText: '',
  destinationUrl: '',
  headline: 'Summer Vibes',
  showHeadline: true,
  description: 'Get 50% off all beachwear this week only.',
  showDescription: true,
  buttonText: 'Shop Now',
  showButton: true,
  position: 4,
  frequency: 0,
  gridSelector: '',
  itemSelector: '',
  styles: {
    borderColor: '#e5e7eb',
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: '#ffffff',
    backgroundType: 'solid',
    backgroundGradient: 'linear-gradient(90deg, #000 0%, #333 100%)',
    textColor: '#ffffff',
    headlineColor: '#ffffff',
    headlineFontSize: 32,
    headlineFontWeight: 700,
    headlineLineHeight: 1.1,
    headlineLetterSpacing: -0.5,
    descriptionColor: '#f3f4f6',
    descriptionFontSize: 16,
    descriptionFontWeight: 500,
    descriptionLineHeight: 1.5,
    descriptionLetterSpacing: 0,
    buttonColor: '#111827',
    buttonTextColor: '#ffffff',
    overlayOpacity: 0.3,
    overlayColor: '#000000',
    contentAlignment: 'center',
    verticalAlignment: 'center',
    contentPadding: 24,
    marginBottom: 30
  },
  schedule: { startDate: new Date().toISOString().slice(0, 16), endDate: null },
  targetCategories: [],
  excludedCategories: [],
  targetBrands: [],
  storeId: 'store_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// --- Helpers defined outside to prevent re-mounting/focus loss ---

const SectionLabel = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-sm font-bold text-slate-800 mb-3">{children}</label>
);

const InputGroup = ({ 
  label, 
  children, 
  subLabel,
  isVisible,
  onToggleVisibility
}: { 
  label: string; 
  children?: React.ReactNode, 
  subLabel?: string,
  isVisible?: boolean,
  onToggleVisibility?: () => void
}) => (
  <div className="mb-8 border border-slate-100 rounded-xl p-5 bg-slate-50/30 hover:bg-slate-50/80 transition-colors">
    <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-bold text-slate-800">{label}</label>
        {onToggleVisibility && (
            <button 
                onClick={onToggleVisibility} 
                className={`transition-all p-1.5 rounded-md ${isVisible ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                title={isVisible ? "Hide this element" : "Show this element"}
            >
                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
        )}
    </div>
    
    <div className={`transition-all duration-300 ${isVisible === false ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        {children}
    </div>
    
    {subLabel && <p className="mt-2 text-xs text-slate-500">{subLabel}</p>}
  </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props}
    className="block w-full rounded-lg border-gray-200 bg-white shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm py-2.5 px-3 transition-colors hover:border-gray-300"
  />
);

// --- Improved Modern Color Picker (High End) ---
const ModernColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 group">
    {/* Color Swatch */}
    <div className="relative h-10 w-10 rounded-full shadow-inner ring-1 ring-black/5 overflow-hidden flex-shrink-0 cursor-pointer">
        <div className="absolute inset-0" style={{ backgroundColor: value }}></div>
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
    </div>
    
    <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
        <div className="flex items-center">
            <span className="text-xs text-slate-400 mr-0.5 select-none">#</span>
            <input 
                type="text" 
                value={value.replace('#', '')}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]*$/.test(val)) {
                        onChange('#' + val);
                    }
                }}
                maxLength={6}
                className="bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 w-full uppercase font-mono"
            />
        </div>
    </div>
  </div>
);

// --- Gradient Builder ---
const GradientBuilder = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const parseGradient = (grad: string) => {
        try {
            if (!grad || !grad.includes('linear-gradient')) return { deg: 90, start: '#000000', end: '#ffffff' };
            const match = grad.match(/linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]{6}),\s*(#[a-fA-F0-9]{6})\)/);
            if (match) {
                return { deg: parseInt(match[1]), start: match[2], end: match[3] };
            }
            return { deg: 90, start: '#000000', end: '#ffffff' };
        } catch {
            return { deg: 90, start: '#000000', end: '#ffffff' };
        }
    };

    const { deg, start, end } = parseGradient(value);

    const updateGradient = (newDeg: number, newStart: string, newEnd: string) => {
        onChange(`linear-gradient(${newDeg}deg, ${newStart}, ${newEnd})`);
    };

    return (
        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="h-16 w-full rounded-lg shadow-sm border border-slate-200 ring-1 ring-black/5" style={{ background: value }}></div>
            
            <div className="grid grid-cols-2 gap-3">
                <ModernColorPicker label="Start Color" value={start} onChange={(c) => updateGradient(deg, c, end)} />
                <ModernColorPicker label="End Color" value={end} onChange={(c) => updateGradient(deg, start, c)} />
            </div>
            
            <div className="pt-2">
                <RangeControl 
                    label="Angle"
                    value={deg}
                    onChange={(v: number) => updateGradient(v, start, end)}
                    min={0} max={360} step={5} unit="°"
                />
            </div>
        </div>
    );
};

// --- Range Control Helper (Polished) ---
const RangeControl = ({ label, value, onChange, min, max, step, unit = '' }: any) => (
    <div className="space-y-2 pt-1">
        <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600">{label}</span>
            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 min-w-[3.5rem] text-center font-medium">
                {value ?? min}{unit}
            </span>
        </div>
        <div className="relative flex items-center group h-5">
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step}
                value={value ?? min}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-all hover:bg-slate-300"
            />
        </div>
    </div>
);

// --- Category Selector Component ---
const CategorySelector = ({ 
  selectedIds, 
  onToggle, 
  label,
  emptyText,
  categories // NEW Prop
}: { 
  selectedIds: string[], 
  onToggle: (id: string) => void,
  label: string,
  emptyText: string,
  categories: Category[]
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderCategoryTree = (cats: Category[], level = 0) => {
    return cats.map(cat => {
      const isSelected = selectedIds.includes(cat.id);
      const isMatch = searchTerm === '' || cat.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!isMatch && (!cat.children || cat.children.length === 0)) return null;

      return (
        <div key={cat.id}>
           {(isMatch) && (
             <div 
               className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
               style={{ paddingLeft: `${level * 12 + 12}px` }}
               onClick={() => onToggle(cat.id)}
             >
               <div className="flex items-center gap-2">
                 <span className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                   {isSelected && <Check className="w-3 h-3 text-white" />}
                 </span>
                 <span className="text-sm text-slate-700">{cat.name}</span>
               </div>
             </div>
           )}
           {cat.children && renderCategoryTree(cat.children, level + 1)}
        </div>
      );
    });
  };

  const getCategoryName = (id: string, cats: Category[]): string | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat.name;
      if (cat.children) {
        const found = getCategoryName(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  };

  return (
    <div className="relative mb-4" ref={dropdownRef}>
       <label className="text-xs text-slate-500 mb-1.5 block font-medium uppercase tracking-wide">{label}</label>
       <div 
          className="min-h-[42px] border border-gray-200 rounded-lg bg-white p-1.5 flex flex-wrap gap-1.5 cursor-text focus-within:ring-1 focus-within:ring-slate-900 focus-within:border-slate-900 transition-shadow"
          onClick={() => setIsOpen(true)}
       >
          {selectedIds.length === 0 && (
             <span className="text-sm text-slate-400 px-2 py-1 select-none italic">{emptyText}</span>
          )}
          {selectedIds.map(id => (
             <span key={id} className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 animate-fadeIn">
                {getCategoryName(id, categories) || id}
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                  className="ml-1.5 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
             </span>
          ))}
          <input 
            className="flex-1 min-w-[60px] bg-transparent border-none p-1 text-sm focus:ring-0"
            onFocus={() => setIsOpen(true)}
            placeholder={selectedIds.length === 0 ? "" : "Add..."}
          />
       </div>

       {isOpen && (
         <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
            <div className="sticky top-0 bg-white p-2 border-b border-slate-100">
               <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                 <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search categories..." 
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white"
                    autoFocus
                 />
               </div>
            </div>
            <div className="py-1">
               {renderCategoryTree(categories)}
            </div>
         </div>
       )}
    </div>
  );
};

// --- Main Component ---

const AdBuilder: React.FC<AdBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'placement'>('content');
  const [simulatedColumns, setSimulatedColumns] = useState(3); 
  const [categories, setCategories] = useState<Category[]>([]); // State for categories

  useEffect(() => {
      const loadCats = async () => {
          const data = await fetchCategories();
          setCategories(data);
      };
      loadCats();
  }, []);
  
  // useDebounce hook implementation
  const [ad, setAd] = useState<AdConfig>(() => {
    if (initialData) {
      return {
        ...DEFAULT_AD,
        ...initialData,
        styles: {
          ...DEFAULT_AD.styles,
          ...initialData.styles
        }
      };
    }
    return { ...DEFAULT_AD, id: `new_${Date.now()}` };
  });

  const [debouncedAd, setDebouncedAd] = useState(ad);

  // Debounce the ad updates passed to LivePreview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAd(ad);
    }, 300); // 300ms delay
    return () => clearTimeout(timer);
  }, [ad]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStyle = (key: keyof typeof DEFAULT_AD.styles, value: any) => {
    setAd(prev => ({
      ...prev,
      styles: { ...prev.styles, [key]: value }
    }));
  };

  // ... (Image analysis logic kept same) ...
  const analyzeImageContrast = (url: string) => {
    const img = new (window as any).Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 50; canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r, g, b, avg; let colorSum = 0;
      for(let x = 0, len = data.length; x < len; x += 4) {
        r = data[x]; g = data[x+1]; b = data[x+2];
        avg = Math.floor((r + g + b) / 3); colorSum += avg;
      }
      const brightness = Math.floor(colorSum / (50*50));
      const isDark = brightness < 128;
      const newTextColor = isDark ? '#ffffff' : '#000000';
      const newDescColor = isDark ? '#f3f4f6' : '#1f2937';
      setAd(prev => ({ ...prev, styles: { ...prev.styles, headlineColor: newTextColor, descriptionColor: newDescColor } }));
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setAd(prev => ({ ...prev, mediaUrl: url }));
        if (file.type.startsWith('image/')) analyzeImageContrast(url);
    }
  };

  const toggleCategory = (id: string) => {
    setAd(prev => {
      const exists = prev.targetCategories.includes(id);
      return { ...prev, targetCategories: exists ? prev.targetCategories.filter(c => c !== id) : [...prev.targetCategories, id] }
    });
  };

  const toggleExcludedCategory = (id: string) => {
    setAd(prev => {
      const exists = prev.excludedCategories.includes(id);
      return { ...prev, excludedCategories: exists ? prev.excludedCategories.filter(c => c !== id) : [...prev.excludedCategories, id] }
    });
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 bg-white">
      {/* Left Panel */}
      <div className="w-[500px] border-r border-slate-200 flex flex-col bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <input type="text" value={ad.name} onChange={e => setAd(prev => ({...prev, name: e.target.value}))} className="block w-full border-none p-0 text-xl font-bold text-slate-900 placeholder-slate-300 focus:ring-0 bg-transparent" placeholder="Campaign Name" />
          <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">Internal Name</p>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-slate-50">
          <div className="flex p-1 space-x-1 bg-slate-100 rounded-lg">
            {['content', 'style', 'placement'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-md transition-all duration-200 ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>{tab}</button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar bg-white">
          
          {/* === CONTENT TAB === */}
          {activeTab === 'content' && (
            <div className="animate-fadeIn">
               <InputGroup label="Media Asset" isVisible={ad.showMedia} onToggleVisibility={() => setAd(prev => ({...prev, showMedia: !prev.showMedia}))}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setAd(prev => ({...prev, type: AdType.IMAGE}))} className={`relative flex flex-col items-center justify-center gap-2 py-4 border-2 rounded-xl transition-all duration-200 ${ad.type === AdType.IMAGE ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'}`}><Image className="w-6 h-6" /><span className="text-sm font-bold">Image</span>{ad.type === AdType.IMAGE && <div className="absolute top-2 right-2 text-blue-600"><Check className="w-4 h-4" /></div>}</button>
                        <button onClick={() => setAd(prev => ({...prev, type: AdType.VIDEO}))} className={`relative flex flex-col items-center justify-center gap-2 py-4 border-2 rounded-xl transition-all duration-200 ${ad.type === AdType.VIDEO ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 text-slate-600'}`}><Video className="w-6 h-6" /><span className="text-sm font-bold">Video</span>{ad.type === AdType.VIDEO && <div className="absolute top-2 right-2 text-blue-600"><Check className="w-4 h-4" /></div>}</button>
                    </div>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} className="hidden" accept={ad.type === AdType.VIDEO ? "video/*" : "image/*"} onChange={handleFileChange} />
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6" /></div>
                        <p className="text-sm font-bold text-slate-900">Upload Media File</p>
                    </div>
                    <div className="space-y-3">
                        <StyledInput type="text" value={ad.mediaUrl} onChange={e => setAd(prev => ({...prev, mediaUrl: e.target.value}))} placeholder="Media URL" />
                        <StyledInput type="text" value={ad.altText} onChange={e => setAd(prev => ({...prev, altText: e.target.value}))} placeholder="SEO Alt Text" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wide">Media Fill Mode</label>
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            {(['cover', 'contain', 'fill'] as MediaFit[]).map((fit) => (
                                <button key={fit} onClick={() => setAd(prev => ({...prev, mediaFit: fit}))} className={`flex-1 py-1.5 text-xs font-bold rounded capitalize transition-all ${ad.mediaFit === fit ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}>{fit}</button>
                            ))}
                        </div>
                    </div>
                  </div>
               </InputGroup>
               {/* ... (Other content inputs like Headline/Description remain same, kept for brevity) ... */}
               <InputGroup label="Headline" isVisible={ad.showHeadline} onToggleVisibility={() => setAd(prev => ({...prev, showHeadline: !prev.showHeadline}))}>
                    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
                        <input type="text" value={ad.headline} onChange={e => setAd(prev => ({...prev, headline: e.target.value}))} className="block w-full border-0 bg-transparent p-3 text-slate-900 placeholder-slate-300 focus:ring-0 text-lg font-bold" />
                    </div>
               </InputGroup>
               <InputGroup label="Description" isVisible={ad.showDescription} onToggleVisibility={() => setAd(prev => ({...prev, showDescription: !prev.showDescription}))}>
                    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all">
                        <textarea value={ad.description} onChange={e => setAd(prev => ({...prev, description: e.target.value}))} rows={3} className="block w-full border-0 bg-transparent p-3 text-slate-900 placeholder-slate-300 focus:ring-0 text-sm font-medium resize-none" />
                    </div>
               </InputGroup>
               <InputGroup label="Call to Action" isVisible={ad.showButton} onToggleVisibility={() => setAd(prev => ({...prev, showButton: !prev.showButton}))}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">Button Label</label><StyledInput type="text" value={ad.buttonText} onChange={e => setAd(prev => ({...prev, buttonText: e.target.value}))} /></div>
                        <div className="space-y-1"><label className="text-xs text-slate-500 font-bold">Link URL</label><StyledInput type="text" value={ad.destinationUrl} onChange={e => setAd(prev => ({...prev, destinationUrl: e.target.value}))} /></div>
                    </div>
               </InputGroup>
            </div>
          )}

          {/* === STYLE TAB === */}
          {activeTab === 'style' && (
            <div className="animate-fadeIn space-y-8">
              {/* ... (Styles logic remains exactly as previous, heavily styled) ... */}
              {/* Content Layout */}
              <div>
                <SectionLabel>Content Layout & Spacing</SectionLabel>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-3 gap-3 w-full max-w-[200px] mx-auto aspect-square mb-6">
                        {(['top', 'center', 'bottom'] as VerticalAlignment[]).map(v => 
                            (['left', 'center', 'right'] as ContentAlignment[]).map(h => {
                                const isActive = ad.styles.verticalAlignment === v && ad.styles.contentAlignment === h;
                                return (
                                    <button key={`${v}-${h}`} onClick={() => { updateStyle('verticalAlignment', v); updateStyle('contentAlignment', h); }} className={`relative rounded-md border flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-110 z-10' : 'bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100'}`}>
                                        <div className={`w-2 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-current'}`}></div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                        <RangeControl label="Frame Padding" value={ad.styles.contentPadding} onChange={(v: number) => updateStyle('contentPadding', v)} min={0} max={80} step={4} unit="px" />
                    </div>
                    {/* Row Spacing Control */}
                    <div className="pt-4 border-t border-slate-100 mt-4">
                         <RangeControl label="Row Spacing (Bottom Margin)" value={ad.styles.marginBottom} onChange={(v: number) => updateStyle('marginBottom', v)} min={0} max={100} step={5} unit="px" />
                    </div>
                </div>
              </div>
              {/* Typography sections ... */}
               <div>
                <SectionLabel>Headline Typography</SectionLabel>
                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <ModernColorPicker label="Font Color" value={ad.styles.headlineColor} onChange={v => updateStyle('headlineColor', v)} />
                    <div className="grid grid-cols-2 gap-6">
                        <RangeControl label="Size" value={ad.styles.headlineFontSize} onChange={(v: number) => updateStyle('headlineFontSize', v)} min={12} max={72} step={1} unit="px" />
                        <RangeControl label="Line Height" value={ad.styles.headlineLineHeight} onChange={(v: number) => updateStyle('headlineLineHeight', v)} min={0.8} max={2.0} step={0.1} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <RangeControl label="Letter Spacing" value={ad.styles.headlineLetterSpacing} onChange={(v: number) => updateStyle('headlineLetterSpacing', v)} min={-5} max={10} step={0.5} unit="px" />
                        <RangeControl label="Font Weight" value={ad.styles.headlineFontWeight} onChange={(v: number) => updateStyle('headlineFontWeight', v)} min={100} max={900} step={100} />
                    </div>
                </div>
              </div>
              <div>
                <SectionLabel>Description Typography</SectionLabel>
                <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <ModernColorPicker label="Font Color" value={ad.styles.descriptionColor} onChange={v => updateStyle('descriptionColor', v)} />
                    <div className="grid grid-cols-2 gap-6">
                        <RangeControl label="Size" value={ad.styles.descriptionFontSize} onChange={(v: number) => updateStyle('descriptionFontSize', v)} min={10} max={32} step={1} unit="px" />
                        <RangeControl label="Line Height" value={ad.styles.descriptionLineHeight} onChange={(v: number) => updateStyle('descriptionLineHeight', v)} min={1.0} max={2.5} step={0.1} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <RangeControl label="Letter Spacing" value={ad.styles.descriptionLetterSpacing} onChange={(v: number) => updateStyle('descriptionLetterSpacing', v)} min={-2} max={5} step={0.5} unit="px" />
                        <RangeControl label="Font Weight" value={ad.styles.descriptionFontWeight} onChange={(v: number) => updateStyle('descriptionFontWeight', v)} min={100} max={900} step={100} />
                    </div>
                </div>
              </div>
              {/* Button & Backgrounds ... */}
              <div>
                <SectionLabel>Button Styling</SectionLabel>
                <div className="grid grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <ModernColorPicker label="Background" value={ad.styles.buttonColor} onChange={v => updateStyle('buttonColor', v)} />
                  <ModernColorPicker label="Text Color" value={ad.styles.buttonTextColor} onChange={v => updateStyle('buttonTextColor', v)} />
                </div>
              </div>
              <div>
                 <SectionLabel>Container Background</SectionLabel>
                 <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden p-1 bg-slate-50">
                        <button onClick={() => updateStyle('backgroundType', 'solid')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${ad.styles.backgroundType === 'solid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Solid</button>
                        <button onClick={() => updateStyle('backgroundType', 'gradient')} className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${ad.styles.backgroundType === 'gradient' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Gradient</button>
                    </div>
                    {ad.styles.backgroundType === 'solid' ? (<ModernColorPicker label="Solid Color" value={ad.styles.backgroundColor} onChange={v => updateStyle('backgroundColor', v)} />) : (<GradientBuilder value={ad.styles.backgroundGradient} onChange={v => updateStyle('backgroundGradient', v)} />)}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1.5 block uppercase">Border Width</label>
                            <StyledInput type="number" value={ad.styles.borderWidth} onChange={e => updateStyle('borderWidth', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1.5 block uppercase">Corner Radius</label>
                            <StyledInput type="number" value={ad.styles.borderRadius} onChange={e => updateStyle('borderRadius', parseInt(e.target.value))} />
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* === PLACEMENT TAB === */}
          {activeTab === 'placement' && (
            <div className="animate-fadeIn space-y-6">
               {/* Targeting Rules */}
               <div className="space-y-4">
                 <SectionLabel>Category Targeting</SectionLabel>
                 <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <input id="all-cats" type="checkbox" checked={ad.targetCategories.length === 0} onChange={(e) => setAd(prev => ({...prev, targetCategories: []}))} className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900" />
                    <label htmlFor="all-cats" className="ml-3 block text-sm font-medium text-slate-900">Run on <strong>All Categories</strong></label>
                 </div>
                 {/* Use new category prop */}
                 <CategorySelector label="Limit to Specific Categories" emptyText="No restrictions (Run on All)" selectedIds={ad.targetCategories} onToggle={toggleCategory} categories={categories} />
                 <CategorySelector label="Exclude Specific Categories" emptyText="No exclusions" selectedIds={ad.excludedCategories} onToggle={toggleExcludedCategory} categories={categories} />
               </div>
               
               <div className="h-px bg-slate-100"></div>

               {/* Grid Positioning */}
               <InputGroup label="Grid Positioning">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                         <div><span className="block text-sm font-bold text-slate-900">Placement Order</span><span className="block text-xs text-slate-500">Insert after product #</span></div>
                         <input type="number" min="1" className="w-24 rounded-md border-gray-200 bg-slate-50 py-2 px-2 text-center font-mono text-sm font-bold" value={ad.position} onChange={e => setAd(prev => ({...prev, position: parseInt(e.target.value)}))} />
                    </div>
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
                         <div><span className="block text-sm font-bold text-slate-900">Repeat</span><span className="block text-xs text-slate-500">Repeat every X items (0 = Once)</span></div>
                         <input type="number" min="0" className="w-24 rounded-md border-gray-200 bg-slate-50 py-2 px-2 text-center font-mono text-sm font-bold" value={ad.frequency} onChange={e => setAd(prev => ({...prev, frequency: parseInt(e.target.value)}))} />
                    </div>
                </div>
               </InputGroup>

               {/* Advanced Theme Targeting */}
               <InputGroup label="Advanced Theme Targeting" subLabel="Optional: Override default theme selectors.">
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Grid Selector</label><StyledInput type="text" value={ad.gridSelector || ''} onChange={e => setAd(prev => ({...prev, gridSelector: e.target.value}))} placeholder=".productGrid" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 uppercase mb-1">Item Selector</label><StyledInput type="text" value={ad.itemSelector || ''} onChange={e => setAd(prev => ({...prev, itemSelector: e.target.value}))} placeholder=".product" /></div>
                  </div>
              </InputGroup>

              <div className="h-px bg-slate-100"></div>

              {/* Schedule & Status */}
              <InputGroup label="Schedule & Status">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-xs text-slate-500 font-bold uppercase">Start Date</label><div className="relative"><input type="datetime-local" value={ad.schedule.startDate} onChange={e => setAd(prev => ({...prev, schedule: {...prev.schedule, startDate: e.target.value}}))} className="block w-full rounded-lg border-gray-200 bg-white py-2 px-3 shadow-sm sm:text-sm" /></div></div>
                        <div className="space-y-1"><label className="text-xs text-slate-500 font-bold uppercase">End Date</label><div className="relative"><input type="datetime-local" value={ad.schedule.endDate || ''} onChange={e => setAd(prev => ({...prev, schedule: {...prev.schedule, endDate: e.target.value || null}}))} className="block w-full rounded-lg border-gray-200 bg-white py-2 px-3 shadow-sm sm:text-sm" /></div></div>
                    </div>
                    <div className="relative pt-2">
                        <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Campaign Status</label>
                        <select value={ad.status} onChange={e => setAd(prev => ({...prev, status: e.target.value as AdStatus}))} className="block w-full rounded-lg border-gray-200 bg-white py-3 px-4 pr-10 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm appearance-none font-bold text-slate-900">
                            <option value={AdStatus.DRAFT}>Draft (Hidden)</option>
                            <option value={AdStatus.ACTIVE}>Active (Live)</option>
                            <option value={AdStatus.PAUSED}>Paused</option>
                            <option value={AdStatus.SCHEDULED}>Scheduled</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 pt-6"><ChevronDown className="h-4 w-4" /></div>
                    </div>
                </div>
              </InputGroup>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Discard Changes</button>
          <button onClick={() => onSave(ad)} className="px-8 py-2.5 bg-slate-900 text-white shadow-lg shadow-slate-900/20 text-sm font-bold rounded-lg hover:bg-slate-800 transform transition-all active:scale-95 flex items-center gap-2"><Check className="w-4 h-4" />Save Campaign</button>
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-20 relative">
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><LayoutDashboard className="w-3 h-3" />Grid Simulator</span>
                <div className="h-4 w-px bg-slate-200"></div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                    <button onClick={() => setSimulatedColumns(1)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${simulatedColumns === 1 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mobile</button>
                    <button onClick={() => setSimulatedColumns(2)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${simulatedColumns === 2 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tablet</button>
                    <button onClick={() => setSimulatedColumns(3)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${simulatedColumns === 3 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Desktop</button>
                    <button onClick={() => setSimulatedColumns(4)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${simulatedColumns === 4 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Wide</button>
                </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">Testing {simulatedColumns}-Column Layout</div>
        </div>
        <div className="flex-1 p-8 overflow-hidden relative flex flex-col items-center justify-center">
            <div className="absolute inset-0 pattern-grid opacity-[0.04] pointer-events-none"></div>
            <div className={`w-full h-full max-w-[1200px] mx-auto flex flex-col shadow-2xl rounded-xl overflow-hidden border border-slate-200 bg-white ring-1 ring-black/5 transition-all duration-500 ${simulatedColumns === 1 ? 'max-w-[400px]' : ''}`}>
                <LivePreview ad={debouncedAd} simulatedColumns={simulatedColumns} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdBuilder;
