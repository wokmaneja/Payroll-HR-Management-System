import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Activity, LogOut, CheckCircle, Clock } from 'lucide-react';
import './index.css';

const GITHUB_OWNER = 'wokmaneja';
const GITHUB_REPO = 'Payroll-HR-Management-System';

function App() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('gh_token'));
  const [activeTab, setActiveTab] = useState('licenses');
  const [licenses, setLicenses] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

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
    if (isLogged) {
      fetchData();
    }
  }, [isLogged, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setLoginError('');
    try {
      const label = activeTab === 'licenses' ? 'license-activation' : 'error-log';
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
      if (activeTab === 'licenses') {
        setLicenses(data);
      } else {
        setErrors(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!isLogged) {
    return (
      <div className="login-overlay">
        <div className="glass-card login-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <ShieldAlert size={32} color="#3b82f6" />
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
            <Activity color="#3b82f6" /> WokManeja Control
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Centralized license and telemetry management.</p>
        </div>
        <button onClick={handleLogout} className="btn" style={{ background: 'rgba(255,255,255,0.05)', width: 'auto' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <div className="nav-tabs">
        <button className={`tab ${activeTab === 'licenses' ? 'active' : ''}`} onClick={() => setActiveTab('licenses')}>
          License Activations
        </button>
        <button className={`tab ${activeTab === 'errors' ? 'active' : ''}`} onClick={() => setActiveTab('errors')}>
          Error Logs
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
                </tr>
              </thead>
              <tbody>
                {licenses.map(issue => {
                  const isActive = issue.state === 'open';
                  const keyMatch = issue.body?.match(/\*\*License Key:\*\* (.*)/);
                  const companyMatch = issue.body?.match(/\*\*Company:\*\* (.*)/);
                  const planMatch = issue.body?.match(/\*\*Plan:\*\* (.*)/);
                  
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
