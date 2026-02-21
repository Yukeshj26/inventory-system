import React, { useState, useEffect } from 'react';
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import {
  Plus, X, Search, Download, Loader2,
  Package, Truck, CheckCircle2, Clock,
  AlertCircle, ChevronRight, Building2,
  Calendar, DollarSign, FileText, Filter
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const STATUSES = ['pending', 'approved', 'ordered', 'delivered', 'cancelled'];

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: '#fffbeb', color: '#92400e', border: '#fde68a', icon: Clock },
  approved:  { label: 'Approved',  bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', icon: CheckCircle2 },
  ordered:   { label: 'Ordered',   bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', icon: Truck },
  delivered: { label: 'Delivered', bg: '#f0fdfa', color: '#065f46', border: '#99f6e4', icon: Package },
  cancelled: { label: 'Cancelled', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: AlertCircle },
};

const CATEGORIES = ['Lab Equipment', 'Consumables', 'Fixed Assets', 'Construction', 'Digital', 'Furniture', 'Other'];
const SUPPLIERS  = ['TechMart India', 'LabSupply Co.', 'OfficeWorld', 'BuildPro', 'DigiSource', 'SafetyFirst', 'Other'];

const EMPTY_FORM = {
  poNumber: '', itemName: '', category: 'Consumables', supplier: 'TechMart India',
  quantity: 1, unit: 'pcs', unitCost: '', department: '', expectedDate: '',
  notes: '', priority: 'medium',
};

const DEMO_ORDERS = [
  { id: 'd1', poNumber: 'PO-2024-001', itemName: 'Dell OptiPlex 7090', category: 'Fixed Assets', supplier: 'TechMart India', quantity: 5, unit: 'pcs', unitCost: 45000, department: 'CS Lab', expectedDate: '2024-03-01', status: 'delivered', priority: 'high', notes: 'Core i7, 16GB RAM', createdAt: '2024-01-15', requestedBy: 'Admin' },
  { id: 'd2', poNumber: 'PO-2024-002', itemName: 'Arduino Mega 2560', category: 'Lab Equipment', supplier: 'DigiSource', quantity: 20, unit: 'pcs', unitCost: 1200, department: 'Electronics', expectedDate: '2024-02-20', status: 'ordered', priority: 'medium', notes: '', createdAt: '2024-02-01', requestedBy: 'Priya Nair' },
  { id: 'd3', poNumber: 'PO-2024-003', itemName: 'Safety Goggles', category: 'Consumables', supplier: 'SafetyFirst', quantity: 50, unit: 'pcs', unitCost: 150, department: 'Chemistry', expectedDate: '2024-02-25', status: 'approved', priority: 'high', notes: 'ANSI certified', createdAt: '2024-02-10', requestedBy: 'Dr. Mehta' },
  { id: 'd4', poNumber: 'PO-2024-004', itemName: 'Printer Toner HP 85A', category: 'Consumables', supplier: 'OfficeWorld', quantity: 10, unit: 'box', unitCost: 1200, department: 'Admin', expectedDate: '2024-02-18', status: 'pending', priority: 'high', notes: '', createdAt: '2024-02-12', requestedBy: 'Ravi Kumar' },
  { id: 'd5', poNumber: 'PO-2024-005', itemName: 'Oscilloscope DS1054Z', category: 'Lab Equipment', supplier: 'LabSupply Co.', quantity: 3, unit: 'pcs', unitCost: 28000, department: 'Electronics', expectedDate: '2024-03-10', status: 'cancelled', priority: 'low', notes: 'Budget constraint', createdAt: '2024-02-05', requestedBy: 'Admin' },
];

// ── Progress Tracker ───────────────────────────────────────────────────────
const STEPS = ['pending', 'approved', 'ordered', 'delivered'];

function StatusTracker({ status }) {
  const currentIdx = STEPS.indexOf(status);
  if (status === 'cancelled') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#dc2626', fontWeight: 600, padding: '6px 10px', background: '#fef2f2', borderRadius: 8 }}>
      <AlertCircle size={14} /> Order Cancelled
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STEPS.map((step, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        const cfg    = STATUS_CONFIG[step];
        const Icon   = cfg.icon;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? cfg.bg : '#f1f5f9', border: `2px solid ${done ? cfg.border : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.2s' }}>
                <Icon size={13} color={done ? cfg.color : '#94a3b8'} />
              </div>
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: done ? cfg.color : '#94a3b8', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{cfg.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 32, height: 2, background: i < currentIdx ? '#bbf7d0' : '#e2e8f0', marginBottom: 14, transition: '.2s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Order Modal ────────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onSave }) {
  const [form, setForm] = useState(order || EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const inputCls = { width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' };
  const Field = ({ label, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{order ? 'Edit Purchase Order' : 'New Purchase Order'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Item Name *">
                <input required value={form.itemName} onChange={e => set('itemName', e.target.value)} style={inputCls} placeholder="e.g. Safety Goggles" />
              </Field>
            </div>
            <Field label="PO Number">
              <input value={form.poNumber} onChange={e => set('poNumber', e.target.value)} style={inputCls} placeholder="Auto-generated if empty" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputCls}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Supplier">
              <select value={form.supplier} onChange={e => set('supplier', e.target.value)} style={inputCls}>
                {SUPPLIERS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Department">
              <input value={form.department} onChange={e => set('department', e.target.value)} style={inputCls} placeholder="e.g. Chemistry" />
            </Field>
            <Field label="Quantity">
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} style={inputCls} />
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={e => set('unit', e.target.value)} style={inputCls} placeholder="pcs / box / kg" />
            </Field>
            <Field label="Unit Cost (₹)">
              <input type="number" value={form.unitCost} onChange={e => set('unitCost', e.target.value)} style={inputCls} placeholder="0" />
            </Field>
            <Field label="Expected Delivery">
              <input type="date" value={form.expectedDate} onChange={e => set('expectedDate', e.target.value)} style={inputCls} />
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputCls}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="Notes">
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ ...inputCls, resize: 'none' }} rows={2} placeholder="Additional details..." />
              </Field>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: '10px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {order ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Procurement() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilter] = useState('all');
  const [selected, setSelected]   = useState(null);

  // Firestore real-time
  useEffect(() => {
    const q = query(collection(db, 'procurement'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setOrders(data.length ? data : DEMO_ORDERS);
      setLoading(false);
    }, () => { setOrders(DEMO_ORDERS); setLoading(false); });
    return () => unsub();
  }, []);

  const handleSave = async (form) => {
    const user = auth.currentUser;
    const poNum = form.poNumber || `PO-${Date.now().toString().slice(-6)}`;
    if (editOrder?.firestoreId && !editOrder._demo) {
      await updateDoc(doc(db, 'procurement', editOrder.firestoreId), { ...form, poNumber: poNum, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'procurement'), {
        ...form, poNumber: poNum, status: 'pending',
        requestedBy: user?.displayName || user?.email || 'Unknown',
        createdAt: serverTimestamp(),
      });
    }
    setEditOrder(null);
  };

  const handleStatusChange = async (order, newStatus) => {
    if (order.firestoreId && !order._demo) {
      await updateDoc(doc(db, 'procurement', order.firestoreId), { status: newStatus, updatedAt: serverTimestamp() });
    } else {
      setOrders(o => o.map(x => x.id === order.id ? { ...x, status: newStatus } : x));
    }
    if (selected?.id === order.id) setSelected(s => ({ ...s, status: newStatus }));
  };

  // Stats
  const counts = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    ordered:   orders.filter(o => o.status === 'ordered').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };
  const totalSpend = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.quantity * o.unitCost || 0), 0);

  const filtered = orders.filter(o => {
    const matchSearch = o.itemName?.toLowerCase().includes(search.toLowerCase()) ||
                        o.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
                        o.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const headers = ['PO Number','Item','Category','Supplier','Qty','Unit','Unit Cost','Total','Status','Department','Expected Date'];
    const rows = filtered.map(o => [o.poNumber, o.itemName, o.category, o.supplier, o.quantity, o.unit, o.unitCost, o.quantity * o.unitCost, o.status, o.department, o.expectedDate]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'procurement.csv'; a.click();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 32, height: 32, border: '4px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Procurement</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Purchase orders and supplier management</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
            <Download size={15} /> Export
          </button>
          <button onClick={() => { setEditOrder(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,.25)' }}>
            <Plus size={15} /> New Order
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Orders',   value: counts.total,     icon: FileText,     bg: '#eff6ff', ic: '#2563eb' },
          { label: 'Pending',        value: counts.pending,   icon: Clock,        bg: '#fffbeb', ic: '#d97706' },
          { label: 'In Transit',     value: counts.ordered,   icon: Truck,        bg: '#f0f9ff', ic: '#0284c7' },
          { label: 'Total Spent',    value: `₹${(totalSpend/1000).toFixed(0)}K`, icon: DollarSign, bg: '#f0fdf4', ic: '#059669' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={17} color={k.ic} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by item, PO number, supplier..."
            style={{ width: '100%', padding: '10px 14px 10px 36px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilter(e.target.value)}
          style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 13, fontWeight: 500, color: '#475569', outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              {['PO Number', 'Item', 'Supplier', 'Qty', 'Total Cost', 'Status', 'Expected', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>No orders found</td></tr>
            ) : filtered.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const total = (order.quantity * order.unitCost) || 0;
              const isOverdue = order.expectedDate && new Date(order.expectedDate) < new Date() && !['delivered','cancelled'].includes(order.status);
              return (
                <tr key={order.id || order.firestoreId} style={{ borderBottom: '1px solid #f8fafc', transition: '.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                  onClick={() => setSelected(order)}>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>{order.poNumber}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{order.itemName}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{order.category} · {order.department}</div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' }}>
                      <Building2 size={13} color="#94a3b8" /> {order.supplier}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{order.quantity} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{order.unit}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>₹{total.toLocaleString()}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 600 : 400 }}>
                      <Calendar size={12} /> {order.expectedDate || '—'}
                      {isOverdue && ' ⚠'}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditOrder(order); setShowModal(true); }}
                        style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Edit</button>
                      {order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <select value={order.status} onChange={e => handleStatusChange(order, e.target.value)}
                          style={{ padding: '5px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 11, color: '#475569', cursor: 'pointer', outline: 'none' }}>
                          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing <strong>{filtered.length}</strong> of <strong>{orders.length}</strong> orders</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>Total committed: ₹{orders.reduce((s,o) => s + (o.quantity * o.unitCost || 0), 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: '#fff', boxShadow: '-4px 0 30px rgba(0,0,0,.12)', zIndex: 50, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Order Details</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
          </div>

          {/* Status Tracker */}
          <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>Order Progress</div>
            <StatusTracker status={selected.status} />
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['PO Number',   selected.poNumber],
              ['Item',        selected.itemName],
              ['Category',    selected.category],
              ['Supplier',    selected.supplier],
              ['Department',  selected.department],
              ['Quantity',    `${selected.quantity} ${selected.unit}`],
              ['Unit Cost',   `₹${Number(selected.unitCost || 0).toLocaleString()}`],
              ['Total Cost',  `₹${(selected.quantity * selected.unitCost || 0).toLocaleString()}`],
              ['Priority',    selected.priority],
              ['Expected',    selected.expectedDate || '—'],
              ['Requested By', selected.requestedBy || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textAlign: 'right', maxWidth: 200 }}>{value}</span>
              </div>
            ))}
            {selected.notes && (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                📝 {selected.notes}
              </div>
            )}
          </div>

          {/* Quick Status Update */}
          {!['delivered', 'cancelled'].includes(selected.status) && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Update Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUSES.filter(s => s !== selected.status && s !== 'pending').map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button key={s} onClick={() => handleStatusChange(selected, s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: cfg.color, cursor: 'pointer', transition: '.15s' }}>
                      <Icon size={15} /> Mark as {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <OrderModal
          order={editOrder}
          onClose={() => { setShowModal(false); setEditOrder(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
