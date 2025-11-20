
import { AdConfig, Category } from '../types';
import { MOCK_ADS, MOCK_CATEGORIES } from './mockData';

const getApiBase = () => {
    const stored = localStorage.getItem('gridads_api_url');
    const base = stored ? stored.replace(/\/$/, '') : 'http://localhost:3000';
    return `${base}/api`;
};

export const fetchAds = async (): Promise<AdConfig[]> => {
  const apiBase = getApiBase();
  try {
    const res = await fetch(`${apiBase}/ads`);
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
    const res = await fetch(`${apiBase}/categories`);
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeHash, accessToken })
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server Error ${res.status}: ${text}`);
        }
        return await res.json();
    } catch (err: any) {
        console.error('API Connection Failed:', err);
        // Detect common network failure modes
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
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
  });

  if (!res.ok) {
     throw new Error('Failed to delete ad');
  }
};