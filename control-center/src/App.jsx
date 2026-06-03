import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Activity, LogOut, CheckCircle, Clock, Download, PlusSquare, Copy } from 'lucide-react';
import './index.css';

const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO = 'Payroll-HR-Management-System';

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
  const [generatedKey, setGeneratedKey] = useState('');

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

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const key = `WM-${genPlan}-${genDur}-${randomHex}`;
    setGeneratedKey(key);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    alert('Key copied to clipboard!');
  };

  if (!isLogged) {
    return (
      <div className="login-overlay">
        <div className="glass-card login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent-light)', padding: '1rem', borderRadius: '50%' }}>
              <ShieldAlert size={32} color="var(--accent)" />
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
    <div className="container">
      <header className="header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="var(--accent)" /> WokManeja Control
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Centralized license and telemetry management.</p>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.05)', width: 'auto' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="nav-tabs">
        <button className={`tab ${activeTab === 'licenses' ? 'active' : ''}`} onClick={() => setActiveTab('licenses')}>
          Active Licenses
        </button>
        <button className={`tab ${activeTab === 'installs' ? 'active' : ''}`} onClick={() => setActiveTab('installs')}>
          App Installs
        </button>
        <button className={`tab ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
          Error Logs
        </button>
        <button className={`tab ${activeTab === 'generator' ? 'active' : ''}`} onClick={() => setActiveTab('generator')} style={{ marginLeft: 'auto', border: '1px solid var(--accent)' }}>
          <PlusSquare size={14} style={{ marginRight: '6px' }} /> Key Generator
        </button>
      </div>

      <div className="glass-card" style={{ minHeight: '400px' }}>
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
                  <th>Plan</th>
                  <th>Activated On</th>
                  <th>Expires On</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(issue => {
                  const isActive = issue.state === 'open';
                  const keyMatch = issue.body?.match(/\*\*License Key:\*\* (.*)/);
                  const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
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
                      <td><span className="badge badge-info">{planMatch ? planMatch[1] : 'Unknown'}</span></td>
                      <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                      <td><span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>{expiresMatch ? new Date(expiresMatch[1]).toLocaleDateString() : 'Unknown'}</span></td>
                    </tr>
                  );
                })}
                {licenses.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
                  
                  return (
                    <tr key={issue.id}>
                      <td>
                        <span className="badge badge-success">
                          <Download size={12} /> Installed
                        </span>
                      </td>
                      <td><span className="badge badge-info">{versionMatch ? versionMatch[1] : 'v1.0.0'}</span></td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{machineMatch ? machineMatch[1] : 'Unknown'}</td>
                      <td>{new Date(issue.created_at).toLocaleString()}</td>
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
              </select>
            </div>
            
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
  );
}

export default App;
