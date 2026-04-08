import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Upload, Download, Trash2, FileText, FileSpreadsheet, File, Image,
    Search, Building2, User as UserIcon, X, CheckCircle, AlertCircle,
    FolderOpen, Plus, Clock, SortAsc, Loader2, Globe, Lock
} from 'lucide-react';
import { api } from '../utils/api';

const COMPANY_CATEGORIES = ['General', 'Policy', 'HR', 'Finance', 'Onboarding', 'Compliance', 'Templates'];
const PERSONAL_CATEGORIES = ['Personal', 'Sick Certificate', 'ID Document', 'Contract', 'Payslip', 'Other'];

function getFileInfo(filename, originalName) {
    const name = (originalName || filename || '').toLowerCase();
    if (name.endsWith('.pdf'))
        return { Icon: FileText, color: '#e55a4e', bg: 'rgba(229,90,78,0.1)', label: 'PDF' };
    if (name.endsWith('.xlsx') || name.endsWith('.xls'))
        return { Icon: FileSpreadsheet, color: '#27ae60', bg: 'rgba(39,174,96,0.1)', label: 'Excel' };
    if (name.endsWith('.csv'))
        return { Icon: FileSpreadsheet, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'CSV' };
    if (name.endsWith('.doc') || name.endsWith('.docx'))
        return { Icon: FileText, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Word' };
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg'))
        return { Icon: Image, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Image' };
    return { Icon: File, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'File' };
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const API_BASE = typeof window !== 'undefined'
    ? (import.meta?.env?.VITE_BACKEND_URL || 'https://thesl-backend.onrender.com')
    : '';

export default function Documents({ user, token }) {
    const [activeTab, setActiveTab] = useState('company');
    const [companyDocs, setCompanyDocs] = useState([]);
    const [myDocs, setMyDocs] = useState([]);

    // Upload state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const fileInputRef = useRef(null);

    // UI state
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [deleting, setDeleting] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const isAdminOrManager = user.role === 'admin' || user.role === 'manager';

    const fetchDocuments = useCallback(async () => {
        setLoadError('');
        try {
            const res = await api.get('/api/documents', token);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Backward compat: docs without user_email treated as company docs
                const company = data.filter(d =>
                    !d.user_email ||
                    d.is_company_doc === true ||
                    d.is_company_doc === 1 ||
                    d.is_company_doc === null ||
                    d.is_company_doc === undefined
                );
                const personal = data.filter(d =>
                    d.user_email && (d.is_company_doc === false || d.is_company_doc === 0)
                );
                setCompanyDocs(company);
                setMyDocs(personal);
            }
        } catch (err) {
            setLoadError('Failed to load documents. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    // Reset category default when tab changes
    useEffect(() => {
        setCategory(activeTab === 'company' ? 'General' : 'Personal');
        setFilterCategory('All');
        setFilterType('All');
        setSearchQuery('');
    }, [activeTab]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) {
            setFile(dropped);
            if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ''));
        }
    };

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''));
        }
    };

    const clearUploadForm = () => {
        setTitle('');
        setFile(null);
        setCategory(activeTab === 'company' ? 'General' : 'Personal');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadProgress(0);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('file', file);

        setStatus({ type: 'info', message: 'Uploading your document…' });

        const progressInterval = setInterval(() => {
            setUploadProgress(p => Math.min(p + 12, 88));
        }, 200);

        try {
            const res = await api.upload('/api/documents/upload', formData, token);
            clearInterval(progressInterval);
            setUploadProgress(100);

            if (res.ok) {
                setTimeout(() => {
                    setStatus({ type: 'success', message: 'Document uploaded successfully!' });
                    clearUploadForm();
                    setShowUpload(false);
                    fetchDocuments();
                    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
                }, 400);
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus({ type: 'error', message: data.message || 'Upload failed. Please try again.' });
                setUploadProgress(0);
            }
        } catch {
            clearInterval(progressInterval);
            setStatus({ type: 'error', message: 'Network error. Please check your connection.' });
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (doc) => {
        fetch(`${API_BASE}/api/documents/download/${doc.filename}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.original_name || doc.filename;
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(() => window.open(`${API_BASE}/api/documents/download/${doc.filename}`, '_blank'));
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
        setDeleting(docId);
        try {
            const res = await api.delete(`/api/documents/${docId}`, token);
            if (res.ok) {
                fetchDocuments();
            } else {
                const d = await res.json().catch(() => ({}));
                alert(d.message || 'Failed to delete document.');
            }
        } catch {
            alert('Network error.');
        } finally {
            setDeleting(null);
        }
    };

    // Active docs for current tab
    const activeDocs = activeTab === 'company' ? companyDocs : myDocs;
    const allCategories = [...new Set(activeDocs.map(d => d.category || 'General').filter(Boolean))];

    let filtered = activeDocs.filter(doc => {
        const fi = getFileInfo(doc.filename, doc.original_name);
        const matchCat = filterCategory === 'All' || (doc.category || 'General') === filterCategory;
        const matchType = filterType === 'All' || fi.label === filterType;
        const matchSearch = !searchQuery
            || (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase())
            || (doc.uploaded_by || '').toLowerCase().includes(searchQuery.toLowerCase())
            || (doc.category || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchType && matchSearch;
    });

    filtered = [...filtered].sort((a, b) => {
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
        if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
        if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
        return 0;
    });

    const totalSize = [...companyDocs, ...myDocs].reduce((s, d) => s + (d.size || 0), 0);
    const myPersonalCount = myDocs.filter(d => d.user_email === user.email).length;

    const canDelete = (doc) => {
        if (user.role === 'admin') return true;
        return doc.user_email === user.email;
    };

    const categories = activeTab === 'company' && isAdminOrManager
        ? COMPANY_CATEGORIES
        : PERSONAL_CATEGORIES;

    // Status banner colours
    const statusStyles = {
        success: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
        error: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
        info: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    };
    const ss = statusStyles[status.type] || statusStyles.info;

    return (
        <>
            {/* ─── Page Header ─── */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Documents</h1>
                    <p>Company policies, handbooks, and your personal files — all in one place.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowUpload(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                >
                    <Plus size={16} /> Upload File
                </button>
            </div>

            {/* ─── Status Banner ─── */}
            {status.message && (
                <div style={{
                    padding: '0.9rem 1.25rem', marginBottom: '1rem', borderRadius: '12px',
                    background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                    display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, fontSize: '0.88rem'
                }}>
                    {status.type === 'success' && <CheckCircle size={16} />}
                    {status.type === 'error' && <AlertCircle size={16} />}
                    {status.type === 'info' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {status.message}
                </div>
            )}

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' }}>
                    ⚠️ {loadError}
                </div>
            )}

            {/* ─── Upload Panel ─── */}
            {showUpload && (
                <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(191,243,104,0.15)', background: 'rgba(191,243,104,0.02)' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(191,243,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Upload size={17} color="var(--accent)" />
                            </div>
                            <div>
                                <h3 className="card-title" style={{ margin: 0, fontSize: '0.975rem' }}>
                                    {activeTab === 'company' && isAdminOrManager ? 'Upload Company Document' : 'Upload Personal Document'}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                    PDF, Word, Excel, CSV, Images — Max 20 MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowUpload(false); clearUploadForm(); setStatus({ type: '', message: '' }); }}
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-light)' }}
                        >
                            <X size={15} />
                        </button>
                    </div>

                    <form onSubmit={handleUpload}>
                        {/* Drag & Drop Zone */}
                        <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'rgba(191,243,104,0.4)' : 'var(--border)'}`,
                                borderRadius: '12px',
                                padding: file ? '1.25rem 1.5rem' : '2.5rem 1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '1.25rem',
                                background: dragOver ? 'rgba(191,243,104,0.04)' : 'transparent',
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                accept=".pdf,.doc,.docx,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                            />
                            {file ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    {(() => { const { Icon, color, bg } = getFileInfo(file.name, file.name); return <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={24} color={color} /></div>; })()}
                                    <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.15rem' }}>{formatBytes(file.size)}</div>
                                    </div>
                                    <button type="button"
                                        onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                        <X size={13} color="#ef4444" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload size={30} color="var(--text-light)" style={{ marginBottom: '0.75rem' }} />
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <strong style={{ color: 'var(--accent)' }}>Click to browse</strong> or drag & drop
                                    </p>
                                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-light)', fontSize: '0.75rem' }}>
                                        PDF, Word, Excel, CSV, PNG, JPG
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Upload Progress */}
                        {uploading && uploadProgress > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ height: 3, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                                </div>
                                <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.4rem', textAlign: 'right' }}>{uploadProgress}%</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Document Title *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Leave Policy 2026" />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                                <label>Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Visibility hint */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', padding: '0.6rem 0.9rem', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                            {activeTab === 'company' && isAdminOrManager
                                ? <><Globe size={12} /> This will be visible to all employees as a company document</>
                                : <><Lock size={12} /> This will be saved to your personal documents (visible only to you and admins)</>
                            }
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button type="button" className="btn"
                                onClick={() => { setShowUpload(false); clearUploadForm(); setStatus({ type: '', message: '' }); }}
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={uploading || !file}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 130, justifyContent: 'center', opacity: !file ? 0.6 : 1 }}>
                                <Upload size={14} />
                                {uploading ? 'Uploading…' : 'Upload File'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ─── Stats Row ─── */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Company Documents</div>
                        <Globe size={18} color="var(--accent)" />
                    </div>
                    <div className="stat-value">{loading ? '—' : companyDocs.length}</div>
                    <div className="stat-subtitle">Shared with all staff</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">My Documents</div>
                        <Lock size={18} color="#60a5fa" />
                    </div>
                    <div className="stat-value">{loading ? '—' : myPersonalCount}</div>
                    <div className="stat-subtitle">Personal uploads</div>
                </div>
                <div className="stat-card">
                    <div className="stat-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div className="stat-label">Total Storage</div>
                        <SortAsc size={18} color="#f59e0b" />
                    </div>
                    <div className="stat-value">{loading ? '—' : formatBytes(totalSize)}</div>
                    <div className="stat-subtitle">Across all files</div>
                </div>
            </div>

            {/* ─── Main Card with Tabs ─── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Tab Bar */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', background: 'rgba(255,255,255,0.01)' }}>
                    {[
                        { id: 'company', label: 'Company Library', Icon: Building2, count: companyDocs.length, badge: 'rgba(191,243,104,0.12)', badgeText: 'var(--accent)' },
                        { id: 'mine', label: 'My Documents', Icon: UserIcon, count: myPersonalCount, badge: 'rgba(59,130,246,0.12)', badgeText: '#60a5fa' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '1.1rem 1.75rem',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                fontWeight: activeTab === tab.id ? 700 : 500,
                                fontSize: '0.875rem',
                                transition: 'all 0.15s',
                                marginBottom: '-1px'
                            }}
                        >
                            <tab.Icon size={14} />
                            {tab.label}
                            <span style={{
                                background: activeTab === tab.id ? tab.badge : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab.id ? tab.badgeText : 'var(--text-light)',
                                padding: '0.1rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700
                            }}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Filter / Sort Bar */}
                <div style={{
                    padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center',
                    background: 'rgba(255,255,255,0.01)'
                }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
                        <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Search documents…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: '2.1rem', width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text)', fontSize: '0.82rem' }}
                        />
                    </div>

                    {/* Category */}
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text)', fontSize: '0.82rem' }}>
                        <option value="All">All Categories</option>
                        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Type */}
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text)', fontSize: '0.82rem' }}>
                        <option value="All">All Types</option>
                        {['PDF', 'Word', 'Excel', 'CSV', 'Image'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    {/* Sort */}
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text)', fontSize: '0.82rem' }}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name A–Z</option>
                        <option value="size">Largest First</option>
                    </select>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                        {filtered.length} file{filtered.length !== 1 ? 's' : ''} · {formatBytes(activeDocs.reduce((s, d) => s + (d.size || 0), 0))}
                    </span>
                </div>

                {/* Document Grid */}
                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} style={{ borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border)', height: 160, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 10 }} />
                                    <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                                    <div className="skeleton skeleton-text" style={{ width: '65%', marginTop: 'auto' }} />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)' }}>
                            <FolderOpen size={52} style={{ marginBottom: '1rem', opacity: 0.25 }} />
                            <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem' }}>
                                {activeDocs.length === 0
                                    ? activeTab === 'company'
                                        ? 'No company documents uploaded yet'
                                        : 'No personal documents yet'
                                    : 'No documents match your filters'
                                }
                            </p>
                            <p style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                                {activeDocs.length === 0
                                    ? activeTab === 'mine'
                                        ? 'Upload sick certificates, ID documents, contracts, and more.'
                                        : isAdminOrManager ? 'Start by uploading company policies or handbooks.' : 'Company documents will appear here when uploaded.'
                                    : 'Try adjusting your filters or search term.'
                                }
                            </p>
                            {(activeDocs.length === 0 && (isAdminOrManager || activeTab === 'mine')) && (
                                <button className="btn btn-primary"
                                    onClick={() => setShowUpload(true)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Upload size={14} /> Upload First Document
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(265px, 1fr))', gap: '1rem' }}>
                            {filtered.map(doc => {
                                const { Icon, color, bg, label } = getFileInfo(doc.filename, doc.original_name);
                                const canDel = canDelete(doc);
                                return (
                                    <div key={doc.id}
                                        className="doc-card"
                                        style={{
                                            padding: '1.25rem',
                                            border: `1px solid ${color}22`,
                                            borderRadius: '12px',
                                            display: 'flex', flexDirection: 'column', gap: '0.7rem',
                                            background: 'rgba(255,255,255,0.015)',
                                            position: 'relative', overflow: 'hidden',
                                            transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                                            cursor: 'default'
                                        }}
                                    >
                                        {/* Accent stripe */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: `linear-gradient(to bottom, ${color}, ${color}44)`, borderRadius: '12px 0 0 12px' }} />

                                        {/* Top row */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                                            <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon size={22} color={color} strokeWidth={1.8} />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: '0.64rem', padding: '0.18rem 0.48rem', borderRadius: 4, background: bg, color, fontWeight: 800, letterSpacing: '0.04em' }}>{label}</span>
                                                {doc.category && (
                                                    <span style={{ fontSize: '0.64rem', padding: '0.18rem 0.48rem', borderRadius: 4, background: 'rgba(191,243,104,0.08)', color: 'var(--accent)', fontWeight: 700 }}>
                                                        {doc.category}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Title & filename */}
                                        <div>
                                            <h4 style={{ margin: '0 0 0.2rem', color: 'white', lineHeight: 1.35, fontSize: '0.9rem', wordBreak: 'break-word', fontWeight: 700 }}>
                                                {doc.title}
                                            </h4>
                                            {doc.original_name && (
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.original_name}>
                                                    📎 {doc.original_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                            <Clock size={10} style={{ flexShrink: 0 }} />
                                            {doc.date}
                                            <span style={{ marginLeft: 'auto' }}>{formatBytes(doc.size)}</span>
                                        </div>
                                        {doc.uploaded_by && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                                <UserIcon size={10} /> {doc.uploaded_by}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.25rem' }}>
                                            <button
                                                className="btn" title="Download"
                                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: bg, border: `1px solid ${color}44`, color, fontSize: '0.78rem', padding: '0.5rem', fontWeight: 700 }}
                                                onClick={() => handleDownload(doc)}
                                            >
                                                <Download size={13} /> Download
                                            </button>
                                            {canDel && (
                                                <button
                                                    className="btn" title="Delete"
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={deleting === doc.id}
                                                >
                                                    {deleting === doc.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
