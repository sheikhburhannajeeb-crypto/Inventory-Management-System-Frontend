import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Download, Package, Truck, Target, CreditCard, ShoppingCart, TrendingUp } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import CustomDatePicker from '../components/CustomDatePicker';
import './Expenses.css';
import ScrollableTable from '../components/ScrollableTable';
import './Reports.css';

const DailyReport = () => {
    const defaultDate = new Date().toISOString().split('T')[0];
    const [reportDate, setReportDate] = useState(defaultDate);
    const [loading, setLoading] = useState(false);

    const [salesToday, setSalesToday] = useState([]);
    const [returnsToday, setReturnsToday] = useState([]);
    const [productsToday, setProductsToday] = useState([]);
    const [supplierTxns, setSupplierTxns] = useState([]);
    const [buyersToday, setBuyersToday] = useState([]);
    const [suppliersToday, setSuppliersToday] = useState([]);

    const reportRef = useRef();

    useEffect(() => {
        fetchDailyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportDate]);

    const fetchDailyData = async () => {
        setLoading(true);
        try {
            const [salesRes, productsRes, suppliersRes, buyersRes, returnsRes] = await Promise.all([
                api.get('/api/sales'),
                api.get('/api/products'),
                api.get('/api/suppliers'),
                api.get('/api/buyers'),
                api.get('/api/sales/returns').catch(() => ({ data: [] }))
            ]);

            const sToday = (salesRes.data || []).filter(s => {
                const d = s.date || s.purchase_date || s.created_at || '';
                return d.startsWith(reportDate);
            });
            setSalesToday(sToday);

            const retToday = (returnsRes.data || []).filter(r => {
                const dateOnly = r.returned_at ? r.returned_at.split('T')[0] : '';
                return dateOnly === reportDate;
            });
            setReturnsToday(retToday);

            const pToday = (productsRes.data || []).filter(p => {
                const d = p.created_at || p.date || '';
                return d.startsWith(reportDate);
            });
            setProductsToday(pToday);

            let stoday = [];
            const newSuppliers = [];
            (suppliersRes.data || []).forEach(supplier => {
                const txns = supplier.supplier_transactions || [];
                txns.forEach(txn => {
                    const d = txn.purchase_date || txn.date || txn.created_at || '';
                    if (d.startsWith(reportDate)) {
                        stoday.push({ ...txn, supplierName: supplier.name });
                    }
                });
                const d = supplier.created_at || supplier.date || '';
                if (d.startsWith(reportDate)) newSuppliers.push(supplier);
            });
            setSupplierTxns(stoday);
            setSuppliersToday(newSuppliers);

            const bToday = (buyersRes.data || []).filter(b => {
                const d = b.created_at || b.date || '';
                return d.startsWith(reportDate);
            });
            setBuyersToday(bToday);

        } catch (error) {
            console.error('Failed to fetch daily data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        const element = reportRef.current;
        const originalWidth = element.style.width;
        const originalMaxWidth = element.style.maxWidth;
        element.style.width = '1060px';
        element.style.maxWidth = '1060px';
        await new Promise(r => setTimeout(r, 100));
        const heightMm = element.scrollHeight * 0.264583;
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `Report_${new Date().toISOString().slice(0, 10)}_${Math.random().toString(36).substring(2, 15)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1.8, useCORS: true, width: 1060, windowWidth: 1060 },
            jsPDF: { unit: 'mm', format: [297, heightMm + 16], orientation: 'landscape' }
        };
        element.classList.add('pdf-mode-active');
        element.style.background = '#ffffff';
        const newWindow = window.open('', '_blank');
        if (newWindow) newWindow.document.write('<body><h2 style="font-family:sans-serif; text-align:center; margin-top: 20vh;">Generating Daily Report PDF...</h2></body>');
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

    // ============ CALCULATIONS ============
    const totalSalesAmount = salesToday.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalCashPaid = salesToday.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
    const totalCreditGiven = totalSalesAmount - totalCashPaid;

    // Payment method split
    const cashReceived = salesToday.reduce((sum, s) => {
        const m = (s.payment_method || 'Cash').toLowerCase();
        if (m === 'cash') return sum + Number(s.paid_amount || 0);
        if (m === 'split') return sum + Number(s.cash_amount || 0);
        return sum;
    }, 0);
    const onlineReceived = salesToday.reduce((sum, s) => {
        const m = (s.payment_method || 'Cash').toLowerCase();
        if (m === 'online') return sum + Number(s.paid_amount || 0);
        if (m === 'split') return sum + Number(s.online_amount || 0);
        return sum;
    }, 0);

    // Product profit = (sale price - purchase rate) * qty
    const totalProfit = salesToday.reduce((sum, s) => {
        const saleRate = Number(s.products?.price || 0);
        const purchaseRate = Number(s.products?.purchase_rate || 0);
        const qty = Number(s.quantity || 0);
        return sum + ((saleRate - purchaseRate) * qty);
    }, 0);

    // Net real profit = product profit - returns
    const totalReturnsAmount = returnsToday.reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
    const totalReturnsQty = returnsToday.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const netRealProfit = totalProfit - totalReturnsAmount;

    // Supplier totals (stock purchased today)
    const supplierTotalAmount = supplierTxns.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const supplierTotalPaid = supplierTxns.reduce((sum, t) => sum + Number(t.paid_amount || 0), 0);
    const totalCreditToSuppliers = supplierTotalAmount - supplierTotalPaid;

    // Product-wise profit table for today
    const productProfitMap = salesToday.reduce((acc, s) => {
        const name = s.products?.name || `Product #${s.product_id}`;
        const key = s.product_id || name;
        const saleRate = Number(s.products?.price || 0);
        const purchaseRate = Number(s.products?.purchase_rate || 0);
        const qty = Number(s.quantity || 0);
        if (!acc[key]) acc[key] = { name, saleRate, purchaseRate, qty: 0, revenue: 0, profit: 0 };
        acc[key].qty += qty;
        acc[key].revenue += Number(s.total_amount || 0);
        acc[key].profit += (saleRate - purchaseRate) * qty;
        return acc;
    }, {});
    const productProfitList = Object.values(productProfitMap).sort((a, b) => b.profit - a.profit);

    return (
        <div className="report-container page-container fade-in" style={{ paddingBottom: '40px' }}>
            <header className="page-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 className="page-title">Daily Report</h1>
                    <p className="page-subtitle">Generate a full summary for any given day</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '12px', gap: '12px' }}>
                        <CustomDatePicker value={reportDate} onChange={setReportDate} className="report-date-picker" />
                    </div>
                    <button className="btn-primary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px' }} disabled={loading}>
                        <Download size={18} /><span>Download PDF</span>
                    </button>
                </div>
            </header>

            <div>
                {loading ? (
                    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <div className="text-center" style={{ color: 'var(--text-muted)' }}>Loading records...</div>
                    </div>
                ) : (
                    <div ref={reportRef} style={{ padding: '30px', borderRadius: '16px', minHeight: '800px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)' }}>

                        {/* Report Header */}
                        <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px' }}>
                            <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>Store Daily Report</h1>
                            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Date: <strong>{new Date(reportDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></p>
                        </div>

                        {/* ===== SUMMARY CARDS ===== */}
                        <div className="report-hero-stats">

                            {/* Sales Overview */}
                            <div className="stat-card-premium blue">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper"><Target size={24} /></div>
                                    <h3 className="stat-title">Total Sales Overview</h3>
                                </div>
                                <div className="stat-row"><span>Total Selling Amount:</span><span className="stat-value">Rs. {totalSalesAmount.toLocaleString()}</span></div>
                                <div className="stat-row"><span>Cash Received:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {totalCashPaid.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>Given on Credit:</span><span className="stat-value" style={{ color: totalCreditGiven > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>Rs. {totalCreditGiven.toLocaleString()}</span></div>
                            </div>

                            {/* Payment Method Split */}
                            <div className="stat-card-premium green">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper"><CreditCard size={24} /></div>
                                    <h3 className="stat-title">Payment Method Split</h3>
                                </div>
                                <div className="stat-row"><span>💵 Cash Received:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {cashReceived.toLocaleString()}</span></div>
                                <div className="stat-row"><span>📱 Online Received:</span><span className="stat-value" style={{ color: '#38bdf8' }}>Rs. {onlineReceived.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>Total Collected:</span><span className="stat-value">Rs. {(cashReceived + onlineReceived).toLocaleString()}</span></div>
                            </div>

                            {/* Profit */}
                            <div className="stat-card-premium" style={{ '--card-accent': '#10b981', '--border-hover': 'rgba(16,185,129,0.4)' }}>
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper"><TrendingUp size={24} /></div>
                                    <h3 className="stat-title">Today's Profit</h3>
                                </div>
                                <div className="stat-row"><span>Product Margin Profit:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {totalProfit.toLocaleString()}</span></div>
                                <div className="stat-row"><span>Less Returns:</span><span className="stat-value" style={{ color: 'var(--danger)' }}>- Rs. {totalReturnsAmount.toLocaleString()}</span></div>
                                <div className="stat-row highlight">
                                    <span style={{ fontWeight: 700 }}>Net Real Profit:</span>
                                    <span className="stat-value" style={{ color: netRealProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.2rem' }}>Rs. {netRealProfit.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Supplier / Stock Purchased */}
                            <div className="stat-card-premium purple">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper"><ShoppingCart size={24} /></div>
                                    <h3 className="stat-title">Stock Purchased (Saman Daala)</h3>
                                </div>
                                <div className="stat-row"><span>Total Bill (Purchases):</span><span className="stat-value">Rs. {supplierTotalAmount.toLocaleString()}</span></div>
                                <div className="stat-row"><span>Cash Paid:</span><span className="stat-value" style={{ color: 'var(--success)' }}>Rs. {supplierTotalPaid.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>Owed to Suppliers:</span><span className="stat-value" style={{ color: totalCreditToSuppliers > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>Rs. {totalCreditToSuppliers.toLocaleString()}</span></div>
                            </div>

                            {/* Returns */}
                            <div className="stat-card-premium red">
                                <div className="stat-header">
                                    <div className="stat-icon-wrapper"><Package size={24} /></div>
                                    <h3 className="stat-title">Returns Overview</h3>
                                </div>
                                <div className="stat-row"><span>Total Returns Value:</span><span className="stat-value">Rs. {totalReturnsAmount.toLocaleString()}</span></div>
                                <div className="stat-row highlight"><span>Total Items Returned:</span><span className="stat-value">{totalReturnsQty}</span></div>
                            </div>
                        </div>

                        {/* Activity Lists */}
                        <div className="report-hero-stats" style={{ marginBottom: '40px' }}>
                            <div className="premium-list-container">
                                <div className="premium-list-header">
                                    <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-primary)', boxShadow: 'none' }}><Package size={20} /></div>
                                    <h3>New Products ({productsToday.length})</h3>
                                </div>
                                {productsToday.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '10px 0' }}>No new products added today.</p> : (
                                    <ul className="premium-list">{productsToday.map((p, i) => <li key={i} className="premium-list-item"><strong>{p.name}</strong></li>)}</ul>
                                )}
                            </div>
                            <div className="premium-list-container">
                                <div className="premium-list-header">
                                    <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', boxShadow: 'none' }}><Target size={20} /></div>
                                    <h3>New Customers ({buyersToday.length})</h3>
                                </div>
                                {buyersToday.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '10px 0' }}>No new customers today.</p> : (
                                    <ul className="premium-list">{buyersToday.map((b, i) => <li key={i} className="premium-list-item"><strong>{b.name}</strong> <span style={{ color: 'var(--text-muted)' }}>{b.company_name ? `(${b.company_name})` : ''}</span></li>)}</ul>
                                )}
                            </div>
                            <div className="premium-list-container">
                                <div className="premium-list-header">
                                    <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', boxShadow: 'none' }}><Truck size={20} /></div>
                                    <h3>New Suppliers ({suppliersToday.length})</h3>
                                </div>
                                {suppliersToday.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '10px 0' }}>No new suppliers today.</p> : (
                                    <ul className="premium-list">{suppliersToday.map((s, i) => <li key={i} className="premium-list-item"><strong>{s.name}</strong> <span style={{ color: 'var(--text-muted)' }}>{s.company_name ? `(${s.company_name})` : ''}</span></li>)}</ul>
                                )}
                            </div>
                        </div>

                        {/* Returns Log */}
                        {returnsToday.length > 0 && (
                            <div className="premium-list-container" style={{ marginBottom: '40px', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.05) 0%, transparent 100%)' }}>
                                <div className="premium-list-header" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                                    <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', boxShadow: 'none' }}><Package size={20} /></div>
                                    <h3 style={{ color: 'var(--danger)' }}>Goods Returned Today ({returnsToday.length})</h3>
                                </div>
                                <ul className="premium-list">
                                    {returnsToday.map((r, i) => (
                                        <li key={i} className="premium-list-item">
                                            <strong style={{ color: 'var(--danger)' }}>{r.product_name}</strong>
                                            <span style={{ color: 'var(--text-secondary)' }}>- Qty: {r.quantity}</span>
                                            <span style={{ color: 'var(--text-primary)', marginLeft: '8px', fontWeight: 600 }}>(Refunded: Rs.{Number(r.total_amount).toLocaleString()})</span>
                                            {r.buyer_name && <span style={{ marginLeft: 'auto', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-muted)' }}>from {r.buyer_name}</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product-Wise Profit Table */}
                        {productProfitList.length > 0 && (
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                                    <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', boxShadow: 'none' }}><TrendingUp size={20} /></div>
                                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>Product-Wise Profit Today</h3>
                                </div>
                                <ScrollableTable className="premium-table-wrap">
                                    <table className="premium-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th style={{ textAlign: 'center' }}>Qty</th>
                                                <th style={{ textAlign: 'right' }}>Sale Rate</th>
                                                <th style={{ textAlign: 'right' }}>Buy Rate</th>
                                                <th style={{ textAlign: 'right' }}>Profit/Unit</th>
                                                <th style={{ textAlign: 'right' }}>Total Revenue</th>
                                                <th style={{ textAlign: 'right' }}>Total Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productProfitList.map((p, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.qty}</td>
                                                    <td style={{ textAlign: 'right' }}>Rs. {p.saleRate.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>Rs. {p.purchaseRate.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: (p.saleRate - p.purchaseRate) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                                        Rs. {(p.saleRate - p.purchaseRate).toLocaleString()}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>Rs. {p.revenue.toLocaleString()}</td>
                                                    <td style={{ textAlign: 'right', color: p.profit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                                        Rs. {p.profit.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ borderTop: '2px solid var(--glass-border)', fontWeight: 700 }}>
                                                <td>Grand Total</td>
                                                <td style={{ textAlign: 'center' }}>{productProfitList.reduce((s, p) => s + p.qty, 0)}</td>
                                                <td colSpan={3}></td>
                                                <td style={{ textAlign: 'right' }}>Rs. {productProfitList.reduce((s, p) => s + p.revenue, 0).toLocaleString()}</td>
                                                <td style={{ textAlign: 'right', color: 'var(--success)' }}>Rs. {productProfitList.reduce((s, p) => s + p.profit, 0).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </ScrollableTable>
                            </div>
                        )}

                        {/* Detailed Sales Log */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                                <div className="stat-icon-wrapper" style={{ width: 40, height: 40, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-primary)', boxShadow: 'none' }}><CreditCard size={20} /></div>
                                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>Detailed Sales Log ({salesToday.length} records)</h3>
                            </div>
                            {salesToday.length === 0 ? (
                                <div className="premium-list-container" style={{ padding: '40px', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>No sales recorded today.</p>
                                </div>
                            ) : (
                                <ScrollableTable className="premium-table-wrap">
                                    <table className="premium-table">
                                        <thead>
                                            <tr>
                                                <th>Customer</th>
                                                <th>Product Info</th>
                                                <th>Qty</th>
                                                <th>Total Amount</th>
                                                <th>Paid Amount</th>
                                                <th>Method</th>
                                                <th>Profit</th>
                                                <th>Condition</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salesToday.map((sale, i) => {
                                                const total = Number(sale.total_amount || 0);
                                                const paid = Number(sale.paid_amount || 0);
                                                const credit = total - paid;
                                                const saleRate = Number(sale.products?.price || 0);
                                                const purchaseRate = Number(sale.products?.purchase_rate || 0);
                                                const qty = Number(sale.quantity || 0);
                                                const saleProfit = (saleRate - purchaseRate) * qty;
                                                return (
                                                    <tr key={i}>
                                                        <td>{sale.buyer_name || sale.buyers?.name || 'Walk-in Customer'}</td>
                                                        <td><div style={{ fontWeight: 500 }}>{sale.products?.name || `Product ID ${sale.product_id}`}</div></td>
                                                        <td>{sale.quantity}</td>
                                                        <td style={{ fontWeight: 600 }}>Rs. {total.toLocaleString()}</td>
                                                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs. {paid.toLocaleString()}</td>
                                                        <td>
                                                            <span style={{ fontSize: '0.8em', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, background: sale.payment_method === 'Online' ? 'rgba(56,189,248,0.15)' : (sale.payment_method === 'Split' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)'), color: sale.payment_method === 'Online' ? '#0369a1' : (sale.payment_method === 'Split' ? '#b45309' : '#166534') }}>{sale.payment_method || 'Cash'}</span>
                                                            {sale.payment_method === 'Split' && (
                                                                <div style={{ fontSize: '0.7em', color: 'var(--text-muted)', marginTop: '4px' }}>C: {sale.cash_amount} | O: {sale.online_amount}</div>
                                                            )}
                                                        </td>
                                                        <td style={{ color: saleProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                                            Rs. {saleProfit.toLocaleString()}
                                                        </td>
                                                        <td>
                                                            {credit > 0 ? (
                                                                <span style={{ color: 'var(--danger)', fontWeight: 600, background: 'rgba(239, 68, 68, 0.15)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>Credit: Rs. {credit.toLocaleString()}</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--success)', fontWeight: 600, background: 'rgba(34, 197, 94, 0.15)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>Clear</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </ScrollableTable>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: '50px', paddingTop: '24px', borderTop: '2px solid var(--border-color)', textAlign: 'center', color: 'var(--text-primary)' }}>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>Software Developed by Hassan Ali Abrar</h3>
                            <p style={{ margin: '0 0 6px', fontSize: '0.95rem' }}>Instagram: <strong style={{ color: 'var(--info)' }}>hassan.secure</strong> | WhatsApp: <strong style={{ color: 'var(--success)' }}>+92 348 5055098</strong></p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact for custom software development, business automation, and IT solutions.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyReport;
