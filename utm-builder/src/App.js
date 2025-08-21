import React, { useState, useEffect } from 'react';
import { Copy, Search, Archive, Plus, Trash2, Edit3, Check, X } from 'lucide-react';

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
    'Google Ads': { source: 'google', medium: 'cpc', showTerm: true },
    'Bing Ads': { source: 'bing', medium: 'cpc', showTerm: true },
    'Facebook Ads': { source: 'facebook', medium: 'paid', showTerm: false },
    'Tiktok Ads': { source: 'tiktok', medium: 'paid', showTerm: false },
    'Email': { source: 'newsletter', medium: 'email', showTerm: false },
    'Social Organic': { source: 'organic', medium: 'social', showTerm: false },
    'SEO': { source: 'google', medium: 'organic', showTerm: false },
    'Affiliate': { source: 'affiliate', medium: 'referral', showTerm: false },
    'Koop': { source: 'partner', medium: 'koop', showTerm: false },
    'Push': { source: 'website', medium: 'push', showTerm: false }
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
      // Check naming convention: [Jahr]_[Monat]_[Aktion]_[Variante]
      const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*_[a-z0-9][a-z0-9_]*$/;
      
      if (!pattern.test(value)) {
        errors.campaign = 'Format: YYYY_MM_aktion_variante (nur Kleinbuchstaben, Zahlen und Unterstriche)';
      }
      
      // Check for uppercase letters
      if (/[A-Z]/.test(value)) {
        errors.campaign = 'Nur Kleinbuchstaben erlaubt';
      }
      
      // Check for spaces
      if (/\s/.test(value)) {
        errors.campaign = 'Keine Leerzeichen erlaubt, verwende Unterstriche';
      }
      
      // Check for invalid characters
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">UTM Parameter Builder</h1>
          <p className="text-gray-600 mb-8">Erstelle konsistente UTM-Parameter für alle Marketing-Channels</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* UTM Builder */}
            <div>
              <h2 className="text-xl font-semibold mb-4">UTM Parameter Generator</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel auswählen</label>
                  <select
                    value={selectedChannel}
                    onChange={(e) => handleChannelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Channel wählen --</option>
                    {Object.keys(channels).map(channel => (
                      <option key={channel} value={channel}>{channel}</option>
                    ))}
                  </select>
                </div>

                {selectedChannel && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UTM Source</label>
                        <input
                          type="text"
                          value={utmParams.source}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UTM Medium</label>
                        <input
                          type="text"
                          value={utmParams.medium}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        UTM Campaign *
                        <span className="text-xs text-gray-500 ml-2">Format: YYYY_MM_aktion_variante</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={utmParams.campaign}
                          onChange={(e) => handleParamChange('campaign', e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.campaign ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="2025_08_urlaubsrabatt_01"
                        />
                        <select
                          value=""
                          onChange={(e) => handleParamChange('campaign', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Aus Bibliothek wählen</option>
                          {campaigns.filter(c => !c.archived).map(campaign => (
                            <option key={campaign.id} value={campaign.name}>{campaign.name}</option>
                          ))}
                        </select>
                      </div>
                      {validationErrors.campaign && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.campaign}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UTM Content (optional)</label>
                      <input
                        type="text"
                        value={utmParams.content}
                        onChange={(e) => handleParamChange('content', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.content ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="banner_header"
                      />
                      {validationErrors.content && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.content}</p>
                      )}
                    </div>

                    {channels[selectedChannel]?.showTerm && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">UTM Term (für SEA)</label>
                        <input
                          type="text"
                          value={utmParams.term}
                          onChange={(e) => handleParamChange('term', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.term ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="keyword"
                        />
                        {validationErrors.term && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.term}</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {canGenerateUrl && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-2">Generierte URL:</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={generateUrl()}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={copyToClipboard}
                        className={`px-4 py-2 rounded-md transition-colors ${
                          copySuccess
                            ? 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    {copySuccess && (
                      <p className="text-green-600 text-sm mt-2">✓ URL in Zwischenablage kopiert!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Library */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Kampagnen-Bibliothek</h2>
              
              {/* Add new campaign */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Neue Kampagne hinzufügen</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Kampagnenname (z.B. 2025_08_urlaubsrabatt_01)"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({...prev, name: e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newCampaign.category}
                      onChange={(e) => setNewCampaign(prev => ({...prev, category: e.target.value}))}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Kategorie wählen</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      onClick={addCampaign}
                      disabled={!newCampaign.name || !newCampaign.category}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search and filter */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Kampagnen durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${
                    showArchived
                      ? 'bg-gray-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Archive size={16} />
                </button>
              </div>

              {/* Campaign list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCampaigns.map(campaign => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm">
                    <div className="flex-1">
                      {editingCampaign === campaign.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={campaign.name}
                            onChange={(e) => setCampaigns(prev => prev.map(c => 
                              c.id === campaign.id ? {...c, name: e.target.value} : c
                            ))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <select
                            value={campaign.category}
                            onChange={(e) => setCampaigns(prev => prev.map(c => 
                              c.id === campaign.id ? {...c, category: e.target.value} : c
                            ))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-sm">{campaign.name}</div>
                          <div className="text-xs text-gray-500">{campaign.category}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      {editingCampaign === campaign.id ? (
                        <>
                          <button
                            onClick={() => updateCampaign(campaign.id, campaign)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingCampaign(null)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingCampaign(campaign.id)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => toggleArchive(campaign.id)}
                            className={`p-1 rounded ${
                              campaign.archived
                                ? 'text-blue-600 hover:bg-blue-100'
                                : 'text-orange-600 hover:bg-orange-100'
                            }`}
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            onClick={() => deleteCampaign(campaign.id)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredCampaigns.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    {showArchived ? 'Keine archivierten Kampagnen gefunden' : 'Keine aktiven Kampagnen gefunden'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UTMBuilder;