import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Copy, Search, Archive, Plus, Trash2, Edit3, Check, X, Menu } from 'lucide-react';
import './App.css';

const UTMBuilder = ({ campaigns, setCampaigns }) => {
  const [selectedChannel, setSelectedChannel] = useState('');
  const [utmParams, setUtmParams] = useState({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: ''
  });
  const [baseUrl, setBaseUrl] = useState('https://example.com');
  const [copySuccess, setCopySuccess] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const channels = {
    'Google Ads': { source: 'google', medium: 'cpc', showTerm: true },
    'Bing Ads': { source: 'bing', medium: 'cpc', showTerm: true },
    'Facebook Ads': { source: '{{site_source_name}}', medium: 'cpc', showTerm: false },
    'Tiktok Ads': { source: 'tiktok', medium: 'cpc', showTerm: false },
    'Email': { source: 'newsletter', medium: 'email', showTerm: false },
    'Social Organic': { source: '{{site_source_name}}', medium: 'organic', showTerm: false },
    'SEO': { source: 'google', medium: 'organic', showTerm: false },
    'Affiliate': { source: 'affiliate', medium: 'referral', showTerm: false },
    'Koop': { source: 'partner', medium: 'koop', showTerm: false },
    'Push': { source: 'website', medium: 'push', showTerm: false }
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/campaigns');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCampaigns(data);
      } catch (error) {
        console.error('Fehler beim Laden der Kampagnen:', error.message);
      }
    };
    fetchCampaigns();
  }, [setCampaigns]);

  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
    const channelData = channels[channel];
    setUtmParams(prev => ({
      ...prev,
      source: channelData.source,
      medium: channelData.medium,
      term: channelData.showTerm ? '{keyword}' : ''
    }));
    setValidationErrors({});
  };

  const validateNomenclature = (value, field, isLibraryScreen = false, selectedChannel = '') => {
    const errors = {};
    if (value) {
      if (/[^a-z0-9_{}]/.test(value)) errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
      if (/\s/.test(value)) errors[field] = 'Keine Leerzeichen';

      if (field === 'campaign') {
        if (isLibraryScreen) {
          const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*(_[a-z0-9][a-z0-9_]*)?$/;
          if (!pattern.test(value)) errors.campaign = 'Format: YYYY_MM_aktion[_variante]';
        } else {
          if (/[^a-z0-9_{}]/.test(value)) errors.campaign = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
        }
      }

      if ((field === 'content' || field === 'term') && /[^a-z0-9_{}]/.test(value)) {
        errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
      }

      // Spezielle Validierung für utm_content bei Facebook/TikTok Ads
      if (field === 'content' && (selectedChannel === 'Facebook Ads' || selectedChannel === 'TikTok Ads')) {
        const allowedDatalistValues = ['{{placement}}', '__PLACEMENT__'];
        if (!allowedDatalistValues.includes(value)) {
          if (/[A-Z]/.test(value)) {
            errors[field] = 'Nur Kleinbuchstaben erlaubt, es sei denn, der Wert stammt aus der Vorschlagsliste';
          }
        }
      } else if (field === 'content' && /[A-Z]/.test(value)) {
        errors[field] = 'Nur Kleinbuchstaben erlaubt';
      }
    }
    return errors;
  };

  const handleParamChange = (field, value) => {
    setUtmParams(prev => ({ ...prev, [field]: value }));
    const errors = validateNomenclature(value, field, false, selectedChannel);
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

  const hasValidationErrors = Object.values(validationErrors).some(error => error !== null && error !== undefined);
  const canGenerateUrl = selectedChannel && utmParams.source && utmParams.medium && utmParams.campaign && !hasValidationErrors;

  return (
    <div className="min-h-screen bg-[var(--background-color)] relative">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>UTM Parameter Builder</h1>
          <button onClick={() => setMenuOpen(!menuOpen)} className="icon">
            <Menu size={24} />
          </button>
        </div>
      </header>
      <div className={`menu ${menuOpen ? 'menu-open' : ''}`}>
        <button onClick={() => setMenuOpen(false)} className="icon absolute top-4 right-4">
          <X size={24} />
        </button>
        <Link to="/library" onClick={() => setMenuOpen(false)} className="menu-item">Kampagnen</Link>
        <Link to="/licenses" onClick={() => setMenuOpen(false)} className="menu-item">Lizenzen</Link>
      </div>
      <div className="container content-container relative z-10">
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
                    <label>UTM Campaign * <span className="text-xs text-gray-500 ml-2">Nur Kleinbuchstaben, Zahlen, Unterstriche und {}</span></label>
                    <div className="flex gap-4">
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
                        className="flex-1"
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
                    {selectedChannel === 'Facebook Ads' || selectedChannel === 'Tiktok Ads' ? (
                      <input
                        type="text"
                        value={utmParams.content}
                        onChange={(e) => handleParamChange('content', e.target.value)}
                        className={`w-full ${validationErrors.content ? 'error' : ''} appearance-none border border-gray-30 rounded-lg p-2`}
                        placeholder="banner_header"
                        list="contentSuggestions"
                      />
                    ) : (
                      <input
                        type="text"
                        value={utmParams.content}
                        onChange={(e) => handleParamChange('content', e.target.value)}
                        className={validationErrors.content ? 'error' : ''}
                        placeholder="banner_header"
                      />
                    )}
                    {(selectedChannel === 'Facebook Ads' || selectedChannel === 'Tiktok Ads') && (
                      <datalist id="contentSuggestions">
                        {selectedChannel === 'Facebook Ads' && <option value="{{placement}}" />}
                        {selectedChannel === 'Tiktok Ads' && <option value="__PLACEMENT__" />}
                      </datalist>
                    )}
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
                      className="flex-1 px-4 py-3 text-sm bg-gray-800 border border-[var(--border-color)] rounded-lg"
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
  const [validationErrors, setValidationErrors] = useState({});
  const categories = ['Saisonale Aktionen', 'Produktlaunches', 'Gewinnspiele', 'Rabattaktionen', 'Brand Awareness', 'Sonstiges'];

  const addCampaign = async () => {
    if (newCampaign.name && newCampaign.category) {
      const errors = validateNomenclature(newCampaign.name, 'campaign', true);
      if (Object.keys(errors).length === 0) {
        try {
          const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCampaign.name, category: newCampaign.category })
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const newCamp = await response.json();
          setCampaigns(prev => [...prev, newCamp]);
          setNewCampaign({ name: '', category: '', archived: false });
          setValidationErrors({});
        } catch (error) {
          console.error('Fehler beim Hinzufügen der Kampagne:', error.message);
        }
      } else {
        setValidationErrors(errors);
      }
    }
  };

  const deleteCampaign = async (id) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen der Kampagne:', error.message);
    }
  };

  const toggleArchive = async (id) => {
    const campaign = campaigns.find(c => c.id === id);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, archived: !campaign.archived })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updated = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error('Fehler beim Archivieren der Kampagne:', error.message);
    }
  };

  const updateCampaign = async (id, updatedCampaign) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedCampaign })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updated = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
      setEditingCampaign(null);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Kampagne:', error.message);
    }
  };

  const validateNomenclature = (value, field, isLibraryScreen = false, selectedChannel = '') => {
    const errors = {};
    if (value) {
      if (/[^a-z0-9_{}]/.test(value)) errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
      if (/\s/.test(value)) errors[field] = 'Keine Leerzeichen';

      if (field === 'campaign') {
        if (isLibraryScreen) {
          const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*(_[a-z0-9][a-z0-9_]*)?$/;
          if (!pattern.test(value)) errors.campaign = 'Format: YYYY_MM_aktion[_variante]';
        } else {
          if (/[^a-z0-9_{}]/.test(value)) errors.campaign = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
        }
      }

      if ((field === 'content' || field === 'term') && /[^a-z0-9_{}]/.test(value)) {
        errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
      }

      // Spezielle Validierung für utm_content bei Facebook/TikTok Ads
      if (field === 'content' && (selectedChannel === 'Facebook Ads' || selectedChannel === 'TikTok Ads')) {
        const allowedDatalistValues = ['{{placement}}', '__PLACEMENT__'];
        if (!allowedDatalistValues.includes(value)) {
          if (/[A-Z]/.test(value)) {
            errors[field] = 'Nur Kleinbuchstaben erlaubt, es sei denn, der Wert stammt aus der Vorschlagsliste';
          }
        }
      } else if (field === 'content' && /[A-Z]/.test(value)) {
        errors[field] = 'Nur Kleinbuchstaben erlaubt';
      }
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
      <div className="container content-container">
        <div className="card">
          <div>
            <h2>Kampagnen-Bibliothek</h2>
            <div className="mb-6 p-6 bg-[var(--card-background)] rounded-lg border border-custom shadow-lg">
              <h3>Neue Kampagne hinzufügen <span className="text-xs text-gray-500 ml-2">Format: YYYY_MM_aktion[_variante]</span></h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Kampagnenname (z.B. 2025_08_urlaubsrabatt_01)"
                    value={newCampaign.name}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setNewCampaign(prev => ({ ...prev, name: newValue }));
                      const errors = validateNomenclature(newValue, 'campaign', true);
                      setValidationErrors(errors);
                    }}
                    className={`w-full ${validationErrors.campaign ? 'error' : ''}`}
                  />
                  {validationErrors.campaign && <p className="error-message">{validationErrors.campaign}</p>}
                </div>
                <div className="flex gap-3">
                  <select
                    value={newCampaign.category}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, category: e.target.value }))}
                    className="flex-1"
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    onClick={addCampaign}
                    disabled={!newCampaign.name || !newCampaign.category || Object.keys(validationErrors).length > 0}
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
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setCampaigns(prev => prev.map(c => 
                              c.id === campaign.id ? { ...c, name: newValue } : c
                            ));
                            const errors = validateNomenclature(newValue, 'campaign', true);
                            setValidationErrors(errors);
                          }}
                          className={`w-full px-2 py-1 text-sm border border-[var(--border-color)] rounded-lg ${validationErrors.campaign ? 'error' : ''}`}
                        />
                        <select
                          value={campaign.category}
                          onChange={(e) => setCampaigns(prev => prev.map(c => 
                            c.id === campaign.id ? { ...c, category: e.target.value } : c
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
                          disabled={Object.keys(validationErrors).length > 0}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingCampaign(null)}
                          className="icon text-blue-300"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCampaign(campaign.id)}
                          className="icon text-blue-300"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => toggleArchive(campaign.id)}
                          className={`icon ${campaign.archived ? 'text-blue-600' : 'text-orange-600'}`}
                        >
                          <Archive size={14} />
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

