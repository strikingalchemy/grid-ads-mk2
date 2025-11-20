
import { AdConfig } from '../types';

/**
 * This file contains the core logic that would be compiled into the 
 * storefront script (apps/script/injector.ts).
 */

export interface GridDetectionResult {
  container: HTMLElement | null;
  items: HTMLElement[];
  columns: number;
}

// Comprehensive list of selectors for various BigCommerce themes (Cornerstone, Roots, Vault, etc.)
const DEFAULT_GRID_SELECTORS = [
  '.productGrid',
  '.product-grid',
  '[data-product-grid]',
  '.category-product-grid',
  '#product-listing-container .product-listing',
  'ul.productList',
  '.card-container',
  '.grid-layout',
  '.products-list',
  '[data-test="product-grid"]'
];

/**
 * Detects the product grid and its dimensions in the DOM.
 */
export const detectGrid = (
  root: HTMLElement, 
  customGridSelector?: string,
  customItemSelector?: string
): GridDetectionResult => {
  let container: HTMLElement | null = null;
  let items: HTMLElement[] = [];

  // 1. Attempt custom selector first
  if (customGridSelector) {
     container = root.querySelector(customGridSelector);
  }

  // 2. Fallback to default list
  if (!container) {
    for (const selector of DEFAULT_GRID_SELECTORS) {
      const found = root.querySelector(selector);
      if (found && found.children.length > 0) {
        // Basic validation: ensure it actually has children
        container = found as HTMLElement;
        break;
      }
    }
  }

  // Fallback for Live Preview context
  if (!container) {
    container = root.querySelector('#live-preview-grid');
  }

  if (!container) return { container: null, items: [], columns: 0 };

  // 3. Find Items
  if (customItemSelector) {
    items = Array.from(container.querySelectorAll(customItemSelector)) as HTMLElement[];
  } else {
    // Robust fallback: Assume direct children are items
    // Filter out script tags or hidden elements to be safe
    items = Array.from(container.children).filter(
        child => child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE'
    ) as HTMLElement[];
  }

  // 4. Calculate Columns (based on visual layout)
  let columns = 3; // Default
  if (items.length > 1) {
    const first = items[0].getBoundingClientRect();
    const second = items[1].getBoundingClientRect();
    
    // If tops are aligned, they are in the same row
    if (Math.abs(first.top - second.top) < 5) {
        const containerWidth = container.getBoundingClientRect().width;
        // Avoid division by zero
        if (first.width > 0) {
            columns = Math.round(containerWidth / first.width);
        }
    } else {
        // If second item is below first, it's likely a 1-column mobile layout
        columns = 1;
    }
  }

  return { container, items, columns };
};

/**
 * Calculates where to inject ads based on configuration.
 * Returns a mapped array of (Product Element | Ad Config)
 */
export const calculateInjection = (
  originalItems: any[], 
  ads: AdConfig[]
): (any | { isAd: true; config: AdConfig })[] => {
  const activeAds = ads.filter(a => a.status === 'active' || a.status === 'scheduled'); 
  const result = [...originalItems];

  // Sort ads by position to keep index math simple
  activeAds.sort((a, b) => a.position - b.position);

  let offset = 0;

  activeAds.forEach(ad => {
    const insertIndex = ad.position + offset;
    
    // Safety check
    if (insertIndex <= result.length) {
      result.splice(insertIndex, 0, { isAd: true, config: ad });
      offset++;
    }
  });

  return result;
};
