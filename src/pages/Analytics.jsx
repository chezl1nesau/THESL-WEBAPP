import React, { useState } from 'react';
import { BarChart3, ExternalLink, Info, LayoutDashboard, Database, Activity } from 'lucide-react';

const dashboards = [
  {
    id: 'overview',
    label: 'Company Overview',
    icon: LayoutDashboard,
    url: "https://datastudio.google.com/embed/reporting/13dc8e5d-8f53-490c-838b-0e3913439503/page/VwFrF",
    external: "https://lookerstudio.google.com/reporting/13dc8e5d-8f53-490c-838b-0e3913439503"
  },
  {
    id: 'operations',
    label: 'Operations Report',
    icon: Activity,
    url: "https://datastudio.google.com/embed/reporting/b5cdd44b-f796-4a64-8436-13d9156d4fc9/page/cfIuF",
    external: "https://lookerstudio.google.com/reporting/b5cdd44b-f796-4a64-8436-13d9156d4fc9"
  },
  {
    id: 'regional',
    label: 'Regional Metrics',
    icon: Database,
    url: "https://datastudio.google.com/embed/reporting/e01178e6-ee80-4da0-8ab5-b9d7b087e6e3/page/mJJsF",
    external: "https://lookerstudio.google.com/reporting/e01178e6-ee80-4da0-8ab5-b9d7b087e6e3"
  }
];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState(dashboards[0]);

  return (
    <div className="analytics-container animate-fade-in" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <BarChart3 className="text-accent" size={28} />
              Company Analytics
            </h1>
            <p style={{ marginTop: '0.25rem' }}>Real-time business intelligence and multi-channel performance</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {dashboards.map(dash => (
              <button
                key={dash.id}
                onClick={() => setActiveTab(dash)}
                className={`filter-btn ${activeTab.id === dash.id ? 'active' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem'
                }}
              >
                <dash.icon size={14} />
                {dash.label}
              </button>
            ))}
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
          Synchronizing with Looker Studio...
        </div>
        
        <iframe
          key={activeTab.id}
          title={activeTab.label}
          src={activeTab.url}
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
      
      <div style={{ 
        marginTop: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexShrink: 0 
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={12} />
          View restricted to Administrators & Managers.
        </div>
        <a 
          href={activeTab.external} 
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
          Open {activeTab.label} in Looker <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default Analytics;
