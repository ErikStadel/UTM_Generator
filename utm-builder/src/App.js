import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Copy, Search, Archive, Plus, Trash2, Edit3, Check, X, Menu } from 'lucide-react';
import './App.css';

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
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [copySuccess, setCopySuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
  };

  const validateNomenclature = (value, field) => {
    const errors = {};
    if (field === 'campaign' && value) {
      const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*_[a-z0-9][a-z0-9_]*$/;
      if (!pattern.test(value)) errors.campaign = 'Format: YYYY_MM_aktion_variante';
      if (/[A-Z]/.test(value)) errors.campaign = 'Nur Kleinbuchstaben';
      if (/\s/.test(value)) errors.campaign = 'Keine Leerzeichen';
      if (/[^a-z0-9_]/.test(value)) errors.campaign = 'Nur Buchstaben, Zahlen, Unterstriche';
    }
    if (field === 'content' && value && /[A-Z\s]/.test(value)) {
      errors.content = 'Nur Kleinbuchstaben und Unterstriche';
    }
    if (field === 'term' && value && /[A-Z\s]/.test(value)) {
      errors.term = 'Nur Kleinbuchstaben und Unterstriche';
    }
    return errors;
  };

  const handleParamChange = (field, value) => {
    setUtmParams(prev => ({ ...prev, [field]: value }));
    const errors = validateNomenclature(value, field);
    setValidationErrors(prev => ({ ...prev, ...errors, [field]: errors[field] || null }));
  };

  const generateUrl = () => {
    if (!baseUrl || !utmParams.source || !utmParams.medium || !utmParams.campaign) return '';
    const params = new URLSearchParams();
    params.append('utm_source', utmParams.source);
    params.append('utm_medium', utmParams.medium);
    params.append('utm_campaign', utmParams.campaign);
    if (utmParams.content) params.append('utm_content', utmParams.content);
    if (utmParams.term && channels[selectedChannel]?.showTerm) params.append('utm_term', utmParams.term);
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

  const [validationErrors, setValidationErrors] = useState({});
  const hasValidationErrors = Object.values(validationErrors).some(error => error !== null && error !== undefined);
  const canGenerateUrl = selectedChannel && utmParams.source && utmParams.medium && utmParams.campaign && !hasValidationErrors;

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>UTM Parameter Builder</h1>
          <button onClick={() => setMenuOpen(!menuOpen)} className="icon">
            <Menu size={24} />
          </button>
        </div>
      </header>
      <div className={`menu ${menuOpen ? 'menu-open' : ''}`}>
        <Link to="/library" onClick={() => setMenuOpen(false)} className="menu-item">Bibliothek</Link>
      </div>
      <div className="container">
        <div className="card">
          <p>Erstelle konsistente UTM-Parameter für alle Marketing-Channels</p>
          <div>
            <h2>UTM Parameter Generator</h2>
            <div className="space-y-6">
              <div>
                <label>Base URL</label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label>Channel auswählen</label>
                <select
                  value={selectedChannel}
                  onChange={(e) => handleChannelChange(e.target.value)}
                  className="w-full"
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
                      <label>UTM Source</label>
                      <input type="text" value={utmParams.source} readOnly className="w-full" />
                    </div>
                    <div>
                      <label>UTM Medium</label>
                      <input type="text" value={utmParams.medium} readOnly className="w-full" />
                    </div>
                  </div>
                  <div>
                    <label>UTM Campaign * <span className="text-xs text-gray-500 ml-2">Format: YYYY_MM_aktion_variante</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={utmParams.campaign}
                        onChange={(e) => handleParamChange('campaign', e.target.value)}
                        className={`flex-1 ${validationErrors.campaign ? 'error' : ''}`}
                        placeholder="2025_08_urlaubsrabatt_01"
                      />
                      <select
                        value=""
                        onChange={(e) => handleParamChange('campaign', e.target.value)}
                        className="w-48"
                      >
                        <option value="">Aus Bibliothek wählen</option>
                        {campaigns.filter(c => !c.archived).map(campaign => (
                          <option key={campaign.id} value={campaign.name}>{campaign.name}</option>
                        ))}
                      </select>
                    </div>
                    {validationErrors.campaign && <p className="error-message">{validationErrors.campaign}</p>}
                  </div>
                  <div>
                    <label>UTM Content (optional)</label>
                    <input
                      type="text"
                      value={utmParams.content}
                      onChange={(e) => handleParamChange('content', e.target.value)}
                      className={validationErrors.content ? 'error' : ''}
                      placeholder="banner_header"
                    />
                    {validationErrors.content && <p className="error-message">{validationErrors.content}</p>}
                  </div>
                  {channels[selectedChannel]?.showTerm && (
                    <div>
                      <label>UTM Term (für SEA)</label>
                      <input
                        type="text"
                        value={utmParams.term}
                        onChange={(e) => handleParamChange('term', e.target.value)}
                        className={validationErrors.term ? 'error' : ''}
                        placeholder="keyword"
                      />
                      {validationErrors.term && <p className="error-message">{validationErrors.term}</p>}
                    </div>
                  )}
                </>
              )}
              {canGenerateUrl && (
                <div className="generated-url-container">
                  <h3>Generierte URL:</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={generateUrl()}
                      readOnly
                      className="flex-1 px-4 py-3 text-sm bg-white border border-[var(--border-color)] rounded-lg"
                    />
                    <button onClick={copyToClipboard} className={copySuccess ? 'success' : 'primary'}>
                      {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  {copySuccess && <p className="text-[var(--success-color)] text-sm mt-2">✓ URL in Zwischenablage kopiert!</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignLibrary = ({ campaigns, setCampaigns }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', category: '', archived: false });
  const [editingCampaign, setEditingCampaign] = useState(null);
  const categories = ['Saisonale Aktionen', 'Produktlaunches', 'Gewinnspiele', 'Rabattaktionen', 'Brand Awareness', 'Sonstiges'];

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
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, archived: !c.archived } : c));
  };

  const updateCampaign = (id, updatedCampaign) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updatedCampaign } : c));
    setEditingCampaign(null);
  };

  const validateNomenclature = (value, field) => {
    const errors = {};
    if (field === 'campaign' && value) {
      const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*_[a-z0-9][a-z0-9_]*$/;
      if (!pattern.test(value)) errors.campaign = 'Format: YYYY_MM_aktion_variante';
      if (/[A-Z]/.test(value)) errors.campaign = 'Nur Kleinbuchstaben';
      if (/\s/.test(value)) errors.campaign = 'Keine Leerzeichen';
      if (/[^a-z0-9_]/.test(value)) errors.campaign = 'Nur Buchstaben, Zahlen, Unterstriche';
    }
    return errors;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchiveFilter = showArchived ? campaign.archived : !campaign.archived;
    return matchesSearch && matchesArchiveFilter;
  });

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>Kampagnen-Bibliothek</h1>
          <Link to="/" className="icon"><X size={24} /></Link>
        </div>
      </header>
      <div className="container">
        <div className="card">
          <div>
            <h2>Kampagnen-Bibliothek</h2>
            <div className="mb-6 p-6 bg-[var(--card-background)] rounded-lg border border-custom shadow-lg">
              <h3>Neue Kampagne hinzufügen</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Kampagnenname (z.B. 2025_08_urlaubsrabatt_01)"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({...prev, name: e.target.value}))}
                  className="w-full"
                />
                <div className="flex gap-3">
                  <select
                    value={newCampaign.category}
                    onChange={(e) => setNewCampaign(prev => ({...prev, category: e.target.value}))}
                    className="flex-1"
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={addCampaign}
                    disabled={!newCampaign.name || !newCampaign.category}
                    className="primary"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mb-6">
              <div className="search-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Kampagnen durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={showArchived ? 'bg-gray-500 text-white' : 'secondary'}
              >
                <Archive size={16} />
              </button>
            </div>
            <div className="campaign-list">
              {filteredCampaigns.map(campaign => (
                <div key={campaign.id} className="campaign-item">
                  <div className="flex-1">
                    {editingCampaign === campaign.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={campaign.name}
                          onChange={(e) => setCampaigns(prev => prev.map(c => 
                            c.id === campaign.id ? {...c, name: e.target.value} : c
                          ))}
                          className="w-full px-2 py-1 text-sm border border-[var(--border-color)] rounded-lg"
                        />
                        <select
                          value={campaign.category}
                          onChange={(e) => setCampaigns(prev => prev.map(c => 
                            c.id === campaign.id ? {...c, category: e.target.value} : c
                          ))}
                          className="w-full px-2 py-1 text-sm border border-[var(--border-color)] rounded-lg"
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
                  <div className="flex items-center gap-2 ml-3">
                    {editingCampaign === campaign.id ? (
                      <>
                        <button
                          onClick={() => updateCampaign(campaign.id, campaign)}
                          className="icon text-[var(--success-color)]"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingCampaign(null)}
                          className="icon text-gray-600"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCampaign(campaign.id)}
                          className="icon text-gray-600"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleArchive(campaign.id)}
                          className={`icon ${campaign.archived ? 'text-blue-600' : 'text-orange-600'}`}
                        >
                          <Archive size=14} />
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="danger"
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
  );
};

const App = () => {
  const [campaigns, setCampaigns] = useState([]);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UTMBuilder campaigns={campaigns} setCampaigns={setCampaigns} />} />
        <Route path="/library" element={<CampaignLibrary campaigns={campaigns} setCampaigns={setCampaigns} />} />
      </Routes>
    </Router>
  );
};

export default App;