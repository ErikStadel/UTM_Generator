import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Copy, Search, Archive, Plus, Trash2, Edit3, Check, X, Menu } from 'lucide-react';
import './App.css';

const Login = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/users/validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.toLowerCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      onLogin(await res.json());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)]">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl mb-4 text-center">Login</h1>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase())}
          onKeyDown={handleKeyDown}
          placeholder="Dein Name"
          className="mb-4 w-full"
          autoFocus
        />
        {error && <p className="error-message mb-2 text-center">{error}</p>}
        <button onClick={handleLogin} className="primary w-full">Anmelden</button>
      </div>
    </div>
  );
};

const Admin = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', role: 'standard' });
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: { 'x-admin-password': adminPassword },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Laden der Nutzer');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: { 'x-admin-password': adminPassword },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ungültiges Admin-Passwort');
      }
      setIsAuthenticated(true);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.role) {
      setError('Name und Rolle erforderlich');
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Hinzufügen');
      }
      const data = await res.json();
      setUsers([...users, data]);
      setNewUser({ name: '', role: 'standard' });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser.id || !editingUser.name || !editingUser.role) {
      setError('ID, Name und Rolle erforderlich');
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify(editingUser),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }
      const data = await res.json();
      setUsers(users.map(u => (u.id === data.id ? data : u)));
      setEditingUser(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }
      setUsers(users.filter(u => u.id !== id));
      setShowDeleteConfirm(null);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isAuthenticated) {
        handleAdminLogin();
      } else if (editingUser) {
        handleUpdateUser();
      } else {
        handleAddUser();
      }
    } else if (e.key === 'Escape') {
      setEditingUser(null);
      setError('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background-color)]">
        <div className="card p-8 w-full max-w-md">
          <h1 className="text-2xl mb-4 text-center">Admin-Login</h1>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Admin-Passwort"
            className="mb-4 w-full"
            autoFocus
          />
          {error && <p className="error-message mb-2 text-center">{error}</p>}
          <button onClick={handleAdminLogin} className="primary w-full" disabled={isLoading}>
            {isLoading ? 'Lädt...' : 'Anmelden'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>Admin: Nutzerverwaltung</h1>
          <Link to="/" className="icon">
            <X size={24} />
          </Link>
        </div>
      </header>
      <div className="container content-container">
        <div className="card">
          <h2 className="text-xl mb-4">Neuen Nutzer hinzufügen</h2>
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value.toLowerCase() })}
              placeholder="Name"
              className="w-full p-2 border rounded-lg"
              onKeyDown={handleKeyDown}
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full p-2 border rounded-lg"
            >
              <option value="standard">Standard</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleAddUser} className="primary" disabled={isLoading}>
              <Plus size={16} /> Hinzufügen
            </button>
            {error && <p className="error-message">{error}</p>}
          </div>
          <h2 className="text-xl mb-4">Nutzerliste</h2>
          {isLoading ? (
            <p>Lädt...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse table-fixed min-w-full">
                <thead>
                  <tr className="bg-[var(--card-background)]">
                    <th className="border p-2 text-left w-1/3">Name</th>
                    <th className="border p-2 text-left w-1/3">Rolle</th>
                    <th className="border p-2 text-center w-1/3">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, index) => (
                    <tr key={u.id} className={`border-t ${index % 2 === 0 ? 'bg-gray-600' : ''}`}>
                      <td className="p-2 break-words">
                        {editingUser?.id === u.id ? (
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) =>
                              setEditingUser({ ...editingUser, name: e.target.value.toLowerCase() })
                            }
                            className="w-full p-1 border rounded-lg"
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          u.name
                        )}
                      </td>
                      <td className="p-2 break-words">
                        {editingUser?.id === u.id ? (
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            className="w-full p-1 border rounded-lg"
                          >
                            <option value="standard">Standard</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-center">
                          {editingUser?.id === u.id ? (
                            <>
                              <button
                                onClick={handleUpdateUser}
                                className="icon text-[var(--success-color)]"
                                disabled={isLoading}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="icon text-blue-300"
                                disabled={isLoading}
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingUser({ id: u.id, name: u.name, role: u.role })}
                                className="icon text-blue-300"
                                disabled={isLoading}
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(u.id)}
                                className="danger icon"
                                disabled={isLoading}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md text-center">
                <h2 className="text-lg font-semibold mb-4">Nutzer löschen</h2>
                <p>Sind Sie sicher, dass Sie diesen Nutzer löschen möchten?</p>
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
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
        </div>
      </div>
    </div>
  );
};

