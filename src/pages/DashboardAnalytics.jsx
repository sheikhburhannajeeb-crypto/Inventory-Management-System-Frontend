import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { RefreshCw, BarChart2, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { notifyError } from '../utils/notifications';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import CustomDatePicker from '../components/CustomDatePicker';
import './DashboardAnalytics.css';

const API_URL = '/api/reports/monthly';

const DashboardAnalytics = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState(currentDate.toISOString().split('T')[0]);

    const filterYear = new Date(selectedDate).getFullYear().toString();
    const filterMonth = String(new Date(selectedDate).getMonth() + 1).padStart(2, '0');

    useEffect(() => {
        fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterYear, filterMonth]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`${API_URL}?year=${filterYear}&month=${filterMonth}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            notifyError('Failed to load dashboard data');
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

    const { summary, daily_breakdown, company_wise_summary } = reportData;

    // Formatting daily breakdown for the charts
    const chartData = (daily_breakdown || []).map(day => ({
        date: new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        Sales: day.total_sales || 0,
        Expenses: day.expenses || 0,
        Profit: day.daily_profit || 0
    }));

    // Data for Company-wise bar chart
    const companyChartData = (company_wise_summary || []).slice(0, 5).map(c => ({
        name: c.company_name === 'Walk-in / No Company' ? 'Walk-in' : c.company_name,
        Sales: c.total_sales || 0,
        Collected: c.total_collected || 0
    }));

    return (
        <div className="dashboard-container page-container fade-in">
            <header className="page-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 className="page-title">Dashboard Analytics</h1>
                    <p className="page-subtitle">Visualize your financial performance</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CustomDatePicker value={selectedDate} onChange={setSelectedDate} label="SELECT MONTH" />
                </div>
            </header>

            {/* Quick Summary Cards */}
            <div className="analytics-hero-stats">
                <div className="stat-card-premium blue">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><TrendingUp size={24} /></div>
                        <h3 className="stat-title">Total Monthly Sales</h3>
                    </div>
                    <div className="stat-row highlight">
                        <span className="stat-value" style={{ fontSize: '1.5rem', color: '#38bdf8' }}>
                            Rs. {summary.total_sales_created_value.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="stat-card-premium red">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><Activity size={24} /></div>
                        <h3 className="stat-title">Total Expenses</h3>
                    </div>
                    <div className="stat-row highlight">
                        <span className="stat-value" style={{ fontSize: '1.5rem', color: '#ef4444' }}>
                            Rs. {summary.total_expenses.toLocaleString()}
                        </span>
                    </div>
                </div>

                <div className="stat-card-premium green">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper"><DollarSign size={24} /></div>
                        <h3 className="stat-title">Net Real Profit</h3>
                    </div>
                    <div className="stat-row highlight">
                        <span className="stat-value" style={{ fontSize: '1.5rem', color: '#10b981' }}>
                            Rs. {summary.net_real_profit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Daily Graph Area */}
            <div className="chart-section" style={{ marginTop: '30px' }}>
                <h3 className="chart-title"><BarChart2 size={20} /> Daily Sales vs Expenses</h3>
                <div className="chart-wrapper">
                    {chartData.length === 0 ? (
                        <div className="no-data-msg">No data this month</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickFormatter={(value) => `Rs.${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px' }}
                                    itemStyle={{ fontWeight: 600 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="Sales" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Bottom Row Charts */}
            <div className="bottom-charts-grid" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                
                {/* Daily Profit Bar Chart */}
                <div className="chart-section">
                    <h3 className="chart-title"><TrendingUp size={20} /> Daily Profit Trend</h3>
                    <div className="chart-wrapper">
                        {chartData.length === 0 ? (
                            <div className="no-data-msg">No data this month</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                                    <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                                    <Tooltip 
                                        cursor={{fill: 'var(--glass-border)'}}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Companies Chart */}
                <div className="chart-section">
                    <h3 className="chart-title"><Activity size={20} /> Top Companies by Sales</h3>
                    <div className="chart-wrapper">
                        {companyChartData.length === 0 ? (
                            <div className="no-data-msg">No companies data</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={companyChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} />
                                    <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)', fontSize: 12}} width={100} />
                                    <Tooltip 
                                        cursor={{fill: 'var(--glass-border)'}}
                                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--glass-border)', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="Collected" fill="#10b981" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default DashboardAnalytics;
