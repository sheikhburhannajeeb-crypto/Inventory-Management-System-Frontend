import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Package, SlidersHorizontal, Edit, Trash2, X } from 'lucide-react';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [suppliersList, setSuppliersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        category: '',
        price: '',
        purchase_rate: '',
        max_discount: '',
        purchased_from: '',
        purchase_date: '',
        total_quantity: '',
        add_quantity: '',
        quantity_unit: 'Per Unit'
    });

    useEffect(() => {
        fetchProducts();
        fetchSuppliers();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('inventory_token');
            const response = await axios.get('/api/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('inventory_token');
            const response = await axios.get('/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuppliersList(response.data);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const token = localStorage.getItem('inventory_token');
            await axios.delete(`/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Failed to delete product.');
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setSupplierSearch('');
        setShowSupplierDropdown(false);
        setFormData({
            id: null,
            name: '',
            category: '',
            price: '',
            purchase_rate: '',
            max_discount: '',
            purchased_from: '',
            purchase_date: new Date().toISOString().split('T')[0],
            total_quantity: '',
            add_quantity: '',
            quantity_unit: 'Per Unit'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setSupplierSearch(product.purchased_from || '');
        setShowSupplierDropdown(false);
        setFormData({
            id: product.id,
            name: product.name,
            category: product.category || '',
            price: product.price,
            purchase_rate: product.purchase_rate || '',
            max_discount: product.max_discount || '',
            purchased_from: product.purchased_from || '',
            purchase_date: product.purchase_date ? new Date(product.purchase_date).toISOString().split('T')[0] : '',
            total_quantity: product.total_quantity,
            add_quantity: '',
            quantity_unit: product.quantity_unit || 'Per Unit'
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowSupplierDropdown(false);
    };

    const handleSupplierSelect = (supplierName) => {
        setSupplierSearch(supplierName);
        setFormData(prev => ({ ...prev, purchased_from: supplierName }));
        setShowSupplierDropdown(false);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (formData.purchase_rate !== '' && formData.purchase_rate !== null) {
            const pr = parseFloat(formData.purchase_rate);
            const sp = parseFloat(formData.price);
            if (pr < 0) {
                alert('Purchase rate cannot be negative.');
                return;
            }
            if (pr > sp) {
                alert('Purchase rate cannot be greater than sale price.');
                return;
            }
        }

        try {
            const token = localStorage.getItem('inventory_token');
            const dataToSubmit = {
                ...formData,
                price: parseFloat(formData.price),
                purchase_rate: formData.purchase_rate ? parseFloat(formData.purchase_rate) : null,
                max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
                total_quantity: parseInt(formData.total_quantity, 10),
                add_quantity: formData.add_quantity ? parseInt(formData.add_quantity, 10) : 0,
            };

            if (modalMode === 'add') {
                const response = await axios.post('/api/products', dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Optimistically fetch again to get accurate remaining_quantity etc.
                fetchProducts();
            } else {
                const response = await axios.put(`/api/products/${formData.id}`, dataToSubmit, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchProducts();
            }
            closeModal();
        } catch (err) {
            console.error('Error saving product:', err);
            alert(err.response?.data?.error || 'Failed to save product.');
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        let matchesCategory = true;
        const remaining = Number(product.remaining_quantity || 0);

        if (activeCategory === 'Low Stock') {
            matchesCategory = remaining > 0 && remaining <= 10;
        } else if (activeCategory === 'Out of Stock') {
            matchesCategory = remaining === 0;
        } else if (activeCategory !== 'All') {
            matchesCategory = product.category === activeCategory;
        }

        return matchesSearch && matchesCategory;
    });

    const categories = ['All', 'Paint', 'Electric', 'Hardware', 'Out of Stock'];

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Products Inventory</h1>
                    <p className="page-subtitle">Manage and track your supplies</p>
                </div>
                <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
                    <Plus size={20} />
                    <span>Add Product</span>
                </button>
            </div>

            <div className="controls-bar glass-panel">
                <div className="search-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="category-tabs flex-1" style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '20px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: activeCategory === cat ? 'var(--accent-primary)' : 'transparent',
                                color: activeCategory === cat ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <button className="icon-btn" title="Filter options">
                    <SlidersHorizontal size={20} />
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="table-container glass-panel">
                {loading ? (
                    <div className="loading-state">Loading products...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} className="empty-icon" />
                        <h3>No products found</h3>
                        <p>Try adjusting your search or add a new product</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Sale Price</th>
                                <th>Purchase Rate</th>
                                <th>Max Discount</th>
                                <th>Unit</th>
                                <th>Purchased From</th>
                                <th>Purchase Date</th>
                                <th>Total Qty</th>
                                <th>Remaining Qty</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => {
                                const remaining = Number(product.remaining_quantity || 0);
                                let rowStyle = {};
                                if (remaining === 0) {
                                    rowStyle = { borderLeft: '4px solid #ef4444' };
                                } else if (remaining < 20) {
                                    rowStyle = { borderLeft: '4px solid #eab308' };
                                }
                                
                                return (
                                <tr key={product.id} className="animate-fade-in" style={rowStyle}>
                                    <td>{product.id}</td>
                                    <td className="font-medium">{product.name}</td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {product.category || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td>Rs. {product.price}</td>
                                    <td>{product.purchase_rate ? `Rs. ${product.purchase_rate}` : '-'}</td>
                                    <td>{product.max_discount ? `Rs. ${product.max_discount}` : '-'}</td>
                                    <td>
                                        <span className="badge" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            {product.quantity_unit || 'Per Unit'}
                                        </span>
                                    </td>
                                    <td>{product.purchased_from || '-'}</td>
                                    <td>{product.purchase_date ? new Date(product.purchase_date).toLocaleDateString() : '-'}</td>
                                    <td>{product.total_quantity}</td>
                                    <td>
                                        <span className="qty-badge" style={{ backgroundColor: remaining === 0 ? 'rgba(239, 68, 68, 0.1)' : (remaining < 20 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)'), color: remaining === 0 ? '#ef4444' : (remaining < 20 ? '#ca8a04' : '#22c55e'), padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                            {remaining}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="icon-btn-small text-accent"
                                                title="Edit"
                                                onClick={() => openEditModal(product)}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                className="icon-btn-small text-danger"
                                                title="Delete"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel animate-fade-in">
                        <div className="modal-header">
                            <h2>{modalMode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
                            <button className="icon-btn-small" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleFormSubmit} className="modal-body">
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Category</label>
                                    <select
                                        className="input-field minimal-select"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        <option value="Paint">Paint</option>
                                        <option value="Electric">Electric</option>
                                        <option value="Hardware">Hardware</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Sale Price (Rs)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleFormChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Purchase Rate (Rs)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        name="purchase_rate"
                                        value={formData.purchase_rate}
                                        onChange={handleFormChange}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Quantity Unit</label>
                                    <select
                                        className="input-field minimal-select"
                                        name="quantity_unit"
                                        value={formData.quantity_unit}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="Per Unit">Per Unit</option>
                                        <option value="Per Kilo">Per Kilo</option>
                                        <option value="Per Dozen">Per Dozen</option>
                                        <option value="Per Liter">Per Liter</option>
                                        <option value="Per Ft">Per Ft</option>
                                        <option value="Per Meter">Per Meter</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Max Discount (Rs)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        name="max_discount"
                                        value={formData.max_discount}
                                        onChange={handleFormChange}
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>{modalMode === 'add' ? 'Total Quantity' : 'Current Total Quantity'}</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        name="total_quantity"
                                        value={formData.total_quantity}
                                        onChange={handleFormChange}
                                        min="1"
                                        required
                                        disabled={modalMode === 'edit'}
                                        style={modalMode === 'edit' ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}
                                    />
                                </div>
                                {modalMode === 'edit' && (
                                    <div className="input-group">
                                        <label>Add Quantity (+)</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            name="add_quantity"
                                            value={formData.add_quantity}
                                            onChange={handleFormChange}
                                            min="0"
                                            placeholder="Leave empty to not change"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Purchase Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        name="purchase_date"
                                        value={formData.purchase_date}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Purchased From (Supplier)</label>
                                <div className="custom-searchable-dropdown">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Search or enter supplier name..."
                                        name="purchased_from"
                                        value={supplierSearch}
                                        onChange={(e) => {
                                            setSupplierSearch(e.target.value);
                                            setFormData(prev => ({ ...prev, purchased_from: e.target.value }));
                                            setShowSupplierDropdown(true);
                                        }}
                                        onClick={() => setShowSupplierDropdown(true)}
                                    />
                                    {showSupplierDropdown && (
                                        <div className="dropdown-options glass-panel">
                                            {suppliersList
                                                .filter(s => (s.name + (s.company_name ? ` ${s.company_name}` : '')).toLowerCase().includes(supplierSearch.toLowerCase()))
                                                .map(s => (
                                                    <div
                                                        key={s.id}
                                                        className="dropdown-option"
                                                        onClick={() => handleSupplierSelect(s.name)}
                                                    >
                                                        {s.name} {s.company_name ? `(${s.company_name})` : ''}
                                                    </div>
                                                ))}
                                            {suppliersList.filter(s => (s.name + (s.company_name ? ` ${s.company_name}` : '')).toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                                                <div className="dropdown-option text-muted">Press enter to use "{supplierSearch}"</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn-primary">
                                    {modalMode === 'add' ? 'Save Product' : 'Update Product'}
                                </button>
                            </div>
                        </form>
                    </div >
                </div >
            )}
        </div >
    );
};

export default Products;
