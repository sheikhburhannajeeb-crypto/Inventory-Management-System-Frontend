import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomDropdown.css';

const CustomDropdown = ({ name, value, onChange, options, placeholder = "Select an option", className = "", style = {}, displayLabel }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    return (
        <div className={`custom-dropdown-container ${className}`} style={{ ...style, zIndex: isOpen ? 9999 : (style.zIndex || 1) }} ref={dropdownRef}>
            <div 
                className={`input-field dropdown-trigger ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: selectedOption ? 'inherit' : 'var(--text-muted)'
                }}>
                    {displayLabel !== undefined
                        ? (displayLabel || placeholder)
                        : (selectedOption ? selectedOption.label : placeholder)
                    }
                </span>
                <ChevronDown size={18} className={`dropdown-icon ${isOpen ? 'rotate' : ''}`} />
            </div>
            
            {isOpen && (
                <div className="dropdown-options glass-panel" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 1000 }}>
                    {options.map((option, idx) => (
                        <div 
                            key={idx}
                            className={`dropdown-option ${String(value) === String(option.value) ? 'selected' : ''}`}
                            onClick={() => {
                                onChange({ target: { name, value: option.value } });
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
