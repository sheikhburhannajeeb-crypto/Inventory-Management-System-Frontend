import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Building2, CreditCard, ChevronDown, ChevronUp, X } from 'lucide-react';

const Companies = () => {
    const [buyers, setBuyers] = useState([]);
    const [allSales, setAllSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [payModal, setPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [paying, setPaying] = useState(false);

    useEffect(() => { fetchBuyers(); fetchSales(); }, []);

    const fetchBuyers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('inventory_token');
            const res = await axios.get('/api/buyers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBuyers(res.data);
        } catch (err) {
            console.error('Failed to fetch buyers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = async () => {
        try {
            const token = localStorage.getItem('inventory_token');
            const res = await axios.get('/api/sales', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllSales(res.data);
        } catch (err) {
            console.error('Failed to fetch sales:', err);
        }
    };

    // Build companyMap from BOTH buyers (udhaar) AND direct buyer_transactions (original bills)
    const companyMap = {};

    // Source 1: Buyers who have a company_name
    buyers.forEach(buyer => {
        const company = buyer.company_name?.trim();
        if (!company) return;
        if (!companyMap[company]) companyMap[company] = { buyers: [], txns: [] };
        companyMap[company].buyers.push(buyer);
        // Add their buyer_transactions into the unified txn list
        (buyer.buyer_transactions || []).forEach(txn => {
            companyMap[company].txns.push({
                ...txn,
                buyerName: buyer.name,
                buyerPhone: buyer.phone
            });
        });
    });

    // Source 2: buyer_transactions that have company_name directly (original bills without a buyer record, or future records)
    allSales.forEach(sale => {
        const company = sale.company_name?.trim();
        if (!company) return;
        // Check if this txn is already added via the buyer source
        const alreadyAdded = companyMap[company]?.txns.some(t => t.id === sale.id);
        if (!companyMap[company]) companyMap[company] = { buyers: [], txns: [] };
        if (!alreadyAdded) {
            companyMap[company].txns.push({
                ...sale,
                products: sale.products,
                buyerName: sale.buyers?.name || sale.buyer_name || '—',
                buyerPhone: sale.buyers?.phone || '—'
            });
        }
    });

    const companyList = Object.entries(companyMap)
        .filter(([name]) => name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort(([a], [b]) => a.localeCompare(b));

    // Totals for a company (from its unified txns list)
    const getCompanyTotals = (txns) => {
        let total = 0, paid = 0;
        txns.forEach(txn => {
            total += Number(txn.total_amount || 0);
            paid += Number(txn.paid_amount || 0);
        });
        return { total, paid, remaining: total - paid };
    };

    const openPayModal = (txn, buyerName) => {
        setPayAmount('');
        setPayModal({ txn, buyerName });
    };

    const handlePay = async () => {
        const amt = Number(payAmount);
        if (!amt || amt <= 0) { alert('Enter a valid amount.'); return; }
        const remaining = Number(payModal.txn.total_amount) - Number(payModal.txn.paid_amount);
        if (amt > remaining) { alert(`Cannot pay more than remaining: Rs. ${remaining}`); return; }

        try {
            setPaying(true);
            const token = localStorage.getItem('inventory_token');
            await axios.put(`/api/sales/${payModal.txn.id}`, { add_payment: amt }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`Payment of Rs. ${amt} recorded successfully!`);
            setPayModal(null);
            fetchBuyers();
            fetchSales();
        } catch (err) {
            alert(err.response?.data?.error || 'Payment failed.');
        } finally {
            setPaying(false);
        }
    };

    // Grand totals across all companies
    const grandTotals = (() => {
        let total = 0, paid = 0;
        Object.values(companyMap).forEach(({ txns }) => {
            txns.forEach(txn => {
                total += Number(txn.total_amount || 0);
                paid += Number(txn.paid_amount || 0);
            });
        });
        return { total, paid, remaining: total - paid };
    })();

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Companies Ledger</h1>
                    <p className="page-subtitle">Company-wise udhaar accounts and payment tracking</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-row" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-card glass-panel flex-1">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(56,189,248,0.1)' }}>
                        <Building2 size={24} color="#38bdf8" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Companies</p>
                        <h2 className="stat-value">{Object.keys(companyMap).length}</h2>
                    </div>
                </div>
                <div className="stat-card glass-panel flex-1">
                    <div className="stat-icon-wrapper" style={{ background: 'rgba(239,68,68,0.1)' }}>
                        <CreditCard size={24} color="#ef4444" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Total Outstanding (All Companies)</p>
                        <h2 className="stat-value" style={{ color: grandTotals.remaining > 0 ? '#ef4444' : '#4ade80' }}>
                            Rs. {grandTotals.remaining.toLocaleString()}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="table-container glass-panel">
                <div className="table-header-controls">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            placeholder="Search companies..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state text-center py-8">Loading companies...</div>
                ) : companyList.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                        No companies found. Add a company name when creating a bill.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
                        {companyList.map(([companyName, companyData]) => {
                            const { txns } = companyData;
                            const totals = getCompanyTotals(txns);
                            const isOpen = selectedCompany === companyName;
                            const uniqueCustomers = new Set(txns.map(t => t.buyerName).filter(Boolean)).size;

                            return (
                                <div key={companyName} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                                    {/* Company Header Row */}
                                    <div
                                        onClick={() => setSelectedCompany(isOpen ? null : companyName)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '16px 20px', cursor: 'pointer',
                                            background: isOpen ? 'rgba(56,189,248,0.08)' : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: '10px',
                                                background: 'rgba(56,189,248,0.15)', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Building2 size={20} color="#38bdf8" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                    {companyName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {uniqueCustomers} customer{uniqueCustomers !== 1 ? 's' : ''} · {txns.length} transaction{txns.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</div>
                                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: totals.remaining > 0 ? '#ef4444' : '#4ade80' }}>
                                                    Rs. {totals.remaining.toLocaleString()}
                                                </div>
                                            </div>
                                            {isOpen ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                                        </div>
                                    </div>

                                    {/* Expanded: transactions table */}
                                    {isOpen && (
                                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '0 4px 8px' }}>
                                            {/* Summary bar */}
                                            <div style={{ display: 'flex', gap: '16px', padding: '12px 16px', background: 'rgba(0,0,0,0.2)' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Total Billed: <strong style={{ color: 'var(--text-primary)' }}>Rs. {totals.total.toLocaleString()}</strong>
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Total Paid: <strong style={{ color: '#4ade80' }}>Rs. {totals.paid.toLocaleString()}</strong>
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Remaining: <strong style={{ color: totals.remaining > 0 ? '#ef4444' : '#4ade80' }}>Rs. {totals.remaining.toLocaleString()}</strong>
                                                </span>
                                            </div>

                                            {txns.length === 0 ? (
                                                <div className="text-center py-4 text-muted">No transactions recorded for this company.</div>
                                            ) : (
                                                <div className="table-wrapper" style={{ padding: '8px' }}>
                                                    <table className="custom-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Customer</th>
                                                                <th>Phone</th>
                                                                <th>Product</th>
                                                                <th>Qty</th>
                                                                <th>Total</th>
                                                                <th>Paid</th>
                                                                <th>Remaining</th>
                                                                <th>Date</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {txns.map(txn => {
                                                                const rem = Number(txn.total_amount || 0) - Number(txn.paid_amount || 0);
                                                                return (
                                                                    <tr key={txn.id} className="animate-fade-in">
                                                                        <td>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                <div style={{
                                                                                    width: 28, height: 28, borderRadius: '50%',
                                                                                    background: 'rgba(139,92,246,0.2)',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa'
                                                                                }}>
                                                                                    {txn.buyerName?.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <span style={{ fontWeight: 500 }}>{txn.buyerName}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{txn.buyerPhone || '-'}</td>
                                                                        <td style={{ fontWeight: 500 }}>{txn.products?.name || `Product #${txn.product_id}`}</td>
                                                                        <td>{txn.quantity}</td>
                                                                        <td>Rs. {Number(txn.total_amount).toLocaleString()}</td>
                                                                        <td style={{ color: '#4ade80' }}>Rs. {Number(txn.paid_amount).toLocaleString()}</td>
                                                                        <td>
                                                                            <span className={`qty-badge ${rem > 0 ? 'low-stock' : 'in-stock'}`}>
                                                                                Rs. {rem.toLocaleString()}
                                                                            </span>
                                                                        </td>
                                                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                                            {txn.purchase_date ? new Date(txn.purchase_date).toLocaleDateString() : '-'}
                                                                        </td>
                                                                        <td>
                                                                            {rem > 0 ? (
                                                                                <button
                                                                                    className="btn-primary"
                                                                                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                                                    onClick={() => openPayModal(txn, txn.buyerName)}
                                                                                >
                                                                                    Pay
                                                                                </button>
                                                                            ) : (
                                                                                <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>✓ Cleared</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {payModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h2>Record Payment</h2>
                            <button className="icon-btn-small" onClick={() => setPayModal(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Customer</p>
                                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{payModal.buyerName}</p>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Total: <strong>Rs. {Number(payModal.txn.total_amount).toLocaleString()}</strong>
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Already Paid: <strong style={{ color: '#4ade80' }}>Rs. {Number(payModal.txn.paid_amount).toLocaleString()}</strong>
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                                        Remaining: <strong>Rs. {(Number(payModal.txn.total_amount) - Number(payModal.txn.paid_amount)).toLocaleString()}</strong>
                                    </span>
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Amount to Pay (Rs)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Enter amount..."
                                    min="1"
                                    max={Number(payModal.txn.total_amount) - Number(payModal.txn.paid_amount)}
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
                            <button
                                className="btn-primary"
                                style={{ background: '#22c55e', borderColor: '#22c55e' }}
                                onClick={handlePay}
                                disabled={paying}
                            >
                                {paying ? 'Saving...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Companies;
