import React from 'react';
import { BarChart3, ExternalLink, Info } from 'lucide-react';

const Analytics = () => {
  const embedUrl = "https://datastudio.google.com/embed/reporting/13dc8e5d-8f53-490c-838b-0e3913439503/page/VwFrF";

  return (
    <div className="analytics-container animate-fade-in" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 className="text-accent" size={28} />
              Company Analytics
            </h1>
            <p style={{ marginTop: '0.25rem' }}>Real-time business intelligence and performance metrics</p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <Info size={14} />
            Data syncs every 15 minutes
          </div>
        </div>
      </div>

      <div className="card" style={{ 
        flex: 1, 
        padding: 0, 
        overflow: 'hidden', 
        background: 'rgba(5, 16, 31, 0.4)',
        border: '1px solid var(--border)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
          color: 'var(--text-light)',
          fontSize: '0.9rem'
        }}>
          Loading dashboard metrics...
        </div>
        
        <iframe
          title="Company Analytics Dashboard"
          src={embedUrl}
          frameBorder="0"
          style={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            position: 'relative',
            zIndex: 1,
            background: 'transparent'
          }}
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
      </div>
      
      <div style={{ marginTop: '1rem', textAlign: 'right', flexShrink: 0 }}>
        <a 
          href="https://datastudio.google.com/reporting/13dc8e5d-8f53-490c-838b-0e3913439503" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            fontSize: '0.75rem', 
            color: 'var(--accent)', 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontWeight: 600
          }}
        >
          Open in Looker Studio <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default Analytics;
