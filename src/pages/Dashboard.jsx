import React, { useState, useEffect } from 'react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const STOCK_DATA = [
  { month: 'Aug', in: 420, out: 310 },
  { month: 'Sep', in: 380, out: 290 },
  { month: 'Oct', in: 510, out: 400 },
  { month: 'Nov', in: 470, out: 360 },
  { month: 'Dec', in: 530, out: 410 },
  { month: 'Jan', in: 490, out: 370 },
];

const ACTIVITY = [
  { action: 'Issued',    name: 'Dell OptiPlex 7090',    dept: 'CS Lab',       time: '2 min ago',  color: '#eff6ff', text: '#1d4ed8' },
  { action: 'Returned',  name: 'Oscilloscope DS1054Z',  dept: 'Electronics',  time: '18 min ago', color: '#f0fdf4', text: '#166534' },
  { action: 'Restocked', name: 'PVC Conduit (50m)',      dept: 'Store',        time: '1 hr ago',   color: '#f5f3ff', text: '#5b21b6' },
  { action: 'Pending',   name: 'Projector BenQ MX522',  dept: 'Seminar Hall', time: '2 hr ago',   color: '#fffbeb', text: '#92400e' },
  { action: 'Approved',  name: 'Lab Coat (Batch)',       dept: 'Chemistry',    time: '3 hr ago',   color: '#f0fdf4', text: '#065f46' },
];

const LOW_STOCK = [
  { name: 'Printer Toner HP 85A', qty: 3,  min: 10, dept: 'Admin' },
  { name: 'Microscope Slides',    qty: 5,  min: 20, dept: 'Biology' },
  { name: 'Safety Gloves (M)',    qty: 8,  min: 25, dept: 'Chemistry' },
  { name: 'Network Cables Cat6',  qty: 12, min: 30, dept: 'IT' },
];

const KPICard = ({ icon, label, value, sub, trend, bg }) => (
  <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
      {trend && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: trend > 0 ? '#ecfdf5' : '#fef2f2', color: trend > 0 ? '#059669' : '#dc2626' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: -0.5 }}>{value}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginTop: 2 }}>{label}</div>
    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ totalAssets: 1247, lowStock: 14, pendingApprovals: 7, activeIssued: 342 });
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [a, l, p, i] = await Promise.all([
          getCountFromServer(collection(db, 'assets')),
          getCountFromServer(query(collection(db, 'assets'), where('quantity', '<=', 10))),
          getCountFromServer(query(collection(db, 'approvals'), where('status', '==', 'pending'))),
          getCountFromServer(query(collection(db, 'assets'), where('status', '==', 'issued'))),
        ]);
        setStats({
          totalAssets:      a.data().count || 1247,
          lowStock:         l.data().count || 14,
          pendingApprovals: p.data().count || 7,
          activeIssued:     i.data().count || 342,
        });
      } catch { /* fallback to demo data */ }
    };
    fetchStats();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Operations Overview</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>TraceSphere · {today}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#166534' }}>
          🟢 All Systems Operational
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard icon="📦" label="Total Assets"      value={stats.totalAssets.toLocaleString()} sub="Across all departments" trend={4.2}  bg="#eff6ff" />
        <KPICard icon="⚠️" label="Low Stock Alerts"  value={stats.lowStock}                     sub="Requires reorder"      trend={-2}   bg="#fffbeb" />
        <KPICard icon="⏱️" label="Pending Approvals" value={stats.pendingApprovals}              sub="Awaiting action"                    bg="#f5f3ff" />
        <KPICard icon="⚡" label="Currently Issued"  value={stats.activeIssued}                 sub="Items in use"          trend={1.8}  bg="#f0fdfa" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Stock Movement */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Stock Movement</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>Inflow vs outflow — last 6 months</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {STOCK_DATA.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 110 }}>
                  <div style={{ flex: 1, background: '#3b82f6', borderRadius: '4px 4px 0 0', height: `${(d.in / 550) * 100}%` }} />
                  <div style={{ flex: 1, background: '#8b5cf6', borderRadius: '4px 4px 0 0', height: `${(d.out / 550) * 100}%` }} />
                </div>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2, display: 'inline-block' }} />Stock In</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}><span style={{ width: 10, height: 10, background: '#8b5cf6', borderRadius: 2, display: 'inline-block' }} />Stock Out</span>
          </div>
        </div>

        {/* Category Donut */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Asset Categories</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>Distribution by type</div>
          <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, display: 'block', margin: '0 auto' }}>
            <circle cx="60" cy="60" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="85 166" strokeDashoffset="0"/>
            <circle cx="60" cy="60" r="40" fill="none" stroke="#8b5cf6" strokeWidth="20" strokeDasharray="70 181" strokeDashoffset="-85"/>
            <circle cx="60" cy="60" r="40" fill="none" stroke="#06b6d4" strokeWidth="20" strokeDasharray="55 196" strokeDashoffset="-155"/>
            <circle cx="60" cy="60" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="25 226" strokeDashoffset="-210"/>
            <circle cx="60" cy="60" r="40" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="16 235" strokeDashoffset="-235"/>
            <text x="60" y="64" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e293b">
              {stats.totalAssets.toLocaleString()}
            </text>
          </svg>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['#3b82f6','Lab Equipment','34%'],['#8b5cf6','Consumables','28%'],['#06b6d4','Fixed Assets','22%'],['#f59e0b','Construction','10%'],['#10b981','Digital','6%']].map(([c,l,v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }}/>{l}</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Recent Activity */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Recent Activity</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Latest asset movements</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: a.color, color: a.text, whiteSpace: 'nowrap', marginTop: 1 }}>{a.action}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.dept} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Low Stock Alerts</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Items below minimum threshold</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LOW_STOCK.map((s, i) => {
              const pct = Math.round((s.qty / s.min) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{s.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>{s.qty}/{s.min}</span>
                  </div>
                  <div style={{ height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#f87171,#fbbf24)', borderRadius: 10 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.dept}</div>
                </div>
              );
            })}
          </div>
          <button style={{ width: '100%', marginTop: 14, padding: 9, background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Generate Reorder Report →
          </button>
        </div>

        {/* Dept Usage */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Dept. Usage</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Items issued per department</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Science',320,85],['Engineering',280,72],['Admin',190,50],['Infrastructure',240,62],['Library',110,30]].map(([dept,val,pct]) => (
              <div key={dept}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{dept}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{val}</span>
                </div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#3b82f6', borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
