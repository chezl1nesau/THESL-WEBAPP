import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export default function Documents({ user, token }) {
    const [documents, setDocuments] = useState([]);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loadError, setLoadError] = useState('');

    const fetchDocuments = useCallback(async () => {
        setLoadError('');
        try {
            const res = await api.get('/api/documents', token);
            const data = await res.json();
            setDocuments(data);
        } catch (err) {
            console.error(err);
            setLoadError('Failed to load documents');
        }
    }, [token]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        setStatus({ type: 'info', message: 'Uploading...' });

        try {
            const res = await api.upload('/api/documents/upload', formData, token);

            if(res.ok) {
                setStatus({ type: 'success', message: 'Document uploaded successfully!' });
                setTitle('');
                setFile(null);
                document.getElementById('file-upload').value = '';
                fetchDocuments();
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } else {
                setStatus({ type: 'error', message: 'Upload failed' });
            }
        } catch(err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
        }
    };

    const handleDownload = (filename) => {
        window.open(`/api/documents/download/${filename}`, '_blank');
    };

    const formatBytes = (bytes) => {
        if(bytes === 0) return '0 Bytes';
        const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <>
            <div className="page-header">
                <h1>Company Documents</h1>
                <p>Central repository for policies, handbooks, and onboarding materials.</p>
            </div>

            {loadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '8px', backgroundColor: '#fde8e8', color: '#9b1c1c' }}>
                    {loadError}
                </div>
            )}

            {user.role === 'admin' && (
                <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-main)' }}>
                    <h3 className="card-title" style={{ marginBottom: '1rem' }}>Upload New Document</h3>
                    {status.message && (
                        <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: status.type === 'success' ? '#def7ec' : status.type === 'error' ? '#fde8e8' : '#e1effe', color: status.type === 'success' ? '#03543f' : status.type === 'error' ? '#9b1c1c' : '#1e429f' }}>
                            {status.message}
                        </div>
                    )}
                    <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: '1', minWidth: '200px', margin: 0 }}>
                            <label>Document Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. 2026 Employee Handbook" />
                        </div>
                        <div className="form-group" style={{ flex: '2', minWidth: '250px', margin: 0 }}>
                            <label>File (PDF, Doc, etc)</label>
                            <input id="file-upload" type="file" onChange={e => setFile(e.target.files[0])} required style={{ backgroundColor: 'white' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>Upload Directly</button>
                    </form>
                </div>
            )}

            <div className="card">
                <h3 className="card-title" style={{ marginBottom: '1rem' }}>Document Library</h3>
                {documents.length === 0 ? (
                    <p style={{ color: 'var(--text-light)' }}>No documents have been uploaded yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {documents.map(doc => (
                            <div key={doc.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-main)', transition: 'transform 0.2s', cursor: 'pointer' }} className="doc-card" onClick={() => handleDownload(doc.filename)}>
                                <div style={{ fontSize: '2rem' }}>📄</div>
                                <h4 style={{ margin: 0, color: 'var(--accent)', lineHeight: '1.3' }}>{doc.title}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>
                                    Uploaded: {doc.date} &bull; {formatBytes(doc.size)}
                                </p>
                                <button className="btn" style={{ marginTop: 'auto', background: 'white', border: '1px solid var(--border)', width: '100%' }}>Download File</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
