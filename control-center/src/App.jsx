import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, LogOut, CheckCircle, Clock, Download, PlusSquare, Copy, UploadCloud } from 'lucide-react';
import './index.css';

const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO = 'Payroll-HR-Management-System';

const MODULE_OPTIONS = [
  { code: 'HR', label: 'HR' },
  { code: 'PC', label: 'Petty Cash' },
  { code: 'FIN', label: 'Finance' },
  { code: 'PAY', label: 'Payroll' },
  { code: 'RPT', label: 'Reports' },
  { code: 'ADM', label: 'Admin' },
];

function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('gh_token'));
  const [activeTab, setActiveTab] = useState('licenses');
  const [licenses, setLicenses] = useState([]);
  const [installs, setInstalls] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Key Generator State
  const [genPlan, setGenPlan] = useState('PRO');
  const [genDur, setGenDur] = useState('1Y');
  const [genModules, setGenModules] = useState(['ALL']); // 'ALL' or an array of module codes
  const [genStaffCap, setGenStaffCap] = useState('UNL'); // 'UNL' or a numeric string
  const [generatedKey, setGeneratedKey] = useState('');

  // Push Update State
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [updateStatus, setUpdateStatus] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    localStorage.setItem('gh_token', token.trim());
    setIsLogged(true);
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('gh_token');
    setToken('');
    setIsLogged(false);
  };

  useEffect(() => {
    if (isLogged && activeTab !== 'generator') {
      fetchData();
    }
  }, [isLogged, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setLoginError('');
    try {
      let label = 'license-activation';
      if (activeTab === 'errors') label = 'error-log';
      if (activeTab === 'installs') label = 'app-install';

      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues?state=all&labels=${label}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (res.status === 401) {
        setLoginError('Invalid GitHub Token');
        handleLogout();
        return;
      }
      
      const data = await res.json();
      if (activeTab === 'licenses') setLicenses(data);
      else if (activeTab === 'errors') setErrors(data);
      else if (activeTab === 'installs') setInstalls(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const toggleModule = (code) => {
    setGenModules(prev => {
      if (code === 'ALL') {
        return prev.includes('ALL') ? [] : ['ALL'];
      }
      const withoutAll = prev.filter(c => c !== 'ALL');
      if (withoutAll.includes(code)) {
        const next = withoutAll.filter(c => c !== code);
        return next.length ? next : ['ALL'];
      }
      return [...withoutAll, code];
    });
  };

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const moduleSegment = genModules.includes('ALL') || genModules.length === 0 ? 'ALL' : genModules.join('-');
    const staffSegment = genStaffCap === 'UNL' ? 'SUNL' : `S${genStaffCap || '1'}`;
    const key = `WM-${genPlan}-${genDur}-${moduleSegment}-${staffSegment}-${randomHex}`;
    setGeneratedKey(key);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    alert('Key copied to clipboard!');
  };

  const handleSyncToken = async () => {
    if (!token) return;
    setSyncStatus({ loading: true, message: 'Syncing token to apps...' });
    try {
      const btoaSafe = (str) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (m, p1) => String.fromCharCode('0x' + p1)));
      const obfuscated = btoaSafe(token.split('').map(char => String.fromCharCode(char.charCodeAt(0) ^ 42)).join(''));

      const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/server.js`, { headers: { 'Authorization': `token ${token}` } });
      if (!fileRes.ok) throw new Error('Failed to fetch server.js');
      const fileData = await fileRes.json();

      const content = decodeURIComponent(escape(atob(fileData.content)));
      const updatedContent = content.replace(/const OBFUSCATED_TOKEN_PLACEHOLDER = '.*';/, `const OBFUSCATED_TOKEN_PLACEHOLDER = '${obfuscated}';`);

      const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/server.js`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Sync updated token to apps from Control Center',
          content: btoaSafe(updatedContent),
          sha: fileData.sha
        })
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.message);
      }
      setSyncStatus({ loading: false, success: true, message: 'Token successfully synced to apps!' });
    } catch (e) {
      setSyncStatus({ loading: false, success: false, message: `Sync failed: ${e.message}` });
    }
  };

  const handlePushUpdate = async (e) => {
    e.preventDefault();
    if (!updateVersion || !updateTitle) return;
    setUpdateStatus({ loading: true, message: 'Creating release...' });
    
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tag_name: updateVersion,
          name: updateTitle,
          body: updateBody,
          draft: false,
          prerelease: false
        })
      });
      
      if (res.ok) {
        setUpdateStatus({ loading: false, success: true, message: `Successfully pushed update ${updateVersion} to all clients!` });
        setUpdateVersion('');
        setUpdateTitle('');
        setUpdateBody('');
      } else {
        const data = await res.json();
        setUpdateStatus({ loading: false, success: false, message: `Failed: ${data.message}` });
      }
    } catch (err) {
      setUpdateStatus({ loading: false, success: false, message: 'Network error occurred.' });
    }
  };

  const handleDeactivate = async (issueNumber) => {
    if (!window.confirm('Are you sure you want to permanently deactivate this license?')) return;
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: 'closed' })
      });
      if (res.ok) {
        setLicenses(licenses.map(lic => lic.number === issueNumber ? { ...lic, state: 'closed' } : lic));
      } else {
        alert('Failed to deactivate license.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleLock = async (issue) => {
    const newMachineId = window.prompt('Enter the specific Machine ID you want to lock this license to:');
    if (!newMachineId || newMachineId.trim() === '') return;
    
    const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
    const keyMatch = issue.body?.match(/\*\*License Key:\*\* (.*)/);
    const planMatch = issue.body?.match(/\*\*Plan:\*\* (.*)/);
    const expiresMatch = issue.body?.match(/\*\*Expires:\*\* (.*)/);

    const oldCompany = companyMatch ? companyMatch[1].trim() : 'Unknown';
    const oldKey = keyMatch ? keyMatch[1].trim() : 'Unknown';
    const oldPlan = planMatch ? planMatch[1].trim() : 'Unknown';
    const oldExpiry = expiresMatch ? expiresMatch[1].trim() : new Date().toISOString();

    const newBody = `**License Key:** ${oldKey}\n**Company:** ${oldCompany}\n**Machine ID:** ${newMachineId.trim()}\n**Plan:** ${oldPlan}\n**Expires:** ${oldExpiry}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: newBody })
      });
      if (res.ok) {
        alert(`Successfully locked license to Machine ID: ${newMachineId.trim()}`);
        fetchIssues('license-activation');
      } else {
        alert('Failed to lock license.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleUnlock = async (issue) => {
    if (!window.confirm('Are you sure you want to unlock the machine ID for this license?')) return;
    
    const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
    const keyMatch = issue.body?.match(/\*\*License Key:\*\* (.*)/);
    const planMatch = issue.body?.match(/\*\*Plan:\*\* (.*)/);
    const expiresMatch = issue.body?.match(/\*\*Expires:\*\* (.*)/);

    const oldCompany = companyMatch ? companyMatch[1].trim() : 'Unknown';
    const oldKey = keyMatch ? keyMatch[1].trim() : 'Unknown';
    const oldPlan = planMatch ? planMatch[1].trim() : 'Unknown';
    const oldExpiry = expiresMatch ? expiresMatch[1].trim() : new Date().toISOString();

    const newBody = `**License Key:** ${oldKey}\n**Company:** ${oldCompany}\n**Machine ID:** UNLOCKED\n**Plan:** ${oldPlan}\n**Expires:** ${oldExpiry}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ body: newBody })
      });
      if (res.ok) {
        alert('Successfully unlocked machine ID!');
        setLicenses(licenses.map(lic => lic.number === issue.number ? { ...lic, body: newBody } : lic));
      } else {
        alert('Failed to unlock machine ID.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleRenew = async (issue) => {
    const choice = window.prompt("Renew this license? Enter '1' for 1-Month, or '2' for 1-Year:", "2");
    if (choice !== '1' && choice !== '2') return;
    
    // Parse old issue body
    const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
    const machineMatch = issue.body?.match(/\*\*Machine ID:\*\* (.*)/);
    const planMatch = issue.body?.match(/\*\*Plan:\*\* (.*)/);
    const expiresMatch = issue.body?.match(/\*\*Expires:\*\* (.*)/);

    const oldCompany = companyMatch ? companyMatch[1].trim() : 'Unknown';
    const oldMachine = machineMatch ? machineMatch[1].trim() : 'Unknown';
    const oldPlanStr = planMatch ? planMatch[1].trim() : 'Unknown';
    
    // Determine new plan and duration
    let durStr = choice === '1' ? '1M' : '1Y';
    let basePlan = oldPlanStr.split(' ')[0] || 'ENTERPRISE';
    if (basePlan === 'Unknown') basePlan = 'ENTERPRISE';
    
    let newPlan = `${basePlan} ${choice === '1' ? '(1-Month)' : '(1-Year)'}`;
    
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const newKey = `WM-${basePlan.substring(0,3).toUpperCase()}-${durStr}-${randomHex}`;

    // Calculate new expiry
    let oldExpiry = expiresMatch ? new Date(expiresMatch[1]) : new Date();
    let baseDate = oldExpiry > new Date() ? oldExpiry : new Date();
    let newExpiry = new Date(baseDate);
    if (choice === '1') {
        newExpiry.setMonth(newExpiry.getMonth() + 1);
    } else {
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
    }

    const newBody = `**License Key:** ${newKey}\n**Company:** ${oldCompany}\n**Machine ID:** ${oldMachine}\n**Plan:** ${newPlan}\n**Expires:** ${newExpiry.toISOString()}`;

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ state: 'open', body: newBody })
      });
      if (res.ok) {
        alert(`Successfully renewed! New key: ${newKey}`);
        setLicenses(licenses.map(lic => lic.number === issue.number ? { ...lic, state: 'open', body: newBody } : lic));
      } else {
        alert('Failed to renew license.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleDelete = async (issueNumber) => {
    if (!window.confirm('Are you sure you want to permanently delete this item from the list?')) return;
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber}/labels`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ labels: ['deleted'] })
      });
      if (res.ok) {
        setLicenses(licenses.filter(lic => lic.number !== issueNumber));
        setErrors(errors.filter(err => err.number !== issueNumber));
        setInstalls(installs.filter(inst => inst.number !== issueNumber));
      } else {
        alert('Failed to delete item.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  if (!isLogged) {
    return (
      <div className="login-overlay">
        <div className="glass-card login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent-light)', padding: '0.85rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="WokManeja" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
            </div>
          </div>
          <h2>WokManeja Control</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Enter your GitHub Personal Access Token to access the central dashboard.
          </p>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>GitHub PAT</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            {loginError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{loginError}</p>}
            <button type="submit" className="btn btn-primary">
              <KeyRound size={18} /> Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header style={{ height: '60px', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="WokManeja" style={{ height: '26px', width: '26px', objectFit: 'contain' }} />
          <span>Wok<span style={{ color: 'var(--accent)' }}>Maneja</span></span>
          <span style={{ fontWeight: 400, opacity: 0.7, fontSize: '13px', marginLeft: '4px' }}>Control Center</span>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', fontSize: '12px', width: 'auto' }}>
          <LogOut size={14} /> Logout
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '250px', background: 'var(--bg)', borderRight: '1px solid var(--border-color)', padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', padding: '0 12px', marginBottom: '8px', letterSpacing: '0.05em' }}>MAIN MENU</div>
          <button className={`sidebar-item ${activeTab === 'licenses' ? 'active' : ''}`} onClick={() => setActiveTab('licenses')}>
            <KeyRound size={18} /> Active Licenses
          </button>
          <button className={`sidebar-item ${activeTab === 'installs' ? 'active' : ''}`} onClick={() => setActiveTab('installs')}>
            <Download size={18} /> App Installs
          </button>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', padding: '0 12px', marginTop: '16px', marginBottom: '8px', letterSpacing: '0.05em' }}>TOOLS</div>
          <button className={`sidebar-item ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')}>
            <PlusSquare size={18} /> Key Generator
          </button>
          <button className={`sidebar-item ${activeTab === 'updates' ? 'active' : ''}`} onClick={() => setActiveTab('updates')}>
            <UploadCloud size={18} /> Push Update
          </button>
          <button className={`sidebar-item ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
            <ShieldAlert size={18} /> Error Logs
          </button>
        </div>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: 'var(--bg-main)' }}>
          <div className="glass-card" style={{ minHeight: 'calc(100vh - 120px)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <div className="loader"></div>
          </div>
        ) : activeTab === 'licenses' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>License Key</th>
                  <th>Company</th>
                  <th>Machine ID</th>
                  <th>Plan</th>
                  <th>Activated On</th>
                  <th>Expires On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(issue => {
                  const isActive = issue.state === 'open';
                  const keyMatch = issue.body?.match(/\*\*License Key:\*\* (.*)/);
                  const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
                  const machineMatch = issue.body?.match(/\*\*Machine ID:\*\* (.*)/);
                  const planMatch = issue.body?.match(/\*\*Plan:\*\* (.*)/);
                  const expiresMatch = issue.body?.match(/\*\*Expires:\*\* (.*)/);
                  
                  return (
                    <tr key={issue.id}>
                      <td>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}>
                          {isActive ? <CheckCircle size={12} /> : <Clock size={12} />}
                          {isActive ? 'Active' : 'Invalidated'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{keyMatch ? keyMatch[1] : 'Unknown'}</td>
                      <td>{companyMatch ? companyMatch[1] : 'Unknown'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{machineMatch ? machineMatch[1] : 'Unknown'}</td>
                      <td><span className="badge badge-info">{planMatch ? planMatch[1] : 'Unknown'}</span></td>
                      <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td><span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>{expiresMatch ? new Date(expiresMatch[1]).toLocaleDateString() : 'Unknown'}</span></td>
                      <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button onClick={() => handleRenew(issue)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--success)', borderColor: 'var(--success)' }}>
                          Renew
                        </button>
                        {isActive && (
                          <>
                            {machineMatch && machineMatch[1].trim() === 'UNLOCKED' ? (
                              <button onClick={() => handleLock(issue)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}>
                                Lock
                              </button>
                            ) : (
                              <button onClick={() => handleUnlock(issue)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}>
                                Unlock
                              </button>
                            )}
                            <button onClick={() => handleDeactivate(issue.number)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                              Deactivate
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(issue.number)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#555', borderColor: '#555' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No licenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'installs' ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>App Version</th>
                  <th>Machine ID</th>
                  <th>Installed On</th>
                </tr>
              </thead>
              <tbody>
                {installs.map(issue => {
                  const versionMatch = issue.body?.match(/\*\*Version:\*\* (.*)/);
                  const machineMatch = issue.body?.match(/\*\*Machine ID:\*\* (.*)/);
                  const lastOnlineMatch = issue.body?.match(/\*\*Last Online:\*\* (.*)/);
                  
                  let isOnline = false;
                  if (lastOnlineMatch) {
                      const lastOnline = new Date(lastOnlineMatch[1].trim());
                      const diffMinutes = (new Date() - lastOnline) / 1000 / 60;
                      if (diffMinutes <= 10) isOnline = true;
                  }
                  
                  return (
                    <tr key={issue.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <span className="badge badge-success">
                            <Download size={12} /> Installed
                          </span>
                          <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: isOnline ? 'var(--success)' : 'var(--text-secondary)', color: '#fff', fontWeight: 'bold' }}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      </td>
                      <td><span className="badge badge-info">{versionMatch ? versionMatch[1] : 'v1.0.0'}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{machineMatch ? machineMatch[1] : 'Unknown'}</td>
                      <td>
                        {new Date(issue.created_at).toLocaleString()}
                        {lastOnlineMatch && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Last ping: {new Date(lastOnlineMatch[1].trim()).toLocaleTimeString()}</div>}
                      </td>
                    </tr>
                  );
                })}
                {installs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No installations tracked yet. (Only fires on first startup)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'generator' ? (
          <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 0' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>License Key Generator</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Generate an extension key. When a user enters this key into their app, it will extend their expiration date by the selected duration.
            </p>
            
            <div className="input-group">
              <label>Plan Level</label>
              <select className="input-field" value={genPlan} onChange={(e) => setGenPlan(e.target.value)}>
                <option value="PRO">Pro Plan</option>
                <option value="ENT">Enterprise Plan</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Extension Duration</label>
              <select className="input-field" value={genDur} onChange={(e) => setGenDur(e.target.value)}>
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
                <option value="2Y">2 Years</option>
                <option value="5Y">5 Years</option>
                <option value="LIFETIME">Lifetime</option>
              </select>
            </div>

            <div className="input-group">
              <label>Licensed Modules</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.4rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: genModules.includes('ALL') ? 700 : 400 }}>
                  <input type="checkbox" checked={genModules.includes('ALL')} onChange={() => toggleModule('ALL')} /> All Modules
                </label>
                {MODULE_OPTIONS.map(m => (
                  <label key={m.code} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', opacity: genModules.includes('ALL') ? 0.5 : 1 }}>
                    <input type="checkbox" checked={genModules.includes(m.code)} disabled={genModules.includes('ALL')} onChange={() => toggleModule(m.code)} /> {m.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Staff Cap</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={genStaffCap === 'UNL'} onChange={(e) => setGenStaffCap(e.target.checked ? 'UNL' : '50')} /> Unlimited
                </label>
                {genStaffCap !== 'UNL' && (
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    style={{ maxWidth: '120px' }}
                    value={genStaffCap}
                    onChange={(e) => setGenStaffCap(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 50"
                  />
                )}
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5, margin: '0.5rem 0 1.5rem' }}>
              Enter your Monthly (WM-MTH...), Yearly (WM-YR...), or Lifetime (WM-...-LIFETIME) license key.<br />
              Keys may include module codes (-HR-, -PC-, -FIN-, -PAY-, -RPT-, -ADM-, or -ALL-) and a staff cap (-S50- or -SUNL- for unlimited).
            </p>

            <button onClick={handleGenerateKey} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Generate Key
            </button>
            
            {generatedKey && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', border: '1px dashed var(--accent)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Generated Key</p>
                <h3 style={{ fontFamily: 'monospace', letterSpacing: '2px', fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '1rem' }}>{generatedKey}</h3>
                <button onClick={copyToClipboard} className="btn" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <Copy size={16} /> Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'updates' ? (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 0' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Push App Update</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
              Create a new official Release. This will package the latest code from your <code>main</code> branch and instantly notify all desktop apps to download it!
            </p>
            
            <form onSubmit={handlePushUpdate}>
              <div className="input-group">
                <label>Version Tag (e.g. v1.0.1)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={updateVersion}
                  onChange={(e) => setUpdateVersion(e.target.value)}
                  placeholder="vX.X.X"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Update Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="e.g. Bug fixes and performance improvements"
                  required
                />
              </div>

              <div className="input-group">
                <label>Release Notes</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  value={updateBody}
                  onChange={(e) => setUpdateBody(e.target.value)}
                  placeholder="- Fixed login issue&#10;- Improved report generation speed"
                ></textarea>
              </div>
              
              {updateStatus && (
                <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: updateStatus.success ? 'rgba(16, 185, 129, 0.1)' : updateStatus.loading ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${updateStatus.success ? 'var(--success)' : updateStatus.loading ? 'var(--border-color)' : 'var(--danger)'}`, color: updateStatus.success ? 'var(--success)' : updateStatus.loading ? 'var(--text-primary)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
                  {updateStatus.loading ? <span className="loader" style={{ display: 'inline-block', width: '16px', height: '16px', borderTopColor: 'currentColor', marginRight: '8px', verticalAlign: 'middle' }}></span> : null}
                  {updateStatus.message}
                </div>
              )}
              
              <button type="submit" className="btn btn-primary" disabled={updateStatus?.loading}>
                <UploadCloud size={18} /> Push Release to All Apps
              </button>
            </form>

            <hr style={{ margin: '3rem 0', borderColor: 'var(--border-color)', opacity: 0.5 }} />

            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Sync GitHub PAT to Apps</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              If you logged in with a new GitHub token, you must push it to the apps so they can continue communicating with the server.
            </p>
            
            {syncStatus && (
              <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: syncStatus.success ? 'rgba(16, 185, 129, 0.1)' : syncStatus.loading ? 'rgba(255,255,255,0.05)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${syncStatus.success ? 'var(--success)' : syncStatus.loading ? 'var(--border-color)' : 'var(--danger)'}`, color: syncStatus.success ? 'var(--success)' : syncStatus.loading ? 'var(--text-primary)' : 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>
                {syncStatus.loading ? <span className="loader" style={{ display: 'inline-block', width: '16px', height: '16px', borderTopColor: 'currentColor', marginRight: '8px', verticalAlign: 'middle' }}></span> : null}
                {syncStatus.message}
              </div>
            )}
            
            <button onClick={handleSyncToken} className="btn btn-primary" disabled={syncStatus?.loading} style={{ background: 'var(--accent)' }}>
              <KeyRound size={18} /> Sync Token to Apps
            </button>
          </div>
        ) : (
          <div className="grid">
            {errors.map(issue => (
              <div key={issue.id} className="glass-card error-card">
                <h3>{issue.title}</h3>
                <div className="meta">Reported on: {new Date(issue.created_at).toLocaleString()}</div>
                <pre>{issue.body}</pre>
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <a href={issue.html_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                    View on GitHub &rarr;
                  </a>
                </div>
              </div>
            ))}
            {errors.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No error logs found. System is healthy!
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
