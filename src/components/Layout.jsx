import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const location = useLocation();
    // Assume user is logged in for the Layout wrapper (Login is handled separately in App.jsx)

    return (
        <div className="layout-container animate-fade-in">
            <Sidebar />
            <main className="main-content">
                <div className="content-wrapper">
                    <Outlet />
                    
                    {/* Global Advertisement Footer */}
                    <div style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '20px', textAlign: 'center' }}>
                        <div className="glass-panel" style={{ display: 'inline-block', padding: '16px 32px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)' }}>
                            <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>Software Developed by Hassan Ali Abrar</h4>
                            <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Instagram: <strong style={{ color: 'var(--info)' }}>hassan.secure</strong> <span style={{ margin: '0 8px', color: 'var(--glass-border)' }}>|</span> WhatsApp: <strong style={{ color: 'var(--success)' }}>+92 348 5055098</strong>
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact for custom software development & business automation</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