const Licenses = () => {
  const [licenses, setLicenses] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLicense, setNewLicense] = useState({ category: '', tags: '', name: '', utm_writing: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLicense, setEditLicense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLicenses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/licenses?search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Sicherstellen, dass data ein Objekt ist
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        setLicenses(data);
      } else {
        console.error('Unerwartetes Datenformat:', data);
        setLicenses({});
      }
    } catch (error) {
      console.error('Fehler beim Laden der Lizenzen:', error.message);
      setLicenses({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLicenses();
    }, 300); // Debounce für bessere Performance

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleFilter = (category) => {
    setSearchTerm(category);
  };

  const resetForm = () => {
    setNewLicense({ category: '', tags: '', name: '', utm_writing: '' });
    setValidationErrors({});
  };

  const validateLicense = (license) => {
    const errors = {};
    if (!license.category?.trim()) errors.category = 'Kategorie ist erforderlich';
    if (!license.name?.trim()) errors.name = 'Name ist erforderlich';
    if (!license.utm_writing?.trim()) errors.utm_writing = 'UTM-Schreibweise ist erforderlich';
    return errors;
  };

  const showSuccess = () => {
    setShowSuccessDialog(true);
    setTimeout(() => setShowSuccessDialog(false), 2000);
  };

  const handleAddLicense = async () => {
    const errors = validateLicense(newLicense);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newLicense.category.trim(),
          tags: newLicense.tags.trim() || null,
          name: newLicense.name.trim(),
          utm_writing: newLicense.utm_writing.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unbekannter Fehler');
      }

      await fetchLicenses(); // Daten neu laden
      setShowAddModal(false);
      resetForm();
      showSuccess();
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error.message);
      setValidationErrors({ general: `Fehler beim Hinzufügen: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLicense = async () => {
    if (!editLicense?.id) {
      setValidationErrors({ general: 'Keine gültige Lizenz zum Bearbeiten' });
      return;
    }

    const errors = validateLicense(editLicense);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editLicense.id,
          category: editLicense.category.trim(),
          tags: editLicense.tags?.trim() || null,
          name: editLicense.name.trim(),
          utm_writing: editLicense.utm_writing.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unbekannter Fehler');
      }

      await fetchLicenses(); // Daten komplett neu laden
      setShowEditModal(false);
      setEditLicense(null);
      setValidationErrors({});
      showSuccess();
    } catch (error) {
      console.error('Fehler beim Bearbeiten:', error.message);
      setValidationErrors({ general: `Fehler beim Bearbeiten: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLicense = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/licenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unbekannter Fehler');
      }

      await fetchLicenses(); // Daten neu laden
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Fehler beim Löschen:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (license) => {
    // Sicherstellen, dass alle Eigenschaften kopiert werden
    setEditLicense({
      id: license.id,
      category: license.category || '',
      tags: license.tags || '',
      name: license.name || '',
      utm_writing: license.utm_writing || ''
    });
    setShowEditModal(true);
    setValidationErrors({});
  };

  const uniqueCategories = Object.keys(licenses).filter(cat => cat && cat.trim() !== '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showEditModal && editLicense) {
        handleEditLicense();
      } else if (showAddModal) {
        handleAddLicense();
      }
    } else if (e.key === 'Escape') {
      if (showEditModal) {
        setShowEditModal(false);
        setEditLicense(null);
        setValidationErrors({});
      } else if (showAddModal) {
        setShowAddModal(false);
        resetForm();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>Lizenzen</h1>
          <Link to="/" className="icon"><X size={24} /></Link>
        </div>
      </header>
      
      <div className="container content-container">
        <div className="card">
          <div className="mb-10">
            <div className="search-container flex items-center justify-between">
              <div className="flex items-center flex-1">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Suche nach Kategorie, Name oder Tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  disabled={isLoading}
                />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="danger icon ml-2"
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {uniqueCategories.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleFilter(cat)}
                    className="px-3 py-1 bg-[var(--secondary-color)] text-sm rounded-lg hover:bg-opacity-80"
                    disabled={isLoading}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="primary mb-4 flex items-center"
            disabled={isLoading}
          >
            <Plus size={16} /> Neue Lizenz
          </button>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Neue Lizenz hinzufügen</h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Kategorie *"
                      value={newLicense.category}
                      onChange={(e) => setNewLicense({ ...newLicense, category: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.category ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                      autoFocus
                    />
                    {validationErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Tags (optional)"
                      value={newLicense.tags}
                      onChange={(e) => setNewLicense({ ...newLicense, tags: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Name *"
                      value={newLicense.name}
                      onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.name ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="UTM-Schreibweise *"
                      value={newLicense.utm_writing}
                      onChange={(e) => setNewLicense({ ...newLicense, utm_writing: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.utm_writing ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {validationErrors.utm_writing && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.utm_writing}</p>
                    )}
                  </div>
                  
                  {validationErrors.general && (
                    <p className="text-red-500 text-sm">{validationErrors.general}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddLicense}
                      className="primary px-4 py-2 rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="danger px-4 py-2 rounded-lg"
                      disabled={isLoading}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditModal && editLicense && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Lizenz bearbeiten</h2>
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Kategorie *"
                      value={editLicense.category}
                      onChange={(e) => setEditLicense({ ...editLicense, category: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.category ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                      autoFocus
                    />
                    {validationErrors.category && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.category}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Tags (optional)"
                      value={editLicense.tags}
                      onChange={(e) => setEditLicense({ ...editLicense, tags: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Name *"
                      value={editLicense.name}
                      onChange={(e) => setEditLicense({ ...editLicense, name: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.name ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="UTM-Schreibweise *"
                      value={editLicense.utm_writing}
                      onChange={(e) => setEditLicense({ ...editLicense, utm_writing: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.utm_writing ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {validationErrors.utm_writing && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.utm_writing}</p>
                    )}
                  </div>
                  
                  {validationErrors.general && (
                    <p className="text-red-500 text-sm">{validationErrors.general}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditLicense}
                      className="primary px-4 py-2 rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                    </button>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setValidationErrors({});
                        setEditLicense(null);
                      }}
                      className="danger px-4 py-2 rounded-lg"
                      disabled={isLoading}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Dialog */}
          {showSuccessDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md text-center">
                <div className="text-green-500 mb-2">
                  <Check size={32} className="mx-auto" />
                </div>
                <p>Vorgang erfolgreich abgeschlossen!</p>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md text-center">
                <h2 className="text-lg font-semibold mb-4">Lizenz löschen</h2>
                <p>Sind Sie sicher, dass Sie diese Lizenz löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => handleDeleteLicense(showDeleteConfirm)}
                    className="danger px-4 py-2 rounded-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Wird gelöscht...' : 'Ja, löschen'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="secondary px-4 py-2 rounded-lg"
                    disabled={isLoading}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
              <div className="bg-[var(--card-background)] p-4 rounded-lg">
                <p>Lädt...</p>
              </div>
            </div>
          )}

          {/* License Tables */}
          {uniqueCategories.length > 0 ? (
            uniqueCategories.map(category => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center">{category}</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed min-w-full">
                    <thead>
                      <tr className="bg-[var(--card-background)]">
                        <th className="border p-2 text-left w-1/4">Name</th>
                        <th className="border p-2 text-left w-1/4">Tags</th>
                        <th className="border p-2 text-left w-1/4">UTM-Schreibweise</th>
                        <th className="border p-2 text-center w-1/4">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(licenses[category] || []).map((license, index) => (
                        <tr key={license.id || index} className={`border-t ${index % 2 === 0 ? 'bg-gray-600' : ''}`}>
                          <td className="p-2 break-words">{license.name}</td>
                          <td className="p-2 break-words">{license.tags || '-'}</td>
                          <td className="p-2 break-words">{license.utm_writing}</td>
                          <td className="p-2">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => openEditModal(license)}
                                className="icon p-1 text-blue-300"
                                title="Bearbeiten"
                                disabled={isLoading}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(license.id)}
                                className="danger icon p-1"
                                title="Löschen"
                                disabled={isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              {isLoading ? 'Lädt Lizenzen...' : 'Keine Lizenzen gefunden'}
            </div>
          )}
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
        <Route path="/licenses" element={<Licenses />} />
      </Routes>
    </Router>
  );
};

export default App;