import React, { useState } from 'react';
import { Download, Trash2, AlertTriangle, Shield, Database, FileText } from 'lucide-react';
import axios from 'axios';
import './DatabaseExport.css';

const DatabaseExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [confirmCode, setConfirmCode] = useState('');
    const [message, setMessage] = useState('');

    const handleExport = async () => {
        try {
            setIsExporting(true);
            setMessage('');

            const token = localStorage.getItem('inventory_token');
            const response = await axios.get('/api/export/export-csv', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `database_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage('✅ Database exported successfully!');
            setTimeout(() => setMessage(''), 3000);

        } catch (error) {
            console.error('Export error:', error);
            setMessage('❌ Failed to export database');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearData = async () => {
        try {
            setIsClearing(true);
            setMessage('');

            const token = localStorage.getItem('inventory_token');
            
            const response = await axios.post('/api/export/clear-data', 
                { confirmCode: 'DELETE_MY_DATA' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('✅ All data cleared successfully!');
            setShowClearConfirm(false);
            setConfirmCode('');
            
            // Clear local storage and redirect to login
            setTimeout(() => {
                localStorage.removeItem('inventory_token');
                localStorage.removeItem('user_info');
                window.location.href = '/login';
            }, 2000);

        } catch (error) {
            setMessage('❌ Failed to clear data: ' + (error.response?.data?.message || error.message));
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="database-export-container">
            <div className="export-header">
                <h2>
                    <Database size={24} />
                    Database Management
                </h2>
                <p>Export your complete data or clear everything</p>
            </div>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="export-actions">
                {/* Export Section */}
                <div className="export-section">
                    <div className="action-card">
                        <div className="action-header">
                            <FileText size={32} className="icon-export" />
                            <div>
                                <h3>Export Database</h3>
                                <p>Download all your data as CSV file</p>
                            </div>
                        </div>
                        <div className="action-content">
                            <div className="data-preview">
                                <h4>What will be exported:</h4>
                                <ul>
                                    <li>📦 All Products</li>
                                    <li>💰 All Sales Records</li>
                                    <li>👥 All Buyers</li>
                                    <li>🏪 All Suppliers</li>
                                    <li>💸 All Expenses</li>
                                    <li>📋 All Purchases</li>
                                </ul>
                            </div>
                            <button 
                                className="btn-export"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                <Download size={20} />
                                {isExporting ? 'Exporting...' : 'Download CSV'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Clear Data Section */}
                <div className="clear-section">
                    <div className="action-card danger">
                        <div className="action-header">
                            <AlertTriangle size={32} className="icon-danger" />
                            <div>
                                <h3>Clear Database</h3>
                                <p>Permanently delete all your data</p>
                            </div>
                        </div>
                        <div className="action-content">
                            <div className="warning-box">
                                <Shield size={20} />
                                <div>
                                    <h4>⚠️ WARNING: This action cannot be undone!</h4>
                                    <p>All your data will be permanently deleted:</p>
                                    <ul>
                                        <li>🗑️ All products and inventory</li>
                                        <li>🗑️ All sales and transaction history</li>
                                        <li>🗑️ All customer and supplier records</li>
                                        <li>🗑️ All expenses and purchases</li>
                                        <li>🗑️ All reports and analytics data</li>
                                    </ul>
                                </div>
                            </div>
                            
                            {!showClearConfirm ? (
                                <button 
                                    className="btn-danger"
                                    onClick={() => setShowClearConfirm(true)}
                                    disabled={isClearing}
                                >
                                    <Trash2 size={20} />
                                    Clear All Data
                                </button>
                            ) : (
                                <div className="confirm-box">
                                    <h4>Type "DELETE_MY_DATA" to confirm:</h4>
                                    <input
                                        type="text"
                                        value={confirmCode}
                                        onChange={(e) => setConfirmCode(e.target.value)}
                                        placeholder="DELETE_MY_DATA"
                                        className="confirm-input"
                                    />
                                    <div className="confirm-buttons">
                                        <button 
                                            className="btn-cancel"
                                            onClick={() => {
                                                setShowClearConfirm(false);
                                                setConfirmCode('');
                                            }}
                                            disabled={isClearing}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            className="btn-confirm-danger"
                                            onClick={handleClearData}
                                            disabled={isClearing || confirmCode !== 'DELETE_MY_DATA'}
                                        >
                                            <Trash2 size={20} />
                                            {isClearing ? 'Deleting...' : 'Delete Everything'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatabaseExport;
