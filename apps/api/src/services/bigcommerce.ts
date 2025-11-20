
import Store from '../models/Store';

interface Category {
  id: number;
  parent_id: number;
  name: string;
  url: string;
  children?: Category[];
}

export const fetchBigCommerceCategories = async (store: any) => {
  if (!store.accessToken || !store.storeHash) {
    throw new Error('Missing credentials');
  }

  const response = await fetch(`https://api.bigcommerce.com/stores/${store.storeHash}/v3/catalog/categories/tree`, {
    headers: {
      'X-Auth-Token': store.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`BigCommerce API Error: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data || [];
};

// Helper to transform BC tree to our internal format if needed
export const transformCategories = (bcCategories: any[]): any[] => {
  return bcCategories.map(cat => ({
    id: cat.id.toString(),
    name: cat.name,
    children: cat.children ? transformCategories(cat.children) : []
  }));
};
