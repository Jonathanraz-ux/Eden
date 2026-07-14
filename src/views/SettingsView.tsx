import { useState } from 'react';
import { isSupabaseConnected } from '../lib/supabase';
import { RolesSettingsTab } from './RolesSettingsTab';
import { cn } from '../lib/utils';
import { Settings as SettingsIcon, Shield } from 'lucide-react';

const tabs = [
  { id: 'general', label: 'Général', icon: SettingsIcon },
  { id: 'roles', label: 'Rôles & Permissions', icon: Shield },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState('general');
  const [url, setUrl] = useState(() => {
    const stored = localStorage.getItem('supabase_config');
    if (stored) {
      try { return JSON.parse(stored).url || ''; } catch { /* ignore */ }
    }
    return import.meta.env.VITE_SUPABASE_URL || '';
  });
  const [key, setKey] = useState(() => {
    const stored = localStorage.getItem('supabase_config');
    if (stored) {
      try { return JSON.parse(stored).key || ''; } catch { /* ignore */ }
    }
    return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (url && key) {
      localStorage.setItem('supabase_config', JSON.stringify({ url, key }));
    } else {
      localStorage.removeItem('supabase_config');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white border border-[#1A1A1A]/10 rounded-sm p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-sm transition-all",
              activeTab === tab.id
                ? "bg-[#1A1A1A] text-white"
                : "text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div className="max-w-2xl bg-white border border-[#1A1A1A]/10 rounded-sm flex flex-col">
          <div className="p-8 border-b border-[#1A1A1A]/5">
            <h3 className="text-sm font-bold uppercase tracking-widest">Paramètres de l'établissement</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-40 mt-2">Gérez les informations générales de l'hôtel.</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">Nom de l'établissement</label>
              <input type="text" defaultValue="L'Éden Hotel & Lodge" className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm font-serif focus:outline-none focus:border-[#C5A059] transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">Devise</label>
                <select className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm focus:outline-none focus:border-[#C5A059] transition-colors appearance-none">
                  <option>EUR (€)</option>
                  <option>USD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">Fuseau horaire</label>
                <select className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm focus:outline-none focus:border-[#C5A059] transition-colors appearance-none">
                  <option>Europe/Paris</option>
                  <option>Indian/Reunion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">
                Connexion Supabase
                <span className={`ml-2 inline-block w-2 h-2 rounded-full ${isSupabaseConnected() ? 'bg-green-500' : 'bg-red-500'}`} />
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="URL Supabase"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm font-mono focus:outline-none focus:border-[#C5A059] transition-colors"
                />
                <input
                  type="password"
                  placeholder="Clé Anon"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm font-mono focus:outline-none focus:border-[#C5A059] transition-colors"
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest opacity-40 mt-3">
                {isSupabaseConnected() ? 'Connecté à Supabase.' : 'Mode démo — données locales utilisées.'}
              </p>
            </div>
          </div>
          
          <div className="p-8 bg-[#FAF9F6] border-t border-[#1A1A1A]/5 flex justify-between items-center">
            {saved && <span className="text-[10px] uppercase tracking-widest text-green-600 font-bold">Configuration sauvegardée !</span>}
            <div className="flex-1" />
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#222] transition-colors rounded-sm"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white border border-[#1A1A1A]/10 rounded-sm p-8">
          <div className="mb-6 pb-4 border-b border-[#1A1A1A]/5">
            <h3 className="text-sm font-bold uppercase tracking-widest">Rôles & Permissions</h3>
            <p className="text-[10px] uppercase tracking-widest opacity-40 mt-2">Définissez les rôles et leurs permissions.</p>
          </div>
          <RolesSettingsTab />
        </div>
      )}
    </div>
  );
}
