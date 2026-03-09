import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Wallet, Users, Truck, AlertTriangle } from 'lucide-react';
import './MonthlyReport.css'; // Optional generic modern styling

const API_URL = import.meta.env.VITE_API_URL + '/reports/monthly';

const MonthlyReport = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        fetchReport();
    }, [filterDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [year, month] = filterDate.split('-');
            const response = await axios.get(`${API_URL}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('inventory_token')}` }
            });
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to fetch monthly report:', error);
            alert('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <RefreshCw className="spinner" size={40} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    if (!reportData) return <div className="page-container">No Data Available</div>;

    const { summary, expense_breakdown, activity_lists } = reportData;

    return (
        <div className="report-container page-container fade-in" style={{ paddingBottom: '40px' }}>
            <header className="page-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 className="page-title">Monthly Financial Report</h1>
                    <p className="page-subtitle">Complete overview of your business health</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <label style={{ color: 'var(--text-secondary)' }}>Select Month:</label>
                    <input
                        type="month"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="form-input"
                        style={{ background: 'rgba(15, 23, 42, 0.6)', width: 'auto' }}
                    />
                </div>
            </header>

            {/* KEY METRICS */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>

                {/* Net Cash Flow */}
                <div className="stat-card glass-panel flex-row">
                    <div className="stat-icon" style={{ background: summary.cash_flow_profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                        {summary.cash_flow_profit >= 0 ? <TrendingUp size={28} color="#22c55e" /> : <TrendingDown size={28} color="#ef4444" />}
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">Cash Flow Profit (In hand)</p>
                        <h3 className="stat-value" style={{ color: summary.cash_flow_profit >= 0 ? '#22c55e' : '#ef4444' }}>
                            Rs. {summary.cash_flow_profit.toLocaleString()}
                        </h3>
                    </div>
                </div>

                {/* Accrual Profit */}
                <div className="stat-card glass-panel flex-row" title="Profit based on invoice totals, regardless of if cash was received">
                    <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
                        <Wallet size={28} color="#38bdf8" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">Gross Business Margin</p>
                        <h3 className="stat-value text-primary">Rs. {summary.accrual_profit.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Expenses */}
                <div className="stat-card glass-panel flex-row">
                    <div className="stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
                        <DollarSign size={28} color="#f97316" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">Total Shop Expenses</p>
                        <h3 className="stat-value" style={{ color: '#f97316' }}>Rs. {summary.total_expenses.toLocaleString()}</h3>
                    </div>
                </div>

                {/* Risk / Dues */}
                <div className="stat-card glass-panel flex-row">
                    <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
                        <AlertTriangle size={28} color="#eab308" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-title">All-Time Buyer Dues pending</p>
                        <h3 className="stat-value" style={{ color: '#eab308' }}>Rs. {summary.total_all_time_dues_from_buyers.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* DETAILED LEDGER SPLIT */}
            <div className="ledger-split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>

                {/* INCOME SIDE */}
                <div className="ledger-section">
                    <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} /> Income & Receivables
                    </h2>

                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Sales Invoices Made:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_sales_created_value.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#22c55e' }}>
                            <span>Actual Cash Collected:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_sales_collected_this_month.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#eab308', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                            <span>New Credit Given This Month:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_credit_given_this_month.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Breakdown of Payments Received */}
                    <div className="glass-panel table-container">
                        <h3 style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1rem' }}>Cash Collected from Buyers</h3>
                        {activity_lists.payments_received_from_buyers.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No collections recorded this month.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th style={{ textAlign: 'right' }}>Collected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity_lists.payments_received_from_buyers.map(b => (
                                        <tr key={b.id}>
                                            <td>{b.name}</td>
                                            <td>{b.phone}</td>
                                            <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: '500' }}>+Rs. {b.amount_paid_this_month.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* OUTFLOW SIDE */}
                <div className="ledger-section">
                    <h2 style={{ fontSize: '1.2rem', color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Truck size={20} /> Expenses & Payables
                    </h2>

                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Purchase Invoices Made:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_purchases_created_value.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ef4444' }}>
                            <span>Actual Cash Paid to Suppliers:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_purchases_paid_this_month.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f97316', paddingTop: '10px', borderTop: '1px solid var(--glass-border)', marginBottom: '10px' }}>
                            <span>Total Shop Expenses:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_expenses.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8b5cf6', paddingTop: '10px', borderTop: '1px solid var(--glass-border)' }}>
                            <span>New Credit Taken This Month:</span>
                            <span style={{ fontWeight: '600' }}>Rs. {summary.total_credit_taken_this_month.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Breakdown of Expenses */}
                    <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>Expense Breakdown</h3>
                        {Object.keys(expense_breakdown).length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No expenses recorded.</p>
                        ) : (
                            Object.entries(expense_breakdown).map(([category, amount]) => (
                                <div key={category} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>{category}</span>
                                    <span style={{ fontWeight: '500' }}>Rs. {amount.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Payments to Suppliers */}
                    <div className="glass-panel table-container">
                        <h3 style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1rem' }}>Payments Made to Suppliers</h3>
                        {activity_lists.payments_made_to_suppliers.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No payments to suppliers this month.</p>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Supplier Name</th>
                                        <th style={{ textAlign: 'right' }}>Paid</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activity_lists.payments_made_to_suppliers.map(s => (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: '500' }}>-Rs. {s.amount_paid_this_month.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

            {/* Outdated / All Time Dues Section */}
            <div className="glass-panel table-container" style={{ marginTop: '30px' }}>
                <h3 style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.1rem', color: '#eab308' }}>
                    ⚠️ Action Required: Buyers with Outstanding Dues (All-Time)
                </h3>
                {activity_lists.all_time_buyers_with_dues.length === 0 ? (
                    <p style={{ padding: '30px', textAlign: 'center', color: '#22c55e', fontWeight: '500' }}>Great! No pending dues from any buyers.</p>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Buyer Name</th>
                                <th>Phone Number</th>
                                <th style={{ textAlign: 'right' }}>Total Remaining Amount to Recover</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activity_lists.all_time_buyers_with_dues.map(b => (
                                <tr key={b.id}>
                                    <td style={{ fontWeight: '500' }}>{b.name}</td>
                                    <td>
                                        <a href={`tel:${b.phone}`} style={{ color: '#38bdf8', textDecoration: 'none' }}>{b.phone}</a>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>Rs. {b.remaining_due.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .flex-row { display: flex; align-items: center; gap: 15px; padding: 20px; border-radius: 16px; }
                .stat-icon { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 12px; }
                .stat-title { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 5px; font-weight: 500;}
                .stat-value { font-size: 1.6rem; margin: 0; font-weight: 700; }
            `}} />
        </div>
    );
};

export default MonthlyReport;
