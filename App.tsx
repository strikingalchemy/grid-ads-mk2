
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Megaphone, BarChart3, Settings, Plus, Edit2, Trash2, Video, Image } from './components/ui/Icons';
import Dashboard from './components/Dashboard';
import AdBuilder from './components/AdBuilder';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import { MOCK_ANALYTICS } from './services/mockData'; // Analytics still mock for now
import { AdConfig, AdStatus, AdType } from './types';
import * as api from './services/api';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'ads' | 'analytics' | 'settings' | 'editor'>('dashboard');
  const [editingAd, setEditingAd] = useState<AdConfig | null>(null);
  const [ads, setAds] = useState<AdConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Ads on Load
  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await api.fetchAds();
      setAds(data);
    } catch (err) {
      console.error("Failed to load ads", err);
      // Fallback to empty or error state
    } finally {
      setLoading(false);
    }
  };

  const handleEditAd = (ad: AdConfig) => {
    setEditingAd(ad);
    setCurrentView('editor');
  };

  const handleCreateAd = () => {
    setEditingAd(null);
    setCurrentView('editor');
  };

  const handleSaveAd = async (ad: AdConfig) => {
    try {
      if (ad.id && !ad.id.startsWith('new_')) {
        const updated = await api.updateAd(ad);
        setAds(ads.map(a => a.id === updated.id ? updated : a));
      } else {
        // Remove temporary ID if present
        const { id, ...newAd } = ad; 
        const created = await api.createAd(newAd);
        setAds([...ads, created]);
      }
      setCurrentView('ads');
    } catch (err) {
      alert("Failed to save ad. Please check that your API server is running and accessible (not localhost if on a public store).\n\nError: " + err);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (confirm('Are you sure you want to delete this ad?')) {
      try {
        await api.deleteAd(id);
        setAds(ads.filter(a => a.id !== id));
      } catch (err) {
        alert("Failed to delete ad. Check API connection.");
      }
    }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(id)}
      className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 mb-1
        ${currentView === id 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon className={`h-5 w-5 mr-3 transition-colors ${currentView === id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
      {label}
    </button>
  );

  const AdsListView = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your active promotional tiles and placements.</p>
        </div>
        <button 
          onClick={handleCreateAd}
          className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Ad
        </button>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-slate-500">Loading campaigns...</div>
        ) : ads.length === 0 ? (
            <div className="p-12 text-center">
                <p className="text-slate-900 font-medium mb-2">No campaigns yet</p>
                <button onClick={handleCreateAd} className="text-blue-600 text-sm hover:underline">Create your first ad</button>
            </div>
        ) : (
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Creative</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Placement</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {ads.map((ad) => (
              <tr key={ad.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${ad.status === AdStatus.ACTIVE ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 
                      ad.status === AdStatus.PAUSED ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20'}`}>
                    {ad.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-10 flex-shrink-0 bg-slate-100 rounded-md border border-slate-200 overflow-hidden shadow-sm">
                      {ad.type === AdType.VIDEO ? (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                              <Video className="w-5 h-5" />
                          </div>
                      ) : (
                          <img className="h-full w-full object-cover" src={ad.mediaUrl} alt="" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{ad.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{ad.headline || 'No headline'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">#{ad.position}</span>
                  {ad.frequency > 0 && <span className="ml-2 text-xs text-slate-400">(Every {ad.frequency})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">
                  <div className="flex items-center gap-2">
                    {ad.type === AdType.VIDEO ? <Video className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                    {ad.type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditAd(ad)} className="text-slate-400 hover:text-blue-600 transition-colors mr-4">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteAd(ad.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );

  if (currentView === 'editor') {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16">
          <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">G</div>
                <div className="font-bold text-lg text-slate-900 tracking-tight">GridAds <span className="text-slate-400 font-normal">Editor</span></div>
             </div>
             <button onClick={() => setCurrentView('ads')} className="text-sm text-slate-500 hover:text-slate-900 font-medium">Exit to Dashboard</button>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-6 py-6 h-[calc(100vh-4rem)]">
          <AdBuilder 
            initialData={editingAd}
            onSave={handleSaveAd}
            onCancel={() => setCurrentView('ads')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 fixed h-full z-10 flex flex-col">
        <div className="flex items-center h-20 px-8 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm mr-3">G</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">GridAds</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="ads" icon={Megaphone} label="Ads & Placements" />
          <NavItem id="analytics" icon={BarChart3} label="Analytics" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-900">Pro Plan</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">Store ID: store_abc123</p>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-3/4 rounded-full"></div>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10">
        <div className="max-w-6xl mx-auto">
          {currentView === 'dashboard' && <Dashboard analytics={MOCK_ANALYTICS} activeAdsCount={ads.filter(a => a.status === 'active').length} />}
          {currentView === 'ads' && <AdsListView />}
          {currentView === 'analytics' && <AnalyticsView analytics={MOCK_ANALYTICS} />}
          {currentView === 'settings' && <SettingsView ads={ads} />}
        </div>
      </main>
    </div>
  );
}

export default App;
