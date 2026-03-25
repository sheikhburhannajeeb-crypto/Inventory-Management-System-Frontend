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
                padding: '10px',
                background: 'rgba(100, 116, 139, 0.1)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                borderRadius: '8px',
                cursor: 'pointer'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.2)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)';
            }}
        >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
    );
};

export default ThemeToggle;
