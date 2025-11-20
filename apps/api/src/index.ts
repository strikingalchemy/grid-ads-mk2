import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sequelize from './config/database';
import { getAds, createAd, updateAd, deleteAd, getStorefrontAds, getCategories, updateStoreConfig } from './controllers/adController';
import { getSdk } from './controllers/sdkController';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security & CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-store-hash']
}));

app.use(express.json());

// -- Routes --

// Storefront Public API
app.get('/storefront/:storeHash/ads', getStorefrontAds);

// Serve SDK dynamically - Explicitly V4
app.get('/sdk/v4/injector.js', getSdk);

// Admin API
app.get('/api/ads', getAds);
app.post('/api/ads', createAd);
app.put('/api/ads/:id', updateAd);
app.delete('/api/ads/:id', deleteAd);
app.get('/api/categories', getCategories);
app.post('/api/config', updateStoreConfig);

// Health Check
app.get('/health', (req, res) => res.send('OK'));

// Fallback Route for Debugging
app.use('*', (req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Start Server
const start = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database connected & synced');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database (running in offline mode):', error);
    // (process as any).exit(1); // Allow server to start without DB for SDK testing
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API Server running on port ${PORT} (Offline Mode)`);
    });
  }
};

start();