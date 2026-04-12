import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import html2pdf from 'html2pdf.js';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Wallet, Users, Truck, AlertTriangle, Building2, Banknote, Download, Package, CreditCard, ShoppingCart } from 'lucide-react';
import CustomDatePicker from '../components/CustomDatePicker';
import { notifyError } from '../utils/notifications';
import ScrollableTable from '../components/ScrollableTable';
import './MonthlyReport.css';
import './Reports.css';

const API_URL = '/api/reports/monthly';

const MonthlyReport = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState('overview');
    const reportRef = useRef();

    const filterYear = new Date(selectedDate).getFullYear().toString();
    const filterMonth = String(new Date(selectedDate).getMonth() + 1).padStart(2, '0');

    useEffect(() => {
        fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterYear, filterMonth]);

    const handleDownloadPdf = async () => {
        const element = reportRef.current;
        const originalWidth = element.style.width;
        const originalMaxWidth = element.style.maxWidth;
        element.style.width = '1060px';
        element.style.maxWidth = '1060px';
        await new Promise(r => setTimeout(r, 100));
        const heightMm = element.scrollHeight * 0.264583;
        const opt = {
            margin: [5, 5, 5, 5],
            filename: `Report_${new Date().toISOString().slice(0, 10)}_${Math.random().toString(36).substring(2, 15)}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 1.0, useCORS: true, width: 1060, windowWidth: 1060 },
            jsPDF: { unit: 'mm', format: [297, heightMm * 0.55 + 10], orientation: 'landscape' }
        };
        element.classList.add('pdf-mode-active');
        element.style.background = '#ffffff';
        element.style.color = '#000000';
        const newWindow = window.open('', '_blank');
        if (newWindow) newWindow.document.write('<body><h2 style="font-family:sans-serif; text-align:center; margin-top: 20vh;">Generating Monthly Report PDF...</h2></body>');
        await html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
            const pdfUrl = pdf.output('bloburl');
            if (newWindow) { newWindow.location.href = pdfUrl; } else { window.open(pdfUrl, '_blank'); }
        });
        element.classList.remove('pdf-mode-active');
        element.style.background = '';
        element.style.color = '';
        element.style.width = originalWidth;
        element.style.maxWidth = originalMaxWidth;
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`${API_URL}?year=${filterYear}&month=${filterMonth}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to fetch monthly report:', error);
            notifyError('Failed to load report data');
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

    const { summary, expense_breakdown, activity_lists, company_wise_summary, product_profit_list, supplier_purchase_summary } = reportData;
    const paymentSplit = summary.payment_split || { cash: 0, online: 0 };

    return (
        <div className="report-container page-container fade-in" style={{ paddingBottom: '40px' }}>
            <header className="page-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 className="page-title">Monthly Financial Report</h1>
                    <p className="page-subtitle">Complete overview of your business health</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CustomDatePicker value={selectedDate} onChange={setSelectedDate} label="SELECT DATE" className="monthly-report-date-picker" />
                    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
                        <button onClick={() => setViewMode('overview')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'overview' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'overview' ? '#fff' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}>Overview</button>
                        <button onClick={() => setViewMode('daily_summary')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'daily_summary' ? 'var(--accent-primary)' : 'transparent', color: viewMode === 'daily_summary' ? '#fff' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}>Daily Summaries</button>
                    </div>
                    <button className="btn-primary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', marginLeft: '12px' }}>
                        <Download size={18} /><span>Download PDF</span>
                    </button>
                </div>
            </header>

            <div ref={reportRef} style={{ background: 'var(--bg-primary)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>

                {/* PDF Header */}
                <div style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid var(--border-color)' }}>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                        {viewMode === 'overview' ? 'Monthly Summary' : 'Day-by-Day Monthly Summary'}
                    </h1>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Period: <strong>{new Date(selectedDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</strong></p>
                </div>

                {/* ====== OVERVIEW MODE ====== */}
                <div style={{ display: viewMode === 'overview' ? 'block' : 'none' }}>

                    {/* KEY METRICS — Row 1 */}
                    <div className="report-hero-stats">

                        {/* Net Real Profit */}
                        <div className={`stat-card-premium ${summary.net_real_profit >= 0 ? 'green' : 'red'}`}>
                            <div className="stat-header">
                                <div className="stat-icon-wrapper">{summary.net_real_profit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}</div>
                                <h3 className="stat-title">Net Real Profit</h3>
                            </div>
                            <div className="stat-row"><span>Product Profit:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(summary.product_profit || 0).toLocaleString()}</span></div>
                            <div className="stat-row"><span>Less Expenses:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>- Rs. {summary.total_expenses.toLocaleString()}</span></div>
                            <div className="stat-row"><span>Less Returns:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>- Rs. {(summary.total_returns_this_month || 0).toLocaleString()}</span></div>
                            <div className="stat-row highlight">
                                <span style={{ fontWeight: 700 }}>Net Real Profit:</span>
                                <span className="stat-value" style={{ color: summary.net_real_profit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.3rem' }}>
                                    Rs. {(summary.net_real_profit || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Cash Flow */}
                        <div className={`stat-card-premium ${summary.cash_flow_profit >= 0 ? 'blue' : 'red'}`}>
                            <div className="stat-header">
                                <div className="stat-icon-wrapper"><Wallet size={24} /></div>
                                <h3 className="stat-title">Cash Flow (In Hand)</h3>
                            </div>
                            <div className="stat-row"><span>Cash In (Sales + Credit):</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(summary.total_cash_sales_this_month + summary.total_sales_collected_this_month).toLocaleString()}</span></div>
                            <div className="stat-row"><span>Cash Out (Suppliers):</span><span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_purchases_paid_this_month.toLocaleString()}</span></div>
                            <div className="stat-row"><span>Expenses:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_expenses.toLocaleString()}</span></div>
                            <div className="stat-row highlight">
                                <span>Net Cash Flow:</span>
                                <span className="stat-value" style={{ color: summary.cash_flow_profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>Rs. {summary.cash_flow_profit.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Payment Method Split */}
                        <div className="stat-card-premium purple">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper"><CreditCard size={24} /></div>
                                <h3 className="stat-title">Payment Method Breakdown</h3>
                            </div>
                            <div className="stat-row">
                                <span>💵 Cash Only ({paymentSplit.cash_count || 0} log):</span>
                                <span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(paymentSplit.cash || 0).toLocaleString()}</span>
                            </div>
                            <div className="stat-row">
                                <span>📱 Online Only ({paymentSplit.online_count || 0} log):</span>
                                <span className="stat-value" style={{ color: '#38bdf8' }}>Rs. {(paymentSplit.online || 0).toLocaleString()}</span>
                            </div>
                            <div className="stat-row">
                                <span>🔀 Split ({paymentSplit.split_count || 0} log):</span>
                                <span className="stat-value" style={{ color: '#f59e0b' }}>Cash+Online mila k</span>
                            </div>
                            <div className="stat-row" style={{ borderTop: '1px dashed var(--glass-border)', marginTop: '6px', paddingTop: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <span>↳ Split ka Cash iss mein:</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Included</span>
                            </div>
                            <div className="stat-row" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                <span>↳ Split ka Online iss mein:</span>
                                <span style={{ color: '#38bdf8', fontWeight: 600 }}>✓ Included</span>
                            </div>
                            <div className="stat-row highlight" style={{ marginTop: '8px' }}>
                                <span style={{ fontWeight: 700 }}>💰 Grand Total Received:</span>
                                <span className="stat-value" style={{ color: 'var(--success)', fontSize: '1.2rem' }}>Rs. {(paymentSplit.grand_total || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Purchases (Stock Added) */}
                        <div className="stat-card-premium orange">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper"><ShoppingCart size={24} /></div>
                                <h3 className="stat-title">Stock Purchased (Saman Daala)</h3>
                            </div>
                            <div className="stat-row"><span>Total Invoices Made:</span><span className="stat-value">Rs. {summary.total_purchases_created_value.toLocaleString()}</span></div>
                            <div className="stat-row"><span>Cash Paid to Suppliers:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_purchases_paid_this_month.toLocaleString()}</span></div>
                            <div className="stat-row highlight">
                                <span>Credit Taken:</span>
                                <span className="stat-value" style={{ color: 'var(--warning)' }}>Rs. {summary.total_credit_taken_this_month.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Returns */}
                        <div className="stat-card-premium red">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper"><TrendingDown size={24} /></div>
                                <h3 className="stat-title">Returns & Dues</h3>
                            </div>
                            <div className="stat-row"><span>Returns Refunded:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {(summary.total_returns_this_month || 0).toLocaleString()}</span></div>
                            <div className="stat-row"><span>New Credit Given:</span><span className="stat-value" style={{ color: 'var(--warning)' }}>Rs. {summary.total_credit_given_this_month.toLocaleString()}</span></div>
                            <div className="stat-row highlight">
                                <span>All-Time Customer Dues:</span>
                                <span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_all_time_dues_from_buyers.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="stat-card-premium blue">
                            <div className="stat-header">
                                <div className="stat-icon-wrapper"><DollarSign size={24} /></div>
                                <h3 className="stat-title">Shop Expenses</h3>
                            </div>
                            <div className="stat-row highlight">
                                <span>Total Expenses:</span>
                                <span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_expenses.toLocaleString()}</span>
                            </div>
                            {Object.entries(expense_breakdown).slice(0, 4).map(([cat, amt]) => (
                                <div key={cat} className="stat-row"><span>{cat}:</span><span className="stat-value">Rs. {Number(amt).toLocaleString()}</span></div>
                            ))}
                        </div>
                    </div>

                    {/* PRODUCT PROFIT BREAKDOWN */}
                    <div className="premium-table-wrap" style={{ marginTop: '30px' }}>
                        <h3 style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Package size={20} color="#10b981" /> Product-Wise Profit Breakdown
                        </h3>
                        {(!product_profit_list || product_profit_list.length === 0) ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sales data for this month.</div>
                        ) : (
                            <ScrollableTable>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th style={{ textAlign: 'center' }}>Qty Sold</th>
                                            <th style={{ textAlign: 'right' }}>Sale Rate</th>
                                            <th style={{ textAlign: 'right' }}>Buy Rate</th>
                                            <th style={{ textAlign: 'right' }}>Profit/Unit</th>
                                            <th style={{ textAlign: 'right' }}>Total Revenue</th>
                                            <th style={{ textAlign: 'right' }}>Total Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {product_profit_list.map((p, i) => {
                                            const profitPerUnit = p.sale_rate - p.purchase_rate;
                                            return (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.total_qty_sold}</td>
                                                    <td style={{ textAlign: 'right' }}>Rs. {p.sale_rate.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>Rs. {p.purchase_rate.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: profitPerUnit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                                        Rs. {profitPerUnit.toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>Rs. {p.total_revenue.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: p.total_profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                                        Rs. {p.total_profit.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(16,185,129,0.05)', fontWeight: 700 }}>
                                            <td>Grand Total</td>
                                            <td style={{ textAlign: 'center' }}>{product_profit_list.reduce((s, p) => s + p.total_qty_sold, 0)}</td>
                                            <td colSpan={3}></td>
                                            <td style={{ textAlign: 'right' }}>Rs. {product_profit_list.reduce((s, p) => s + p.total_revenue, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)' }}>Rs. {product_profit_list.reduce((s, p) => s + p.total_profit, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </ScrollableTable>
                        )}
                    </div>

                    {/* SUPPLIER PURCHASE SUMMARY */}
                    {supplier_purchase_summary && supplier_purchase_summary.length > 0 && (
                        <div className="premium-table-wrap" style={{ marginTop: '30px' }}>
                            <h3 style={{ padding: '18px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.1rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Truck size={20} color="#a855f7" /> Supplier-Wise Purchase Summary (Saman Kitna Aaya)
                            </h3>
                            <ScrollableTable>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Supplier Name</th>
                                            <th style={{ textAlign: 'center' }}>Transactions</th>
                                            <th style={{ textAlign: 'right' }}>Total Purchased</th>
                                            <th style={{ textAlign: 'right' }}>Cash Paid</th>
                                            <th style={{ textAlign: 'right' }}>Remaining (Credit)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplier_purchase_summary.map((s, i) => (
                                            <tr key={i}>
                                                <td style={{ fontWeight: 600 }}>{s.supplier_name}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{s.num_transactions}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 600 }}>Rs. {s.total_purchased.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--success)' }}>Rs. {s.total_paid.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: s.total_outstanding > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                                                    {s.total_outstanding > 0 ? `Rs. ${s.total_outstanding.toLocaleString()}` : '✓ Clear'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--glass-border)', fontWeight: 700 }}>
                                            <td>Grand Total</td>
                                            <td style={{ textAlign: 'center' }}>{supplier_purchase_summary.reduce((s, x) => s + x.num_transactions, 0)}</td>
                                            <td style={{ textAlign: 'right' }}>Rs. {supplier_purchase_summary.reduce((s, x) => s + x.total_purchased, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)' }}>Rs. {supplier_purchase_summary.reduce((s, x) => s + x.total_paid, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>Rs. {supplier_purchase_summary.reduce((s, x) => s + x.total_outstanding, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </ScrollableTable>
                        </div>
                    )}

                    {/* DETAILED LEDGER SPLIT */}
                    <div className="ledger-split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginTop: '30px' }}>
                        {/* INCOME SIDE */}
                        <div className="ledger-section">
                            <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Users size={20} /> Income & Receivables
                            </h2>
                            <div className="premium-list-container" style={{ marginBottom: '24px' }}>
                                <div className="stat-row"><span>Total Sales Invoices Made:</span><span className="stat-value">Rs. {summary.total_sales_created_value.toLocaleString()}</span></div>
                                <div className="stat-row"><span>Cash Sales (Fully Paid):</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(summary.total_cash_sales_this_month || 0).toLocaleString()}</span></div>
                                <div className="stat-row"><span>Credit Installments Received:</span><span className="stat-value" style={{ color: 'var(--info)' }}>Rs. {summary.total_sales_collected_this_month.toLocaleString()}</span></div>
                                <div style={{ margin: '10px 0 4px', padding: '10px', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-primary)' }}>💳 Payment Method Breakdown:</div>
                                    <div className="stat-row"><span>💵 Cash Only ({paymentSplit.cash_count || 0} log):</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(paymentSplit.cash || 0).toLocaleString()}</span></div>
                                    <div className="stat-row"><span>📱 Online Only ({paymentSplit.online_count || 0} log):</span><span className="stat-value" style={{ color: '#38bdf8' }}>Rs. {(paymentSplit.online || 0).toLocaleString()}</span></div>
                                    <div className="stat-row"><span>🔀 Split ({paymentSplit.split_count || 0} log):</span><span className="stat-value" style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Cash + Online ↓</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '12px' }}>
                                        <span>↳ Split ka Cash (💵 mein shamil):</span>
                                        <span style={{ color: 'var(--success)' }}>✓</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', paddingLeft: '12px', marginBottom: '6px' }}>
                                        <span>↳ Split ka Online (📱 mein shamil):</span>
                                        <span style={{ color: '#38bdf8' }}>✓</span>
                                    </div>
                                    <div className="stat-row highlight"><span style={{ fontWeight: 700 }}>💰 Grand Total Received:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {(paymentSplit.grand_total || 0).toLocaleString()}</span></div>
                                </div>
                                <div className="stat-row highlight"><span>New Credit Given:</span><span className="stat-value" style={{ color: 'var(--warning)' }}>Rs. {summary.total_credit_given_this_month.toLocaleString()}</span></div>
                            </div>

                            <div className="premium-table-wrap" style={{ marginBottom: '20px' }}>
                                <h3 style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Banknote size={16} color="#22c55e" /> Cash Collected (by Salesman)
                                </h3>
                                {activity_lists.cash_sales_by_salesman.length === 0 ? (
                                    <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>No cash sales recorded this month.</div>
                                ) : (
                                    <ScrollableTable>
                                        <table className="premium-table">
                                            <thead><tr><th>Salesman / User</th><th style={{ textAlign: 'center' }}>Bills</th><th style={{ textAlign: 'right' }}>Cash Collected</th></tr></thead>
                                            <tbody>
                                                {activity_lists.cash_sales_by_salesman.map(s => (
                                                    <tr key={s.id}>
                                                        <td style={{ fontWeight: '500' }}>{s.salesman_name}</td>
                                                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{s.num_cash_bills}</td>
                                                        <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: '600' }}>+Rs. {s.total_cash_collected.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(34,197,94,0.05)' }}>
                                                    <td style={{ fontWeight: '700', color: 'var(--success)' }}>Total</td>
                                                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{activity_lists.cash_sales_by_salesman.reduce((s, r) => s + r.num_cash_bills, 0)}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: '700' }}>+Rs. {(summary.total_cash_sales_this_month || 0).toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </ScrollableTable>
                                )}
                            </div>

                            <div className="premium-table-wrap">
                                <h3 style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={16} color="#a78bfa" /> Credit Installments Received
                                </h3>
                                {activity_lists.credit_payments_received.length === 0 ? (
                                    <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>No credit payments received this month.</div>
                                ) : (
                                    <ScrollableTable>
                                        <table className="premium-table">
                                            <thead><tr><th>Name</th><th>Phone</th><th style={{ textAlign: 'right' }}>Received</th></tr></thead>
                                            <tbody>
                                                {activity_lists.credit_payments_received.map(b => (
                                                    <tr key={b.id}><td>{b.name}</td><td>{b.phone}</td><td style={{ textAlign: 'right', color: 'var(--accent-primary)', fontWeight: '500' }}>+Rs. {b.amount_paid_this_month.toLocaleString()}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </ScrollableTable>
                                )}
                            </div>
                        </div>

                        {/* OUTFLOW SIDE */}
                        <div className="ledger-section">
                            <h2 style={{ fontSize: '1.2rem', color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Truck size={20} /> Expenses & Payables
                            </h2>
                            <div className="premium-list-container" style={{ marginBottom: '24px' }}>
                                <div className="stat-row"><span>Total Purchase Invoices Made:</span><span className="stat-value">Rs. {summary.total_purchases_created_value.toLocaleString()}</span></div>
                                <div className="stat-row"><span>Actual Cash Paid to Suppliers:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>Rs. {summary.total_purchases_paid_this_month.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>Total Shop Expenses:</span><span className="stat-value" style={{ color: 'var(--warning)' }}>Rs. {summary.total_expenses.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>New Credit Taken This Month:</span><span className="stat-value" style={{ color: 'var(--info)' }}>Rs. {summary.total_credit_taken_this_month.toLocaleString()}</span></div>
                            </div>

                            <div className="premium-list-container" style={{ marginBottom: '20px' }}>
                                <div className="premium-list-header"><h3 style={{ fontSize: '1.1rem', margin: 0 }}>Expense Breakdown</h3></div>
                                {Object.keys(expense_breakdown).length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No expenses recorded.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {Object.entries(expense_breakdown).map(([category, amount]) => (
                                            <div key={category} className="stat-row"><span>{category}</span><span className="stat-value">Rs. {amount.toLocaleString()}</span></div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="premium-table-wrap">
                                <h3 style={{ padding: '15px 20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1rem' }}>Payments Made to Suppliers</h3>
                                {activity_lists.payments_made_to_suppliers.length === 0 ? (
                                    <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>No payments to suppliers this month.</div>
                                ) : (
                                    <ScrollableTable>
                                        <table className="premium-table">
                                            <thead><tr><th>Supplier Name</th><th style={{ textAlign: 'right' }}>Paid</th></tr></thead>
                                            <tbody>
                                                {activity_lists.payments_made_to_suppliers.map(s => (
                                                    <tr key={s.id}><td>{s.name}</td><td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: '500' }}>-Rs. {s.amount_paid_this_month.toLocaleString()}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </ScrollableTable>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COMPANY-WISE SUMMARY */}
                    <div className="premium-table-wrap" style={{ marginTop: '30px' }}>
                        <h3 style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Building2 size={20} /> Company-Wise Sales Summary (This Month)
                        </h3>
                        {company_wise_summary.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sales recorded this month.</div>
                        ) : (
                            <ScrollableTable>
                                <table className="premium-table">
                                    <thead><tr><th>Company Name</th><th style={{ textAlign: 'center' }}>Transactions</th><th style={{ textAlign: 'right' }}>Total Sales</th><th style={{ textAlign: 'right' }}>Collected</th><th style={{ textAlign: 'right' }}>Outstanding</th></tr></thead>
                                    <tbody>
                                        {company_wise_summary.map((c, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: '600' }}>{c.company_name === 'Walk-in / No Company' ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.company_name}</span> : c.company_name}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{c.num_transactions}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '500' }}>Rs. {c.total_sales.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: '500' }}>Rs. {c.total_collected.toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: c.total_outstanding > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>
                                                    {c.total_outstanding > 0 ? `Rs. ${c.total_outstanding.toLocaleString()}` : '✓ Clear'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr style={{ borderTop: '2px solid var(--glass-border)', background: 'rgba(56,189,248,0.05)', fontWeight: '700' }}>
                                            <td>Grand Total</td>
                                            <td style={{ textAlign: 'center' }}>{company_wise_summary.reduce((s, c) => s + c.num_transactions, 0)}</td>
                                            <td style={{ textAlign: 'right' }}>Rs. {company_wise_summary.reduce((s, c) => s + c.total_sales, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--success)' }}>Rs. {company_wise_summary.reduce((s, c) => s + c.total_collected, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)' }}>Rs. {company_wise_summary.reduce((s, c) => s + c.total_outstanding, 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </ScrollableTable>
                        )}
                    </div>

                    {/* ALL-TIME DUES */}
                    <div className="premium-table-wrap" style={{ marginTop: '30px', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                        <h3 style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.1rem', color: '#eab308' }}>
                            ⚠️ Action Required: Customers with Outstanding Dues (All-Time)
                        </h3>
                        {activity_lists.all_time_buyers_with_dues.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><p style={{ color: 'var(--success)', fontWeight: '500' }}>Great! No pending dues from any customers.</p></div>
                        ) : (
                            <ScrollableTable>
                                <table className="premium-table">
                                    <thead><tr><th>Customer Name</th><th>Phone Number</th><th style={{ textAlign: 'right' }}>Total Remaining</th></tr></thead>
                                    <tbody>
                                        {activity_lists.all_time_buyers_with_dues.map(b => (
                                            <tr key={b.id}>
                                                <td style={{ fontWeight: '500' }}>{b.name}</td>
                                                <td><a href={`tel:${b.phone}`} style={{ color: 'var(--info)', textDecoration: 'none' }}>{b.phone}</a></td>
                                                <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: '600' }}>Rs. {b.remaining_due.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollableTable>
                        )}
                    </div>
                </div>

                {/* ====== DAILY SUMMARIES MODE ====== */}
                {viewMode === 'daily_summary' && (
                    <div className="premium-table-wrap" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                        <h3 style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', background: 'var(--bg-secondary)' }}>
                            Month Day-by-Day Breakdown
                        </h3>
                        {(!reportData.daily_breakdown || reportData.daily_breakdown.length === 0) ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No activity recorded for this month.</div>
                        ) : (
                            <ScrollableTable>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th style={{ textAlign: 'right' }}>Sales (#)</th>
                                            <th style={{ textAlign: 'right' }}>Sale Value</th>
                                            <th style={{ textAlign: 'right' }}>💵 Cash</th>
                                            <th style={{ textAlign: 'right' }}>📱 Online</th>
                                            <th style={{ textAlign: 'right' }}>Credit Given</th>
                                            <th style={{ textAlign: 'right' }}>Returns</th>
                                            <th style={{ textAlign: 'right' }}>Expenses</th>
                                            <th style={{ textAlign: 'right' }}>Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.daily_breakdown.map((day, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ fontWeight: '600', padding: '14px 16px' }}>{new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--text-muted)', padding: '14px 16px' }}>{day.num_new_sales > 0 ? day.num_new_sales : '-'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--info)', padding: '14px 16px' }}>{day.total_sales > 0 ? `Rs. ${day.total_sales.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: '600', padding: '14px 16px' }}>{day.cash_received > 0 ? `Rs. ${day.cash_received.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: '#38bdf8', fontWeight: '600', padding: '14px 16px' }}>{day.online_received > 0 ? `Rs. ${day.online_received.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: day.credit_given > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: '600', padding: '14px 16px' }}>{day.credit_given > 0 ? `Rs. ${day.credit_given.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: day.returned_sales_value > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600', padding: '14px 16px' }}>{day.returned_sales_value > 0 ? `Rs. ${day.returned_sales_value.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: day.expenses > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '600', padding: '14px 16px' }}>{day.expenses > 0 ? `Rs. ${day.expenses.toLocaleString()}` : '-'}</td>
                                                <td style={{ textAlign: 'right', color: (day.daily_profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '700', padding: '14px 16px' }}>{(day.daily_profit || 0) !== 0 ? `Rs. ${(day.daily_profit || 0).toLocaleString()}` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot style={{ background: 'var(--bg-secondary)' }}>
                                        <tr style={{ fontWeight: '700' }}>
                                            <td style={{ padding: '14px 16px' }}>Total for Month</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px' }}>{reportData.daily_breakdown.reduce((s, d) => s + d.num_new_sales, 0)}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--info)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + d.total_sales, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--success)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + (d.cash_received || 0), 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: '#38bdf8' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + (d.online_received || 0), 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--warning)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + d.credit_given, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--danger)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + (d.returned_sales_value || 0), 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--danger)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + d.expenses, 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'right', padding: '14px 16px', color: 'var(--success)' }}>Rs. {reportData.daily_breakdown.reduce((s, d) => s + (d.daily_profit || 0), 0).toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </ScrollableTable>
                        )}
                    </div>
                )}

                {/* Advertisement Footer */}
                <div style={{ marginTop: '50px', paddingTop: '24px', borderTop: '2px solid var(--border-color)', textAlign: 'center', color: 'var(--text-primary)' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>Software Developed by Hassan Ali Abrar</h3>
                    <p style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Instagram: <strong style={{ color: 'var(--info)' }}>hassan.secure</strong> | WhatsApp: <strong style={{ color: 'var(--success)' }}>+92 348 5055098</strong></p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact for custom software development, business automation, and IT solutions.</p>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
        </div>
    );
};

export default MonthlyReport;
