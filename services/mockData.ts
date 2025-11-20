
import { AdConfig, AdStatus, AdType, AnalyticsSummary, Product, Category } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_1',
    name: 'Men',
    children: [
      { id: 'cat_1_1', name: 'New Arrivals' },
      { id: 'cat_1_2', name: 'Clothing', children: [
         { id: 'cat_1_2_1', name: 'T-Shirts' },
         { id: 'cat_1_2_2', name: 'Jeans' },
         { id: 'cat_1_2_3', name: 'Jackets' }
      ]},
      { id: 'cat_1_3', name: 'Accessories' },
      { id: 'cat_1_4', name: 'Shoes' }
    ]
  },
  {
    id: 'cat_2',
    name: 'Women',
    children: [
      { id: 'cat_2_1', name: 'New Arrivals' },
      { id: 'cat_2_2', name: 'Clothing', children: [
        { id: 'cat_2_2_1', name: 'Dresses' },
        { id: 'cat_2_2_2', name: 'Tops' },
        { id: 'cat_2_2_3', name: 'Activewear' }
      ]},
      { id: 'cat_2_3', name: 'Accessories' },
      { id: 'cat_2_4', name: 'Shoes' }
    ]
  },
  {
    id: 'cat_3',
    name: 'Sale',
    children: [
      { id: 'cat_3_1', name: 'Clearance' },
      { id: 'cat_3_2', name: 'Last Chance' }
    ]
  }
];

export const MOCK_ADS: AdConfig[] = [
  {
    id: 'ad_001',
    name: 'Summer Sale Banner',
    status: AdStatus.ACTIVE,
    type: AdType.IMAGE,
    mediaUrl: 'https://picsum.photos/600/800',
    mediaFit: 'cover',
    showMedia: true,
    altText: 'Summer Sale Collection',
    destinationUrl: '/summer-sale',
    headline: 'Summer Vibes',
    showHeadline: true,
    description: 'Get 50% off all beachwear this week only.',
    showDescription: true,
    buttonText: 'Shop Now',
    showButton: true,
    position: 3,
    frequency: 0,
    gridSelector: '.productGrid',
    itemSelector: '.product',
    styles: {
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      backgroundType: 'solid',
      backgroundGradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      textColor: '#111827',
      headlineColor: '#111827',
      headlineFontSize: 32,
      headlineFontWeight: 700,
      headlineLineHeight: 1.1,
      headlineLetterSpacing: -0.5,
      descriptionColor: '#4b5563',
      descriptionFontSize: 16,
      descriptionFontWeight: 500,
      descriptionLineHeight: 1.5,
      descriptionLetterSpacing: 0,
      buttonColor: '#2563eb',
      buttonTextColor: '#ffffff',
      overlayOpacity: 0,
      overlayColor: '#000000',
      contentAlignment: 'center',
      verticalAlignment: 'bottom',
      contentPadding: 24,
      marginBottom: 30
    },
    schedule: { startDate: '2023-06-01T00:00', endDate: null },
    targetCategories: ['cat_1'],
    excludedCategories: [],
    targetBrands: [],
    storeId: 'store_123',
    createdAt: '2023-05-20T10:00:00Z',
    updatedAt: '2023-06-01T09:00:00Z',
  },
  {
    id: 'ad_002',
    name: 'New Arrivals Video',
    status: AdStatus.ACTIVE,
    type: AdType.VIDEO,
    mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    mediaFit: 'cover',
    showMedia: true,
    altText: 'New Arrivals Preview',
    destinationUrl: '/new-arrivals',
    headline: 'New Collection',
    showHeadline: true,
    description: 'Discover the future of fashion.',
    showDescription: true,
    buttonText: 'View All',
    showButton: true,
    position: 8,
    frequency: 12,
    gridSelector: '.productGrid',
    itemSelector: '.product',
    styles: {
      borderColor: '#000000',
      borderWidth: 0,
      borderRadius: 0,
      backgroundColor: '#000000',
      backgroundType: 'solid',
      backgroundGradient: '',
      textColor: '#ffffff',
      headlineColor: '#ffffff',
      headlineFontSize: 36,
      headlineFontWeight: 800,
      headlineLineHeight: 1.1,
      headlineLetterSpacing: -1,
      descriptionColor: '#e5e5e5',
      descriptionFontSize: 18,
      descriptionFontWeight: 400,
      descriptionLineHeight: 1.6,
      descriptionLetterSpacing: 0.5,
      buttonColor: '#ffffff',
      buttonTextColor: '#000000',
      overlayOpacity: 0.4,
      overlayColor: '#000000',
      contentAlignment: 'left',
      verticalAlignment: 'center',
      contentPadding: 32,
      marginBottom: 30
    },
    schedule: { startDate: '2023-08-01T09:00', endDate: '2023-08-31T23:59' },
    targetCategories: [],
    excludedCategories: [],
    targetBrands: [],
    storeId: 'store_123',
    createdAt: '2023-07-20T10:00:00Z',
    updatedAt: '2023-07-25T14:30:00Z',
  }
];

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalImpressions: 125430,
  totalClicks: 3420,
  totalMouseOvers: 15420,
  totalConversions: 145,
  ctr: 2.72,
  conversionRate: 4.2,
  dailyStats: Array.from({ length: 14 }).map((_, i) => ({
    date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
    impressions: Math.floor(Math.random() * 5000) + 2000,
    clicks: Math.floor(Math.random() * 200) + 50,
    mouseOvers: Math.floor(Math.random() * 1000) + 200,
    conversions: Math.floor(Math.random() * 20) + 2,
  })),
};

export const MOCK_PRODUCTS: Product[] = Array.from({ length: 12 }).map((_, i) => ({
  id: i + 1,
  name: `Product Item ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 20,
  image: `https://picsum.photos/300/400?random=${i}`,
}));