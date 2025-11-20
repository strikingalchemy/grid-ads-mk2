
export enum AdStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  SCHEDULED = 'scheduled',
  DRAFT = 'draft'
}

export enum AdType {
  IMAGE = 'image',
  VIDEO = 'video',
  HTML = 'html'
}

export interface DateRange {
  startDate: string;
  endDate: string | null;
}

export type ContentAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'center' | 'bottom';
export type MediaFit = 'cover' | 'contain' | 'fill';

export interface AdStyles {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  backgroundColor: string;
  backgroundType: 'solid' | 'gradient';
  backgroundGradient: string;
  
  // Typography
  textColor: string;
  headlineColor: string;
  headlineFontSize: number;
  headlineFontWeight: number;
  headlineLineHeight: number;
  headlineLetterSpacing: number;
  descriptionColor: string;
  descriptionFontSize: number;
  descriptionFontWeight: number;
  descriptionLineHeight: number;
  descriptionLetterSpacing: number;

  // Button
  buttonColor: string;
  buttonTextColor: string;
  
  // Layout & Effects
  overlayOpacity: number;
  overlayColor: string;
  contentAlignment: ContentAlignment;
  verticalAlignment: VerticalAlignment;
  contentPadding: number;
  marginBottom: number; // Added for row spacing control
}

export interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export interface AdConfig {
  id: string;
  name: string;
  status: AdStatus;
  type: AdType;
  
  // Media
  mediaUrl: string;
  mediaFit: MediaFit;
  showMedia: boolean;
  altText: string;
  
  // Content
  destinationUrl: string;
  headline: string;
  showHeadline: boolean;
  description: string;
  showDescription: boolean;
  buttonText: string;
  showButton: boolean;
  
  // Placement & Rules
  position: number;
  frequency: number;
  gridSelector?: string;
  itemSelector?: string;
  styles: AdStyles;
  schedule: DateRange;
  targetCategories: string[];
  excludedCategories: string[];
  targetBrands: string[];
  
  // Meta
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalClicks: number;
  totalMouseOvers: number;
  totalConversions: number;
  ctr: number;
  conversionRate: number;
  dailyStats: { 
    date: string; 
    impressions: number; 
    clicks: number;
    mouseOvers: number;
    conversions: number;
  }[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}