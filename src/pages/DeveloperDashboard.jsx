import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    LayoutDashboard, UserPlus, LogOut, CheckCircle, AlertCircle,
    KeyRound, Users, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import './DeveloperDashboard.css';

const DeveloperDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('create');
    const [user, setUser] = useState({ name: 'Developer', email: '' });

    // ── Create Salesman state ──────────────────────────────────────────────
    const [csName, setCsName] = useState('');
    const [csEmail, setCsEmail] = useState('');
    const [csPassword, setCsPassword] = useState('');
    const [csShowPwd, setCsShowPwd] = useState(false);
    const [csLoading, setCsLoading] = useState(false);
    const [csMessage, setCsMessage] = useState({ type: '', text: '' });

    // ── My Credentials state ───────────────────────────────────────────────
    const [myName, setMyName] = useState('');
    const [myEmail, setMyEmail] = useState('');
    const [myPassword, setMyPassword] = useState('');
    const [myShowPwd, setMyShowPwd] = useState(false);
    const [myLoading, setMyLoading] = useState(false);
    const [myMessage, setMyMessage] = useState({ type: '', text: '' });

    // ── Salesman Credentials state ─────────────────────────────────────────
    const [salesmen, setSalesmen] = useState([]);
    const [selectedSalesmanId, setSelectedSalesmanId] = useState('');
    const [smName, setSmName] = useState('');
    const [smEmail, setSmEmail] = useState('');
    const [smPassword, setSmPassword] = useState('');
    const [smShowPwd, setSmShowPwd] = useState(false);
    const [smLoading, setSmLoading] = useState(false);
    const [smMessage, setSmMessage] = useState({ type: '', text: '' });
    const [smListLoading, setSmListLoading] = useState(false);

    // ── Auth guard + load developer info ──────────────────────────────────
    useEffect(() => {
        const storedUser = localStorage.getItem('inventory_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                setMyName(parsedUser.name || '');
                setMyEmail(parsedUser.email || '');
                if (parsedUser.role !== 'developer') {
                    navigate('/products', { replace: true });
                }
            } catch (e) {
                console.error('Error parsing user data', e);
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // ── Load salesmen when that tab is opened ──────────────────────────────
    useEffect(() => {
        if (activeTab === 'salesman') {
            fetchSalesmen();
        }
    }, [activeTab]);

    const fetchSalesmen = async () => {
        setSmListLoading(true);
        try {
            const token = localStorage.getItem('inventory_token');
            const res = await axios.get('/api/auth/salesmen', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSalesmen(res.data.salesmen || []);
        } catch (err) {
            console.error('Failed to load salesmen', err);
        } finally {
            setSmListLoading(false);
        }
    };

    // Pre-fill salesman fields when a salesman is selected
    const handleSelectSalesman = (id) => {
        setSelectedSalesmanId(id);
        setSmMessage({ type: '', text: '' });
        const found = salesmen.find(s => s.id === id);
        if (found) {
            setSmName(found.name);
            setSmEmail(found.email);
            setSmPassword('');
        } else {
            setSmName('');
            setSmEmail('');
            setSmPassword('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('inventory_token');
        localStorage.removeItem('inventory_user');
        navigate('/login', { replace: true });
    };

    // ── Create Salesman ────────────────────────────────────────────────────
    const handleCreateSalesman = async (e) => {
        e.preventDefault();
        setCsLoading(true);
        setCsMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('inventory_token');
            const response = await axios.post('/api/auth/create-salesman', {
                name: csName, email: csEmail, password: csPassword
            }, { headers: { Authorization: `Bearer ${token}` } });

            setCsMessage({ type: 'success', text: `Salesman "${response.data.salesman.name}" successfully bana diya gaya!` });
            setCsName(''); setCsEmail(''); setCsPassword('');
        } catch (error) {
            setCsMessage({ type: 'error', text: error.response?.data?.error || 'Salesman account banane mein error aayi.' });
        } finally {
            setCsLoading(false);
        }
    };

    // ── Update My Credentials ──────────────────────────────────────────────
    const handleUpdateMyCredentials = async (e) => {
        e.preventDefault();
        setMyLoading(true);
        setMyMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('inventory_token');
            const payload = {};
            if (myName.trim())     payload.name     = myName.trim();
            if (myEmail.trim())    payload.email    = myEmail.trim();
            if (myPassword.trim()) payload.password = myPassword.trim();

            const res = await axios.put('/api/auth/update-credentials', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update localStorage with new info
            const updated = { ...user, name: res.data.user.name, email: res.data.user.email };
            localStorage.setItem('inventory_user', JSON.stringify(updated));
            setUser(updated);
            setMyPassword('');
            setMyMessage({ type: 'success', text: 'Apki credentials kamiyabi se update ho gayi!' });
        } catch (error) {
            setMyMessage({ type: 'error', text: error.response?.data?.error || 'Credentials update karne mein error aayi.' });
        } finally {
            setMyLoading(false);
        }
    };

    // ── Update Salesman Credentials ────────────────────────────────────────
    const handleUpdateSalesmanCredentials = async (e) => {
        e.preventDefault();
        if (!selectedSalesmanId) {
            setSmMessage({ type: 'error', text: 'Pehle koi salesman select karein.' });
            return;
        }
        setSmLoading(true);
        setSmMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('inventory_token');
            const payload = { targetId: selectedSalesmanId };
            if (smName.trim())     payload.name     = smName.trim();
            if (smEmail.trim())    payload.email    = smEmail.trim();
            if (smPassword.trim()) payload.password = smPassword.trim();

            await axios.put('/api/auth/update-credentials', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh list
            await fetchSalesmen();
            setSmPassword('');
            setSmMessage({ type: 'success', text: 'Salesman ki credentials kamiyabi se update ho gayi!' });
        } catch (error) {
            setSmMessage({ type: 'error', text: error.response?.data?.error || 'Salesman credentials update karne mein error aayi.' });
        } finally {
            setSmLoading(false);
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────
    const StatusMsg = ({ msg }) => {
        if (!msg.text) return null;
        return (
            <div className={`status-message ${msg.type}`}>
                {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{msg.text}</span>
            </div>
        );
    };

    const PwdInput = ({ value, onChange, show, onToggle, placeholder = '••••••••' }) => (
        <div className="pwd-wrapper">
            <input
                type={show ? 'text' : 'password'}
                className="input-field"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button type="button" className="pwd-toggle" onClick={onToggle} tabIndex={-1}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    );

    return (
        <div className="dev-dashboard-container">
            <div className="glow-orb top-left"></div>
            <div className="glow-orb bottom-right"></div>

            {/* Navbar */}
            <nav className="dev-navbar glass-panel">
                <div className="dev-logo-container">
                    <LayoutDashboard size={28} color="var(--accent-primary)" />
                    <h2 className="logo-text text-gradient">Inventory<br /><span className="text-gradient-accent">Pro</span></h2>
                    <span className="dev-badge">Developer Panel</span>
                </div>
                <div className="dev-user-section">
                    <div className="dev-user-info">
                        <span className="dev-name">{user.name}</span>
                        <span className="dev-email">{user.email}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-logout">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </nav>

            <main className="dev-main-content">
                <div className="dev-header">
                    <h1 className="page-title">Manage System Access</h1>
                    <p className="page-subtitle">Salesman accounts banayein aur credentials update karein</p>
                </div>

                {/* Tab Bar */}
                <div className="dev-tabs">
                    <button
                        className={`dev-tab ${activeTab === 'create' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create')}
                    >
                        <UserPlus size={17} /> Salesman Banayein
                    </button>
                    <button
                        className={`dev-tab ${activeTab === 'my-creds' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-creds')}
                    >
                        <ShieldCheck size={17} /> Meri Credentials
                    </button>
                    <button
                        className={`dev-tab ${activeTab === 'salesman' ? 'active' : ''}`}
                        onClick={() => setActiveTab('salesman')}
                    >
                        <Users size={17} /> Salesman Credentials
                    </button>
                </div>

                <div className="dev-tab-content">

                    {/* ── TAB 1: Create Salesman ─────────────────────────────── */}
                    {activeTab === 'create' && (
                        <div className="dev-content-grid">
                            <div className="dev-card glass-panel animate-fade-in">
                                <div className="card-header">
                                    <div className="icon-wrapper" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                                        <UserPlus size={24} />
                                    </div>
                                    <h2>Naya Salesman Register Karein</h2>
                                </div>
                                <p className="card-desc">Neeche details bhar ker naya salesman account banayein. Woh فوری login kar sakay ga.</p>

                                <StatusMsg msg={csMessage} />

                                <form onSubmit={handleCreateSalesman} className="dev-form">
                                    <div className="form-group">
                                        <label>Poora Naam</label>
                                        <input type="text" className="input-field" placeholder="Ali Khan"
                                            value={csName} onChange={e => setCsName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" className="input-field" placeholder="alikhan@inventorypro.com"
                                            value={csEmail} onChange={e => setCsEmail(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Password</label>
                                        <PwdInput value={csPassword} onChange={e => setCsPassword(e.target.value)}
                                            show={csShowPwd} onToggle={() => setCsShowPwd(p => !p)} />
                                        <span className="password-hint">Mazboot password dein.</span>
                                    </div>
                                    <button type="submit" className="btn-primary create-btn" disabled={csLoading}>
                                        {csLoading ? 'Ban raha hai...' : 'Salesman Account Banayein'}
                                        {!csLoading && <UserPlus size={18} />}
                                    </button>
                                </form>
                            </div>

                            <div className="dev-card glass-panel info-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <div className="info-content">
                                    <h3>System Information</h3>
                                    <ul className="info-list">
                                        <li><strong>Salesman Access:</strong> Salesman products, customers, suppliers, aur billing manage kar sakta hai.</li>
                                        <li><strong>Developer Role:</strong> Developer sirf system access manage kar sakta hai.</li>
                                        <li><strong>Data Isolation:</strong> Har Salesman ka apna data alag hota hai.</li>
                                    </ul>
                                    <div className="system-stats">
                                        <div className="stat-box">
                                            <span className="stat-title">System Status</span>
                                            <span className="stat-value text-gradient-accent">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 2: My Credentials ──────────────────────────────── */}
                    {activeTab === 'my-creds' && (
                        <div className="dev-content-grid">
                            <div className="dev-card glass-panel animate-fade-in">
                                <div className="card-header">
                                    <div className="icon-wrapper" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <h2>Meri Credentials Update Karein</h2>
                                </div>
                                <p className="card-desc">Apna naam, email ya password update karein. Sirf woh fields bharein jo change karne hain.</p>

                                <StatusMsg msg={myMessage} />

                                <form onSubmit={handleUpdateMyCredentials} className="dev-form">
                                    <div className="form-group">
                                        <label>Naam</label>
                                        <input type="text" className="input-field" placeholder="Apna naam"
                                            value={myName} onChange={e => setMyName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" className="input-field" placeholder="Apni email"
                                            value={myEmail} onChange={e => setMyEmail(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Naya Password <span className="optional-tag">(agar change karna hai)</span></label>
                                        <PwdInput value={myPassword} onChange={e => setMyPassword(e.target.value)}
                                            show={myShowPwd} onToggle={() => setMyShowPwd(p => !p)}
                                            placeholder="Naya password (optional)" />
                                    </div>
                                    <button type="submit" className="btn-primary create-btn" style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }} disabled={myLoading}>
                                        {myLoading ? 'Update ho raha hai...' : 'Meri Credentials Save Karein'}
                                        {!myLoading && <KeyRound size={18} />}
                                    </button>
                                </form>
                            </div>

                            <div className="dev-card glass-panel info-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <div className="info-content">
                                    <h3>Security Tips</h3>
                                    <ul className="info-list">
                                        <li><strong>Mazboot Password:</strong> Kam az kam 8 characters, numbers aur symbols zaroor shamil karein.</li>
                                        <li><strong>Email Change:</strong> Email change karne ke baad agli dafa login mein naya email use karein.</li>
                                        <li><strong>Password Change:</strong> Password update hone ke baad current session mehfooz rahega.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB 3: Salesman Credentials ────────────────────────── */}
                    {activeTab === 'salesman' && (
                        <div className="dev-content-grid">
                            <div className="dev-card glass-panel animate-fade-in">
                                <div className="card-header">
                                    <div className="icon-wrapper" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}>
                                        <Users size={24} />
                                    </div>
                                    <h2>Salesman Credentials Update Karein</h2>
                                </div>
                                <p className="card-desc">Pehle koi salesman select karein, phir uski details update karein.</p>

                                <StatusMsg msg={smMessage} />

                                {/* Salesman Selector */}
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label>Salesman Select Karein</label>
                                    {smListLoading ? (
                                        <p className="loading-text">Salesmen load ho rahe hain...</p>
                                    ) : salesmen.length === 0 ? (
                                        <p className="no-data-text">Koi salesman nahi mila. Pehle ek banayein.</p>
                                    ) : (
                                        <div className="salesman-list">
                                            {salesmen.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    className={`salesman-chip ${selectedSalesmanId === s.id ? 'selected' : ''}`}
                                                    onClick={() => handleSelectSalesman(s.id)}
                                                >
                                                    <span className="chip-avatar">{s.name.charAt(0).toUpperCase()}</span>
                                                    <span className="chip-info">
                                                        <span className="chip-name">{s.name}</span>
                                                        <span className="chip-email">{s.email}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedSalesmanId && (
                                    <form onSubmit={handleUpdateSalesmanCredentials} className="dev-form">
                                        <div className="selected-salesman-banner">
                                            <ShieldCheck size={16} />
                                            <span>Editing: <strong>{salesmen.find(s => s.id === selectedSalesmanId)?.name}</strong></span>
                                        </div>
                                        <div className="form-group">
                                            <label>Naam</label>
                                            <input type="text" className="input-field" placeholder="Salesman ka naam"
                                                value={smName} onChange={e => setSmName(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input type="email" className="input-field" placeholder="Salesman ki email"
                                                value={smEmail} onChange={e => setSmEmail(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Naya Password <span className="optional-tag">(agar change karna hai)</span></label>
                                            <PwdInput value={smPassword} onChange={e => setSmPassword(e.target.value)}
                                                show={smShowPwd} onToggle={() => setSmShowPwd(p => !p)}
                                                placeholder="Naya password (optional)" />
                                        </div>
                                        <button type="submit" className="btn-primary create-btn" style={{ background: 'linear-gradient(135deg,#16a34a,#4ade80)' }} disabled={smLoading}>
                                            {smLoading ? 'Update ho raha hai...' : 'Salesman Credentials Save Karein'}
                                            {!smLoading && <KeyRound size={18} />}
                                        </button>
                                    </form>
                                )}
                            </div>

                            <div className="dev-card glass-panel info-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                <div className="info-content">
                                    <h3>Salesman Management</h3>
                                    <ul className="info-list">
                                        <li><strong>Email Uniqueness:</strong> Har salesman ka email unique hona chahiye.</li>
                                        <li><strong>Password Reset:</strong> Agar salesman apna password bhool jaye to aap yahan reset kar saktay hain.</li>
                                        <li><strong>Naam Change:</strong> Naam change karne se salesman ka data متاثر nahi hoga.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default DeveloperDashboard;