const UTMBuilder = ({ campaigns, setCampaigns, user }) => {
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
  const [licenseSuggestions, setLicenseSuggestions] = useState([]);
  const [showLicenseDropdown, setShowLicenseDropdown] = useState(false);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('');
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  const campaignDropdownRef = useRef(null);
  const licenseDropdownRef = useRef(null);

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
        const response = await fetch('/api/campaigns', { credentials: 'include' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCampaigns(data);
      } catch (error) {
        console.error('Fehler beim Laden der Kampagnen:', error.message);
      }
    };
    fetchCampaigns();
  }, [setCampaigns]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (campaignDropdownRef.current && !campaignDropdownRef.current.contains(event.target)) {
        setShowCampaignDropdown(false);
        setCampaignSearchTerm('');
      }
      if (licenseDropdownRef.current && !licenseDropdownRef.current.contains(event.target)) {
        setShowLicenseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortedCampaigns = useMemo(() => 
    campaigns.filter(c => !c.archived).sort((a, b) => b.id - a.id), 
    [campaigns]
  );

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const fetchLicenses = async (searchTerm) => {
    try {
      const response = await fetch(`/api/licenses?search=${encodeURIComponent(searchTerm)}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const licenses = Object.values(data).flat();
      setLicenseSuggestions(licenses);
      setShowLicenseDropdown(licenses.length > 0);
    } catch (error) {
      console.error('Fehler beim Laden der Lizenzen:', error.message);
      setLicenseSuggestions([]);
      setShowLicenseDropdown(false);
    }
  };

  const debouncedFetchLicenses = useCallback(debounce(fetchLicenses, 300), []);

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

  const handleParamChange = (field, value) => {
    setUtmParams(prev => ({ ...prev, [field]: value }));
    if (field === 'campaign' && value.includes('%')) {
      const parts = value.split('%');
      const searchTerm = parts.length > 1 ? parts[1] : '';
      debouncedFetchLicenses(searchTerm);
    } else {
      setShowLicenseDropdown(false);
      const errors = validateNomenclature(value, field, false, selectedChannel);
      setValidationErrors(prev => ({ ...prev, ...errors, [field]: errors[field] || null }));
    }
  };

  const handleLicenseSelect = (utmWriting, searchTerm) => {
    setUtmParams(prev => ({
      ...prev,
      campaign: prev.campaign.replace(`%${searchTerm}`, utmWriting)
    }));
    setShowLicenseDropdown(false);
    setValidationErrors({});
  };

  const handleCampaignSearchChange = (e) => {
    const value = e.target.value;
    setCampaignSearchTerm(value);
    if (value.length >= 2) {
      const filtered = sortedCampaigns.filter(c => c.name.toLowerCase().includes(value.toLowerCase()));
      setFilteredCampaigns(filtered);
    } else {
      setFilteredCampaigns(sortedCampaigns);
    }
  };

  const handleCampaignSelect = (name) => {
    handleParamChange('campaign', name);
    setShowCampaignDropdown(false);
    setCampaignSearchTerm('');
  };

  const validateNomenclature = (value, field, isLibraryScreen = false, selectedChannel = '') => {
    const errors = {};
    if (value) {
      if (/[^a-z0-9_{}%]/.test(value)) errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche, {} und % erlaubt';
      if (/\s/.test(value)) errors[field] = 'Keine Leerzeichen';
      if (field === 'campaign') {
        if (isLibraryScreen) {
          const pattern = /^20\d{2}_([0][1-9]|[1][0-2])_[a-z][a-z0-9_]*(_[a-z0-9][a-z0-9_]*)?$/;
          if (!pattern.test(value)) errors.campaign = 'Format: YYYY_MM_aktion[_variante]';
        } else {
          if (/[^a-z0-9_{}%]/.test(value)) errors.campaign = 'Nur Buchstaben, Zahlen, Unterstriche, {} und % erlaubt';
        }
      }
      if ((field === 'content' || field === 'term') && /[^a-z0-9_{}]/.test(value)) {
        errors[field] = 'Nur Buchstaben, Zahlen, Unterstriche und {} erlaubt';
      }
      if (field === 'content' && (selectedChannel === 'Facebook Ads' || selectedChannel === 'Tiktok Ads')) {
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

  const getSearchTerm = () => {
    const parts = utmParams.campaign.split('%');
    return parts.length > 1 ? parts[1] : '';
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] relative">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>UTM Parameter Builder</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Eingeloggt als: {user.name}</span>
            <button onClick={() => setMenuOpen(!menuOpen)} className="icon">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>
      <div className={`menu ${menuOpen ? 'menu-open' : ''}`}>
        <button onClick={() => setMenuOpen(false)} className="icon absolute top-4 right-4">
          <X size={24} />
        </button>
        <Link to="/library" onClick={() => setMenuOpen(false)} className="menu-item">Kampagnen</Link>
        <Link to="/licenses" onClick={() => setMenuOpen(false)} className="menu-item">Lizenzen</Link>
        {user.role === 'admin' && (
          <Link to="/admin" onClick={() => setMenuOpen(false)} className="menu-item">Admin</Link>
        )}
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
                  <div className="relative">
                    <label>UTM Campaign * <span className="text-xs text-gray-500 ml-2">Nur Kleinbuchstaben, Zahlen, Unterstriche, {} und %</span></label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={utmParams.campaign}
                        onChange={(e) => handleParamChange('campaign', e.target.value)}
                        onFocus={() => setShowLicenseDropdown(false)}
                        className={`flex-1 ${validationErrors.campaign ? 'error' : ''}`}
                        placeholder="2025_08_urlaubsrabatt_01 oder % für Lizenzsuche"
                      />
                      <div className="relative flex-1" ref={campaignDropdownRef}>
                        <input
                          type="text"
                          value={campaignSearchTerm}
                          onChange={handleCampaignSearchChange}
                          onFocus={() => {
                            setShowCampaignDropdown(true);
                            setFilteredCampaigns(sortedCampaigns);
                          }}
                          className="w-full"
                          placeholder="Aus Bibliothek wählen"
                        />
                        {showCampaignDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCampaigns.map((campaign) => (
                              <div
                                key={campaign.id}
                                className="px-4 py-2 hover:bg-[var(--secondary-color)] cursor-pointer text-sm"
                                onClick={() => handleCampaignSelect(campaign.name)}
                              >
                                {campaign.name}
                              </div>
                            ))}
                            {filteredCampaigns.length === 0 && (
                              <div className="px-4 py-2 text-sm text-gray-500">Keine Ergebnisse</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {validationErrors.campaign && <p className="error-message">{validationErrors.campaign}</p>}
                    {showLicenseDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-y-auto" ref={licenseDropdownRef}>
                        {licenseSuggestions.map((license, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-2 px-4 py-2 hover:bg-[var(--secondary-color)] cursor-pointer text-sm"
                            onClick={() => handleLicenseSelect(license.utm_writing, getSearchTerm())}
                          >
                            <span>{license.name}</span>
                            <span className="text-right">{license.utm_writing}</span>
                          </div>
                        ))}
                        {licenseSuggestions.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">Keine Ergebnisse</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label>UTM Content (optional)</label>
                    {selectedChannel === 'Facebook Ads' || selectedChannel === 'Tiktok Ads' ? (
                      <input
                        type="text"
                        value={utmParams.content}
                        onChange={(e) => handleParamChange('content', e.target.value)}
                        onFocus={() => {
                          setShowCampaignDropdown(false);
                          setShowLicenseDropdown(false);
                        }}
                        className={`w-full ${validationErrors.content ? 'error' : ''} appearance-none border border-gray-30 rounded-lg p-2`}
                        placeholder="banner_header"
                        list="contentSuggestions"
                      />
                    ) : (
                      <input
                        type="text"
                        value={utmParams.content}
                        onChange={(e) => handleParamChange('content', e.target.value)}
                        onFocus={() => {
                          setShowCampaignDropdown(false);
                          setShowLicenseDropdown(false);
                        }}
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
                        onFocus={() => {
                          setShowCampaignDropdown(false);
                          setShowLicenseDropdown(false);
                        }}
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

const CampaignLibrary = ({ campaigns, setCampaigns, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', category: '', archived: false, inhaber: user.name });
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
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newCampaign.name, category: newCampaign.category, inhaber: newCampaign.inhaber })
          });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const newCamp = await response.json();
          setCampaigns(prev => [...prev, newCamp]);
          setNewCampaign({ name: '', category: '', archived: false, inhaber: user.name });
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
        credentials: 'include',
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: campaign.name, category: campaign.category, archived: !campaign.archived, inhaber: campaign.inhaber })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updated = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error('Fehler beim Archivieren der Kampagne:', error.message);
    }
  };

  const updateCampaign = async (id, updatedCampaign) => {
    const errors = validateNomenclature(updatedCampaign.name, 'campaign', true);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: updatedCampaign.name, category: updatedCampaign.category, archived: updatedCampaign.archived, inhaber: updatedCampaign.inhaber })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const updated = await response.json();
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c));
      setEditingCampaign(null);
      setValidationErrors({});
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

  const filteredCampaigns = campaigns.filter((campaign) => {
    const name = (campaign?.name ?? '').toLowerCase();
    const category = (campaign?.category ?? '').toLowerCase();
    const inhaber = (campaign?.inhaber ?? '').toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      category.includes(searchTerm.toLowerCase()) ||
      inhaber.includes(searchTerm.toLowerCase());
    const matchesArchiveFilter = showArchived ? campaign.archived : !campaign.archived;
    return matchesSearch && matchesArchiveFilter;
  });

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <header className="bg-[var(--card-background)] border-b border-[var(--border-color)] p-4">
        <div className="container flex justify-between items-center">
          <h1>Kampagnen-Bibliothek</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Eingeloggt als: {user.name}</span>
            <Link to="/" className="icon"><X size={24} /></Link>
          </div>
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
                  {user.role === 'admin' && (
                    <select
                      value={newCampaign.inhaber}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, inhaber: e.target.value }))}
                      className="flex-1"
                    >
                      <option value={user.name}>{user.name} (eigene)</option>
                      <option value="alle">Alle</option>
                    </select>
                  )}
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
                        {user.role === 'admin' && (
                          <select
                            value={campaign.inhaber || user.name}
                            onChange={(e) => setCampaigns(prev => prev.map(c => 
                              c.id === campaign.id ? { ...c, inhaber: e.target.value } : c
                            ))}
                            className="w-full px-2 py-1 text-sm border border-[var(--border-color)] rounded-lg"
                          >
                            <option value={user.name}>{user.name} (eigene)</option>
                            <option value="alle">Alle</option>
                          </select>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-sm">{campaign.name}</div>
                        <div className="text-xs text-gray-500">{campaign.category} | Inhaber: {campaign.inhaber || user.name}</div>
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

const Licenses = ({ user }) => {
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
  const [copySuccess, setCopySuccess] = useState(null); // Neuer State für Copy-Meldung

  const fetchLicenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/licenses?search=${encodeURIComponent(searchTerm)}`, { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
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
  }, [searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLicenses();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchLicenses]);

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
        credentials: 'include',
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

      await fetchLicenses();
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
        credentials: 'include',
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

      await fetchLicenses();
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unbekannter Fehler');
      }

      await fetchLicenses();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Fehler beim Löschen:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLicense = async (utmWriting, id) => {
    try {
      await navigator.clipboard.writeText(utmWriting);
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Fehler beim Kopieren:', error.message);
    }
  };

  const openEditModal = (license) => {
    console.log('Opening edit modal for license:', license);
    const categoryFromContext = Object.keys(licenses).find(cat => 
      licenses[cat] && licenses[cat].some(l => l.id === license.id)
    );
    const licenseData = {
      id: license.id,
      category: license.category || categoryFromContext || '',
      tags: license.tags || '',
      name: license.name || '',
      utm_writing: license.utm_writing || ''
    };
    console.log('Setting edit license data:', licenseData);
    setEditLicense(licenseData);
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
          <div className="flex items-center gap-4">
            <span className="text-sm">Eingeloggt als: {user.name}</span>
            <Link to="/" className="icon"><X size={24} /></Link>
          </div>
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
          {showEditModal && editLicense && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Lizenz bearbeiten</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Kategorie *</label>
                    <input
                      type="text"
                      placeholder="Kategorie *"
                      value={editLicense.category || ''}
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
                    <label className="block text-sm font-medium mb-1">Tags (optional)</label>
                    <input
                      type="text"
                      placeholder="Tags (optional)"
                      value={editLicense.tags || ''}
                      onChange={(e) => setEditLicense({ ...editLicense, tags: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      placeholder="Name *"
                      value={editLicense.name || ''}
                      onChange={(e) => setEditLicense({ ...editLicense, name: e.target.value })}
                      className={`w-full p-2 border rounded-lg ${validationErrors.name ? 'border-red-500' : ''}`}
                      disabled={isLoading}
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">UTM-Schreibweise *</label>
                    <input
                      type="text"
                      placeholder="UTM-Schreibweise *"
                      value={editLicense.utm_writing || ''}
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
          {copySuccess && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-lg w-full max-w-md text-center">
                <div className="text-green-500 mb-2">
                  <Check size={32} className="mx-auto" />
                </div>
                <p>✓ Kopiert</p>
              </div>
            </div>
          )}
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
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
              <div className="bg-[var(--card-background)] p-4 rounded-lg">
                <p>Lädt...</p>
              </div>
            </div>
          )}
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
                                onClick={() => handleCopyLicense(license.utm_writing, license.id)}
                                className={`icon p-1 ${copySuccess === license.id ? 'text-green-500' : 'text-blue-300'}`}
                                title="Kopieren"
                                disabled={isLoading}
                              >
                                <Copy size={16} />
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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch('/api/users/validate-token', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser({ name: data.name, role: data.role });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Fehler beim Validieren des Tokens:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    validateToken();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadCampaigns = async () => {
      try {
        setIsLoadingCampaigns(true);
        const res = await fetch('/api/campaigns', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const rows = Array.isArray(data) ? data : data?.rows || [];
        setCampaigns(rows);
      } catch (e) {
        console.error('Kampagnen laden fehlgeschlagen:', e.message);
      } finally {
        setIsLoadingCampaigns(false);
      }
    };
    loadCampaigns();
  }, [user]);

  const handleLogin = (userData) => setUser(userData);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Lädt...</div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<UTMBuilder campaigns={campaigns} setCampaigns={setCampaigns} user={user} />}
        />
        <Route
          path="/library"
          element={
            <CampaignLibrary
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              user={user}
              isLoadingCampaigns={isLoadingCampaigns}
            />
          }
        />
        <Route path="/licenses" element={<Licenses user={user} />} />
        {user.role === 'admin' && (
          <Route path="/admin" element={<Admin user={user} />} />
        )}
      </Routes>
    </Router>
  );
};

export default App;