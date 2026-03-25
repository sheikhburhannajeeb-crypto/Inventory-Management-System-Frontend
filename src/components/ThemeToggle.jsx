import { useContext } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '30px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--accent-primary)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px var(--accent-glow)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--bg-secondary)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default ThemeToggle;
