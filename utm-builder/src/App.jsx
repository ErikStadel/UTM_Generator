import React, { useState, useEffect } from 'react';
import { Copy, Search, Archive, Plus, Trash2, Edit3, Check, X, Link, Zap } from 'lucide-react';
import './UTMBuilder.css'; // Import der CSS-Datei

const UTMBuilder = () => {
  const [selectedChannel, setSelectedChannel] = useState('');
  const [utmParams, setUtmParams] = useState({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: ''
  });
  const [campaigns, setCampaigns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', category: '', archived: false });
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [copySuccess, setCopySuccess] = useState(false);

  const channels = {
    'Google Ads': { source: 'google', medium: 'cpc', showTerm: true, color: '#4285f4', icon: '🎯' },
    'Bing Ads': { source: 'bing', medium: 'cpc', showTerm: true, color: '#00809d', icon: '🎯' },
    'Facebook Ads': { source: 'facebook', medium: 'paid', showTerm: false, color: '#1877f2', icon: '📘' },
    'Tiktok Ads': { source: 'tiktok', medium: 'paid', showTerm: false, color: '#ff0050', icon: '🎵' },
    'Email': { source: 'newsletter', medium: 'email', showTerm: false, color: '#ea4335', icon: '📧' },
    'Social Organic': { source: 'organic', medium: 'social', showTerm: false, color: '#1da1f2', icon: '📱' },
    'SEO': { source: 'google', medium: 'organic', showTerm: false, color: '#34a853', icon: '🔍' },
    'Affiliate': { source: 'affiliate', medium: 'referral', showTerm: false, color: '#ff6900', icon: '🤝' },
    'Koop': { source: 'partner', medium: 'koop', showTerm: false, color: '#9c27b0', icon: '🤝' },
    'Push': { source: 'website', medium: 'push', showTerm: false, color: '#795548', icon: '🔔' }
  };

  const categories = ['Saisonale Aktionen', 'Produktlaunches', 'Gewinnspiele', 'Rabattaktionen', 'Brand Awareness', 'Sonstiges'];

  // Load data from memory on component mount
  useEffect(() => {
    const savedCampaigns = [
      { id: 1, name: '2025_08_urlaubsrabatt_01', category: 'Rabattaktionen', archived: false },
      { id: 2, name: '2025_08_trikotgewinnspiel_liga2_01_männlich', category: 'Gewinnspiele', archived: false },
      { id: 3, name: '2025_07_sommerschlussverkauf_01', category: 'Saisonale Aktionen', archived: true }
    ];
    setCampaigns(savedCampaigns);
  }, []);

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
    const channelData = channels[channel];
    setUtmParams(prev => ({
      ...prev,
      source: channelData.source,
      medium: channelData.medium,
      term: channelData.showTerm ? prev.term : ''
    }));
    setValidationErrors({});
  };

  const validateNomenclature = (value, field) => {
    const errors = {};
    
    if (field === 'campaign' && value) {
      const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*_[a-z0-9][a-z0-9_]*$/;
      
      if (!pattern.test(value)) {
        errors.campaign = 'Format: YYYY_MM_aktion_variante (nur Kleinbuchstaben, Zahlen und Unterstriche)';
      }
      
      if (/[A-Z]/.test(value)) {
        errors.campaign = 'Nur Kleinbuchstaben erlaubt';
      }
      
      if (/\s/.test(value)) {
        errors.campaign = 'Keine Leerzeichen erlaubt, verwende Unterstriche';
      }
      
      if (/[^a-z0-9_]/.test(value)) {
        errors.campaign = 'Nur Buchstaben, Zahlen und Unterstriche erlaubt';
      }
    }
    
    if (field === 'content' && value) {
      if (/[A-Z\s]/.test(value)) {
        errors.content = 'Nur Kleinbuchstaben und Unterstriche erlaubt';
      }
    }
    
    if (field === 'term' && value) {
      if (/[A-Z\s]/.test(value)) {
        errors.term = 'Nur Kleinbuchstaben und Unterstriche erlaubt';
      }
    }
    
    return errors;
  };

  const handleParamChange = (field, value) => {
    setUtmParams(prev => ({
      ...prev,
      [field]: value
    }));
    
    const errors = validateNomenclature(value, field);
    setValidationErrors(prev => ({
      ...prev,
      ...errors,
      [field]: errors[field] || null
    }));
  };

  const generateUrl = () => {
    if (!baseUrl || !utmParams.source || !utmParams.medium || !utmParams.campaign) {
      return '';
    }
    
    const params = new URLSearchParams();
    params.append('utm_source', utmParams.source);
    params.append('utm_medium', utmParams.medium);
    params.append('utm_campaign', utmParams.campaign);
    
    if (utmParams.content) params.append('utm_content', utmParams.content);
    if (utmParams.term && channels[selectedChannel]?.showTerm) {
      params.append('utm_term', utmParams.term);
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = async () => {
    const url = generateUrl();
    if (url) {
      try {
        await navigator.clipboard.writeText(url);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const addCampaign = () => {
    if (newCampaign.name && newCampaign.category) {
      const errors = validateNomenclature(newCampaign.name, 'campaign');
      if (Object.keys(errors).length === 0) {
        setCampaigns(prev => [...prev, {
          id: Date.now(),
          name: newCampaign.name,
          category: newCampaign.category,
          archived: false
        }]);
        setNewCampaign({ name: '', category: '', archived: false });
      }
    }
  };

  const deleteCampaign = (id) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const toggleArchive = (id) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, archived: !c.archived } : c
    ));
  };

  const updateCampaign = (id, updatedCampaign) => {
    setCampaigns(prev => prev.map(c => 
      c.id === id ? { ...c, ...updatedCampaign } : c
    ));
    setEditingCampaign(null);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchiveFilter = showArchived ? campaign.archived : !campaign.archived;
    return matchesSearch && matchesArchiveFilter;
  });

  const hasValidationErrors = Object.values(validationErrors).some(error => error !== null && error !== undefined);
  const canGenerateUrl = selectedChannel && utmParams.source && utmParams.medium && utmParams.campaign && !hasValidationErrors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans antialiased">
      {/* Subtle background pattern for depth */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20 pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:px-8 lg:px-16 max-w-7xl">
        {/* Header with bold, gradient text */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              UTM Builder Pro
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Erstelle professionelle UTM-Parameter mit intelligenter Validierung – optimiert für alle Marketing-Channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UTM Generator Panel – Card with neumorphic shadow */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/30 p-6 md:p-8 shadow-2xl shadow-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <Link className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">URL Generator</h2>
            </div>
            
            <div className="space-y-6">
              {/* Base URL */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-300">Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>

              {/* Channel Selection – Vibrant, hover-scalable buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-300">Marketing Channel</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(channels).map(([channel, data]) => (
                    <button
                      key={channel}
                      onClick={() => handleChannelChange(channel)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:scale-105 hover:shadow-lg ${
                        selectedChannel === channel
                          ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20'
                          : 'border-slate-600 bg-slate-900/30 hover:border-slate-500'
                      }`}
                      style={{ borderColor: selectedChannel === channel ? data.color : '' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{data.icon}</span>
                        <span className="font-semibold text-sm text-white">{channel}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {data.source} • {data.medium}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedChannel && (
                <>
                  {/* Source & Medium – Readonly fields with subtle gradient */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">UTM Source</label>
                      <input
                        type="text"
                        value={utmParams.source}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/30 border border-slate-600 rounded-xl text-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">UTM Medium</label>
                      <input
                        type="text"
                        value={utmParams.medium}
                        readOnly
                        className="w-full px-4 py-3 bg-slate-900/30 border border-slate-600 rounded-xl text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Campaign */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">
                      UTM Campaign *
                      <span className="text- text-slate-400 ml-2 font-normal">Format: YYYY_MM_aktion_variante</span>
                    </label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="text"
                        value={utmParams.campaign}
                        onChange={(e) => handleParamChange('campaign', e.target.value)}
                        className={`flex- px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                          validationErrors.campaign ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        }`}
                        placeholder="2025_08_urlaubsrabatt_01"
                      />
                      <select
                        value=""
                        onChange={(e) => handleParamChange('campaign', e.target.value)}
                        className="px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-blue-500 focus:outline-none transition-all duration-200"
                      >
                        <option value="">Aus Bibliothek</option>
                        {campaigns.filter(c => !c.archived).map(campaign => (
                          <option key={campaign.id} value={campaign.name}>{campaign.name}</option>
                        ))}
                      </select>
                    </div>
                    {validationErrors.campaign && (
                      <p className="text-red-400 text-sm flex items-center gap-1 mt-1">
                        ⚠ {validationErrors.campaign}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-300">UTM Content (optional)</label>
                    <input
                      type="text"
                      value={utmParams.content}
                      onChange={(e) => handleParamChange('content', e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                        validationErrors.content ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      }`}
                      placeholder="banner_header"
                    />
                    {validationErrors.content && (
                      <p className="text-red-400 text-sm flex items-center gap-1 mt-1">
                        ⚠ {validationErrors.content}
                      </p>
                    )}
                  </div>

                  {/* Term (SEA only) */}
                  {channels[selectedChannel]?.showTerm && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-300">UTM Term (für SEA)</label>
                      <input
                        type="text"
                        value={utmParams.term}
                        onChange={(e) => handleParamChange('term', e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-200 ${
                          validationErrors.term ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        }`}
                        placeholder="keyword"
                      />
                      {validationErrors.term && (
                        <p className="text-red-400 text-sm flex items-center gap-1 mt-1">
                          ⚠ {validationErrors.term}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Generated URL – With success animation */}
              {canGenerateUrl && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/20 rounded-xl">
                  <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Generierte Tracking-URL
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={generateUrl()}
                      readOnly
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-slate-300 text-sm"
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 w-full md:w-auto ${
                        copySuccess
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20 scale-105'
                          : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105'
                      }`}
                    >
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      {copySuccess ? 'Kopiert!' : 'Kopieren'}
                    </button>
                  </div>
                  {copySuccess && (
                    <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                      ✓ URL erfolgreich in die Zwischenablage kopiert!
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Library Panel */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/30 p-6 md:p-8 shadow-2xl shadow-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <Archive className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Kampagnen-Bibliothek</h2>
            </div>
            
            {/* Add Campaign – Compact card */}
            <div className="mb-6 p-6 bg-slate-900/50 border border-slate-600/50 rounded-xl">
              <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Neue Kampagne hinzufügen
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Kampagnenname (z.B. 2025_08_urlaubsrabatt_01)"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({...prev, name: e.target.value}))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-200"
                />
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    value={newCampaign.category}
                    onChange={(e) => setNewCampaign(prev => ({...prev, category: e.target.value}))}
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white focus:border-purple-500 outline-none transition-all duration-200"
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={addCampaign}
                    disabled={!newCampaign.name || !newCampaign.category}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/20 w-full md:w-auto"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kampagnen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 w-full md:w-auto ${
                  showArchived
                    ? 'bg-orange-500/20 border border-orange-500 text-orange-400 hover:scale-105'
                    : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:scale-105'
                }`}
              >
                <Archive size={16} />
                {showArchived ? 'Archiviert' : 'Aktiv'}
              </button>
            </div>

            {/* Campaign List – Scrollable with custom scrollbar */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {filteredCampaigns.map(campaign => (
                <div key={campaign.id} className="group flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/50 rounded-xl hover:bg-slate-700/30 hover:border-slate-600 transition-all duration-200 hover:shadow-md">
                  <div className="flex-1">
                    {editingCampaign === campaign.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={campaign.name}
                          onChange={(e) => setCampaigns(prev => prev.map(c => 
                            c.id === campaign.id ? {...c, name: e.target.value} : c
                          ))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                        />
                        <select
                          value={campaign.category}
                          onChange={(e) => setCampaigns(prev => prev.map(c => 
                            c.id === campaign.id ? {...c, category: e.target.value} : c
                          ))}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-blue-500 outline-none"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-white text-sm mb-1">{campaign.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="px-2 py-1 bg-slate-700 rounded-md">{campaign.category}</span>
                          {campaign.archived && <span className="text-orange-400">📦 Archiviert</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {editingCampaign === campaign.id ? (
                      <>
                        <button
                          onClick={() => updateCampaign(campaign.id, campaign)}
                          className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-all duration-200"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingCampaign(null)}
                          className="p-2 text-slate-400 hover:bg-slate-400/10 rounded-lg transition-all duration-200"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCampaign(campaign.id)}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all duration-200"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleArchive(campaign.id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            campaign.archived
                              ? 'text-green-400 hover:bg-green-400/10'
                              : 'text-orange-400 hover:bg-orange-400/10'
                          }`}
                        >
                          <Archive size={14} />
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {filteredCampaigns.length === 0 && (
                <div className="text-center text-slate-400 py-12">
                  <Archive className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">Keine Kampagnen gefunden</p>
                  <p className="text-sm">
                    {showArchived ? 'Keine archivierten Kampagnen vorhanden' : 'Erstelle deine erste Kampagne oben'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMBuilder;