
import { Request, Response } from 'express';
import Ad from '../models/Ad';
import Store from '../models/Store';
import { fetchBigCommerceCategories, transformCategories } from '../services/bigcommerce';

const DEMO_STORE_HASH = 'store_abc123';

// ... (DEMO DATA constants kept same as before, abbreviated for brevity)
const DEMO_ADS_DATA = [
  {
    name: 'Summer Sale Banner',
    status: 'active',
    type: 'image',
    mediaUrl: 'https://picsum.photos/600/800',
    headline: 'Summer Vibes',
    description: 'Get 50% off all beachwear this week only.',
    buttonText: 'Shop Now',
    destinationUrl: '#',
    position: 3,
    styles: {
      backgroundColor: '#ffffff',
      headlineColor: '#111827',
      buttonColor: '#2563eb',
      buttonTextColor: '#ffffff'
    }
  }
];

const DEMO_CATEGORIES = [
  {
    id: 'cat_1',
    name: 'Men (Demo)',
    children: [
      { id: 'cat_1_1', name: 'New Arrivals' },
      { id: 'cat_1_2', name: 'Clothing' }
    ]
  },
  {
    id: 'cat_2',
    name: 'Women (Demo)',
    children: [
      { id: 'cat_2_1', name: 'New Arrivals' },
      { id: 'cat_2_2', name: 'Clothing' }
    ]
  }
];

export const getAds = async (req: Request, res: Response) => {
  try {
    let store = await (Store as any).findOne({ where: { storeHash: DEMO_STORE_HASH } });

    if (!store) {
      console.log('Seeding demo store and ads...');
      store = await (Store as any).create({ storeHash: DEMO_STORE_HASH, isActive: true, accessToken: null, scope: null });
      for (const adData of DEMO_ADS_DATA) {
        await (Ad as any).create({ ...adData, storeId: store.id } as any);
      }
    }

    const ads = await (Ad as any).findAll({
      where: { storeId: store.id },
      order: [['createdAt', 'DESC']]
    });

    res.json(ads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const store = await (Store as any).findOne({ where: { storeHash: DEMO_STORE_HASH } });

    if (store && store.accessToken) {
      try {
        const bcTree = await fetchBigCommerceCategories(store);
        const transformed = transformCategories(bcTree);
        return res.json(transformed);
      } catch (bcError) {
        console.error('Failed to fetch from BC:', bcError);
        // Fallback to demo if BC fetch fails
      }
    }

    res.json(DEMO_CATEGORIES);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const updateStoreConfig = async (req: Request, res: Response) => {
  try {
    const { storeHash, accessToken } = req.body;
    let store = await (Store as any).findOne({ where: { storeHash: storeHash || DEMO_STORE_HASH } });

    if (!store) {
      store = await (Store as any).create({
        storeHash: storeHash || DEMO_STORE_HASH,
        isActive: true,
        accessToken
      });
    } else {
      store.accessToken = accessToken;
      await store.save();
    }

    res.json({ success: true, message: 'Store configuration updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update store config' });
  }
};

export const createAd = async (req: Request, res: Response) => {
  try {
    let store = await (Store as any).findOne({ where: { storeHash: DEMO_STORE_HASH } });
    if (!store) {
      store = await (Store as any).create({ storeHash: DEMO_STORE_HASH, isActive: true });
    }

    const ad = await (Ad as any).create({
      ...req.body,
      storeId: store.id
    });
    res.status(201).json(ad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
};

export const updateAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [updated] = await (Ad as any).update(req.body, { where: { id } });
    if (updated) {
      const updatedAd = await (Ad as any).findByPk(id);
      return res.json(updatedAd);
    }
    throw new Error('Ad not found');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
};

export const deleteAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await (Ad as any).destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ad' });
  }
};

export const getStorefrontAds = async (req: Request, res: Response) => {
  try {
    const { storeHash } = req.params;
    const store = await (Store as any).findOne({ where: { storeHash: storeHash } });

    // Allow demo hash to fallback for testing
    let targetStore = store;
    if (!targetStore) {
      console.log(`[API] Store ${storeHash} not found. Falling back to DEMO store.`);
      targetStore = await (Store as any).findOne({ where: { storeHash: DEMO_STORE_HASH } });
    }

    if (!targetStore) return res.json([]);

    const ads = await (Ad as any).findAll({
      where: {
        storeId: targetStore.id,
        status: 'active'
      }
    });

    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};
