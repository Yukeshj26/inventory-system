import React, { useState } from 'react';
import {
  FileText, AlertTriangle, ShoppingCart, TrendingUp,
  Search, Download, CheckCircle, Clock
} from 'lucide-react';

const REPORTS = [
  { icon: FileText,      title: 'Inventory Summary',     desc: 'Full asset register with current status and location', color: '#eff6ff', iconColor: '#2563eb', status: 'ready' },
  { icon: AlertTriangle, title: 'Low Stock Report',       desc: 'Items below minimum threshold requiring reorder',       color: '#fffbeb', iconColor: '#d97706', status: 'ready' },
  { icon: ShoppingCart,  title: 'Procurement History',    desc: 'All approved purchase requisitions and orders',         color: '#f0fdf4', iconColor: '#059669', status: 'ready' },
  { icon: TrendingUp,    title: 'ML Forecast Report',     desc: 'Predicted restocking needs for next 30 days',          color: '#f5f3ff', iconColor: '#7c3aed', status: 'soon' },
  { icon: Search,        title: 'Audit Trail',            desc: 'Complete digital log of all asset changes',            color: '#fff0f3', iconColor: '#e11d48', status: 'ready' },
  { icon: FileText,      title: 'Financial Summary',      desc: 'Asset valuation and total procurement spend',          color: '#f0fdfa', iconColor: '#0d9488', status: 'ready' },
];

const AUDIT_LOG = [
  { action: 'Asset Added',    item: 'Dell OptiPlex 7090',    user: 'Admin',      time: '10 min ago', type: 'add' },
  { action: 'Stock Updated',  item: 'Printer Toner HP 85A',  user: 'Ravi Kumar', time: '1 hr ago',   type: 'update' },
  { action: 'Approved',       item: 'REQ-003 Safety Goggles',user: 'Dr. Mehta',  time: '2 hr ago',   type: 'approve' },
  { action: 'Asset Issued',   item: 'Oscilloscope DS1054Z',  user: 'Priya Nair', time: '3 hr ago',   type: 'issue' },
  { action: 'Rejected',       item: 'REQ-004 UPS 1KVA',     user: 'Admin',      time: '5 hr ago',   type: 'reject' },
  { action: 'Asset Returned', item: 'Projector BenQ MX522',  user: 'Suresh IT',  time: '1 day ago',  type: 'return' },
];

const TYPE_STYLE = {
  add:     { bg: '#f0fdf4', color: '#166534' },
  update:  { bg: '#eff6ff', color: '#1d4ed8' },
  approve: { bg: '#f0fdf4', color: '#065f46' },
  issue:   { bg: '#f5f3ff', color: '#5b21b6' },
  reject:  { bg: '#fef2f2', color: '#991b1b' },
  return:  { bg: '#fff7ed', color: '#9a3412' },
};

export default function Reports() {
  const [generating, setGenerating] = useState(null);

  const handleGenerate = (title) => {
    setGenerating(title);
    setTimeout(() => setGenerating(null), 2000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reports</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Audit-ready reports and analytics exports</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Download size={16} /> Export All
        </button>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {REPORTS.map((r, i) => {
          const Icon = r.icon;
          const isGenerating = generating === r.title;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)', transition: '.2s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={20} color={r.iconColor} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, lineHeight: 1.5 }}>{r.desc}</div>
              {r.status === 'soon' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#f5f3ff', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>
                  <Clock size={14} /> Coming Soon — ML Integration
                </div>
              ) : (
                <button
                  onClick={() => handleGenerate(r.title)}
                  style={{ width: '100%', padding: '9px', background: isGenerating ? '#f0fdf4' : '#f8fafc', color: isGenerating ? '#059669' : '#475569', border: `1px solid ${isGenerating ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: '.2s' }}>
                  {isGenerating ? <><CheckCircle size={14} /> Generated!</> : <><Download size={14} /> Generate PDF</>}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Audit Trail */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Live Audit Trail</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>All recent system activity</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', background: '#f0fdf4', color: '#166534', borderRadius: 20, border: '1px solid #bbf7d0' }}>● Live</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {AUDIT_LOG.map((log, i) => {
            const s = TYPE_STYLE[log.type];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, whiteSpace: 'nowrap', minWidth: 100, textAlign: 'center' }}>{log.action}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', flex: 1 }}>{log.item}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{log.user}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{log.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
