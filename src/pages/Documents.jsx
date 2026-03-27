import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, Trash2, FileText, FileSpreadsheet, File, Image, Search, Filter } from 'lucide-react';
import { api } from '../utils/api';

const FILE_CATEGORIES = ['General', 'Policy', 'HR', 'Finance', 'Onboarding', 'Compliance', 'Templates'];

function getFileInfo(filename, originalName) {
    const name = (originalName || filename || '').toLowerCase();
    if (name.endsWith('.pdf'))
        return { Icon: FileText, color: '#e74c3c', bg: '#fde8e8', label: 'PDF' };
    if (name.endsWith('.xlsx') || name.endsWith('.xls'))
        return { Icon: FileSpreadsheet, color: '#27ae60', bg: '#def7ec', label: 'Excel' };
    if (name.endsWith('.csv'))
        return { Icon: FileSpreadsheet, color: '#2980b9', bg: '#e1effe', label: 'CSV' };
    if (name.endsWith('.doc') || name.endsWith('.docx'))
        return { Icon: FileText, color: '#8e44ad', bg: '#f3e8ff', label: 'Word' };
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg'))
        return { Icon: Image, color: '#d35400', bg: '#fef3e2', label: 'Image' };
    return { Icon: File, color: '#7f8c8d', bg: '#f0f0f0', label: 'File' };
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Documents({ user, token }) {
    const [documents, setDocuments] = useState([]);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoadError('');
        try {
            const res = await api.get('/api/documents', token);
            const data = await res.json();
            setDocuments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setLoadError('Failed to load documents. Please try again.');
        }
    }, [token]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('file', file);
        setStatus({ type: 'info', message: 'Uploading…' });
        try {
            const res = await api.upload('/api/documents/upload', formData, token);
            if (res.ok) {
                setStatus({ type: 'success', message: 'Document uploaded successfully!' });
                setTitle('');
                setFile(null);
                setCategory('General');
                document.getElementById('doc-file-upload').value = '';
                fetchDocuments();
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                const data = await res.json();
                setStatus({ type: 'error', message: data.message || 'Upload failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Network error. Please check your connection.' });
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (doc) => {
        fetch(`/api/documents/download/${doc.filename}`, {
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
        .catch(() => window.open(`/api/documents/download/${doc.filename}`, '_blank'));
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Delete this document? This cannot be undone.')) return;
        setDeleting(docId);
        try {
            const res = await api.delete(`/api/documents/${docId}`, token);
            if (res.ok) fetchDocuments();
            else alert('Failed to delete document.');
        } catch {
            alert('Network error.');
        } finally {
            setDeleting(null);
        }
    };

    const allCategories = [...new Set(documents.map(d => d.category || 'General').filter(Boolean))];
    const filteredDocs = documents.filter(doc => {
        const fi = getFileInfo(doc.filename, doc.original_name);
        const matchCat = filterCategory === 'All' || (doc.category || 'General') === filterCategory;
        const matchType = filterType === 'All' || fi.label === filterType;
        const matchSearch = !searchQuery ||
            (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.uploaded_by || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchType && matchSearch;
    });

    const statusBg = { success: '#def7ec', error: '#fde8e8', info: '#e1effe' };
    const statusColor = { success: '#03543f', error: '#9b1c1c', info: '#1e429f' };

    return (
        <>
            <div className="page-header">
                <h1>Company Documents</h1>
                <p>Central repository for policies, handbooks, reports, and onboarding materials.</p>
            </div>

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ {loadError}
                </div>
            )}

            {/* Upload Panel – Admin/Manager only */}
            {(user.role === 'admin' || user.role === 'manager') && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <Upload size={20} style={{ color: 'var(--accent)' }} />
                        <h3 className="card-title" style={{ margin: 0 }}>Upload New Document</h3>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                        Accepted: <strong>PDF, Word (.docx), Excel (.xlsx / .xls), CSV</strong> — Max 20 MB
                    </p>

                    {status.message && (
                        <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '6px', backgroundColor: statusBg[status.type], color: statusColor[status.type], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {status.type === 'success' && <span>✅</span>}
                            {status.type === 'error' && <span>❌</span>}
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Document Title *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. 2026 Employee Handbook" />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)}>
                                {FILE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label>File *</label>
                            <input id="doc-file-upload" type="file" accept=".pdf,.doc,.docx,.xlsx,.xls,.csv" onChange={e => setFile(e.target.files[0])} required style={{ backgroundColor: 'white' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', alignSelf: 'flex-end' }} disabled={uploading}>
                            <Upload size={16} />
                            {uploading ? 'Uploading…' : 'Upload'}
                        </button>
                    </form>
                </div>
            )}

            {/* Document Library */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <File size={20} style={{ color: 'var(--accent)' }} />
                        <h3 className="card-title" style={{ margin: 0 }}>Document Library</h3>
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                placeholder="Search…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: '2rem', padding: '0.4rem 0.75rem 0.4rem 2rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.85rem', minWidth: '150px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Filter size={14} style={{ color: 'var(--text-light)' }} />
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.85rem' }}>
                                <option value="All">All Categories</option>
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text)', fontSize: '0.85rem' }}>
                            <option value="All">All Types</option>
                            <option value="PDF">PDF</option>
                            <option value="Excel">Excel</option>
                            <option value="CSV">CSV</option>
                            <option value="Word">Word</option>
                        </select>
                    </div>
                </div>

                {filteredDocs.length === 0 ? (
                    <div className="empty-state">
                        {documents.length === 0 ? 'No documents uploaded yet.' : 'No documents match your filters.'}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {filteredDocs.map(doc => {
                            const { Icon, color, bg, label } = getFileInfo(doc.filename, doc.original_name);
                            return (
                                <div key={doc.id} style={{
                                    padding: '1.25rem',
                                    border: `1px solid ${color}33`,
                                    borderRadius: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.6rem',
                                    background: 'var(--bg-main)',
                                    transition: 'transform 0.18s, box-shadow 0.18s',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    cursor: 'default'
                                }}
                                className="doc-card"
                                >
                                    {/* Coloured left edge */}
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color, borderRadius: '10px 0 0 10px' }} />

                                    {/* Header row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={22} color={color} strokeWidth={1.8} />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: bg, color: color, fontWeight: 700, letterSpacing: '0.04em' }}>{label}</span>
                                            {doc.category && (
                                                <span style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', fontWeight: 600 }}>
                                                    {doc.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h4 style={{ margin: 0, color: 'var(--accent)', lineHeight: '1.3', fontSize: '0.92rem', wordBreak: 'break-word' }}>{doc.title}</h4>

                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0, lineHeight: '1.5' }}>
                                        {doc.original_name && (
                                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }} title={doc.original_name}>
                                                📎 {doc.original_name}
                                            </span>
                                        )}
                                        {doc.date} · {formatBytes(doc.size)}
                                        {doc.uploaded_by && <><br/>by {doc.uploaded_by}</>}
                                    </p>

                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <button
                                            className="btn"
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'transparent', border: `1px solid ${color}66`, color: color, fontSize: '0.82rem', padding: '0.5rem', fontWeight: 600 }}
                                            onClick={() => handleDownload(doc)}
                                            title="Download document"
                                        >
                                            <Download size={14} />
                                            Download
                                        </button>
                                        {user.role === 'admin' && (
                                            <button
                                                className="btn"
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid #e74c3c55', color: '#e74c3c', fontSize: '0.82rem', padding: '0.5rem 0.65rem' }}
                                                onClick={() => handleDelete(doc.id)}
                                                disabled={deleting === doc.id}
                                                title="Delete document"
                                            >
                                                {deleting === doc.id ? '…' : <Trash2 size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {documents.length > 0 && (
                    <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-light)', textAlign: 'right' }}>
                        Showing {filteredDocs.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>
        </>
    );
}
