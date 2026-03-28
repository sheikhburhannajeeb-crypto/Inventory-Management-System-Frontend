import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, UserPlus, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import './DeveloperDashboard.css';

const DeveloperDashboard = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [user, setUser] = useState({ name: 'Developer', email: '' });

    useEffect(() => {
        const storedUser = localStorage.getItem('inventory_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                if (parsedUser.role !== 'developer') {
                    navigate('/products', { replace: true });
                }
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        } else {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('inventory_token');
        localStorage.removeItem('inventory_user');
        navigate('/login', { replace: true });
    };

    const handleCreateSalesman = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('inventory_token');
            const response = await axios.post('/api/auth/create-salesman', {
                name,
                email,
                password
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setMessage({ type: 'success', text: `Salesman account for ${response.data.salesman.name} created successfully!` });

            // Clear form
            setName('');
            setEmail('');
            setPassword('');

        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to create salesman account.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dev-dashboard-container">
            {/* Background Glow */}
            <div className="glow-orb top-left"></div>
            <div className="glow-orb bottom-right"></div>

            {/* Sidebar / Top Nav for Dev */}
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
                    <p className="page-subtitle">Create and manage salesman accounts for your system</p>
                </div>

                <div className="dev-content-grid">
                    {/* Create Salesman Card */}
                    <div className="dev-card glass-panel animate-fade-in">
                        <div className="card-header">
                            <div className="icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                                <UserPlus size={24} />
                            </div>
                            <h2>Register Setup Salesman</h2>
                        </div>

                        <p className="card-desc">Fill in the details below to create a new salesman account. They will be able to log in to the main inventory application immediately.</p>

                        {message.text && (
                            <div className={`status-message ${message.type}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateSalesman} className="dev-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Ali Khan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="alikhan@inventorypro.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Secure Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span className="password-hint">Make sure to provide a strong password for security.</span>
                            </div>

                            <button type="submit" className="btn-primary create-btn" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Create Salesman Account'}
                                {!loading && <UserPlus size={18} />}
                            </button>
                        </form>
                    </div>

                    {/* Placeholder for future list */}
                    <div className="dev-card glass-panel info-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="info-content">
                            <h3>System Information</h3>
                            <ul className="info-list">
                                <li><strong>Role Access:</strong> Salesmen can manage products, customers, suppliers, and billing.</li>
                                <li><strong>Developer Role:</strong> Developers can only manage system access and cannot interact with actual inventory data.</li>
                                <li><strong>Data Isolation:</strong> Ensure your Salesman IDs are securely isolated.</li>
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
            </main>
        </div>
    );
};

export default DeveloperDashboard;
