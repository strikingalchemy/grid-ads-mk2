
import { AdConfig, Category } from '../types';
import { MOCK_ADS, MOCK_CATEGORIES } from './mockData';

const PRODUCTION_API = 'https://grid-ads-mk2-production.up.railway.app';

const getApiBase = () => {
    const stored = localStorage.getItem('gridads_api_url');
    const base = stored ? stored.replace(/\/$/, '') : PRODUCTION_API;
    return `${base}/api`;
};

// CRITICAL FIX: Helper to get headers with the correct store hash
const getHeaders = () => {
    const storeHash = localStorage.getItem('gridads_store_hash') || '';
    return {
        'Content-Type': 'application/json',
        'x-store-hash': storeHash.replace('store-', '') // Ensure only raw hash is sent
    };
};

export const fetchAds = async (): Promise<AdConfig[]> => {
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/ads`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API unavailable at ${apiBase}, falling back to mock data:`, err);
    return MOCK_ADS;
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API unavailable, utilizing mock categories:', err);
    return MOCK_CATEGORIES;
  }
};

export const updateStoreConfig = async (storeHash: string, accessToken: string) => {
    const apiBase = getApiBase();
    try {
        const res = await fetch(`${apiBase}/config`, {
            method: 'POST',
            headers: getHeaders(), // Use new helper
            body: JSON.stringify({ storeHash, accessToken })
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server Error ${res.status}: ${text}`);
        }
        return await res.json();
    } catch (err: any) {
        console.error('API Connection Failed:', err);
        if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
             throw new Error(`Cannot reach server at ${apiBase}. Please check the URL, your network connection, or if the server is running.`);
        }
        throw err;
    }
};

export const createAd = async (ad: Partial<AdConfig>): Promise<AdConfig> => {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/ads`, {
    method: 'POST',
    headers: getHeaders(), // Use new helper
    body: JSON.stringify(ad),
  });
  
  if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to create ad: ${res.status} ${errorText}`);
  }
  return await res.json();
};

export const updateAd = async (ad: AdConfig): Promise<AdConfig> => {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/ads/${ad.id}`, {
    method: 'PUT',
    headers: getHeaders(), // Use new helper
    body: JSON.stringify(ad),
  });

  if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to update ad: ${res.status} ${errorText}`);
  }
  return await res.json();
};

export const deleteAd = async (id: string): Promise<void> => {
  const apiBase = getApiBase();
  const res = await fetch(`${apiBase}/ads/${id}`, {
    method: 'DELETE',
    headers: getHeaders(), // Use new helper
  });

  if (!res.ok) {
     throw new Error('Failed to delete ad');
  }
};
