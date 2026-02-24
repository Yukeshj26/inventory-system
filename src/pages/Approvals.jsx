import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, doc,
  onSnapshot, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import { db, auth } from '../services/firebaseConfig';
import {
  CheckCircle2, XCircle, Clock, Plus, X, Loader2,
  User, Calendar, MessageSquare
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────
const PRIORITY = {
  high:   'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low:    'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_CONFIG = {
  pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200',     icon: Clock,         label: 'Pending'  },
  approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-50 text-red-600 border-red-200',            icon: XCircle,      label: 'Rejected' },
};

const EMPTY_REQ = {
  itemName: '', quantity: 1, unit: 'pcs', category: 'Lab Equipment',
  reason: '', priority: 'medium', department: '', estimatedCost: ''
};

// ── Shared — outside components to prevent cursor loss ────────────────────
const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition";

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">{label}</label>
    {children}
  </div>
);

// ── Demo Data ─────────────────────────────────────────────────────────────
const DEMO_APPROVALS = [
  { id: 'REQ-001', itemName: 'Printer Toner HP 85A', quantity: 10, unit: 'box', category: 'Consumables',  reason: 'Stock critically low in admin office. Needed for semester-end report printing.', priority: 'high',   department: 'Admin',       estimatedCost: '12000', status: 'pending',  requestedBy: 'Ravi Kumar', requestedAt: '2024-02-15', comments: '' },
  { id: 'REQ-002', itemName: 'Arduino Mega 2560',    quantity: 15, unit: 'pcs', category: 'Lab Equipment', reason: 'Required for embedded systems lab sessions in Feb–March.',                      priority: 'medium', department: 'Electronics', estimatedCost: '18000', status: 'approved', requestedBy: 'Priya Nair', requestedAt: '2024-02-14', comments: 'Approved. PO raised.' },
  { id: 'REQ-003', itemName: 'Safety Goggles',       quantity: 30, unit: 'pcs', category: 'Consumables',  reason: 'Current stock damaged, mandatory for lab safety compliance.',                   priority: 'high',   department: 'Chemistry',   estimatedCost: '4500',  status: 'pending',  requestedBy: 'Dr. Mehta',  requestedAt: '2024-02-13', comments: '' },
  { id: 'REQ-004', itemName: 'UPS 1KVA APC',         quantity: 5,  unit: 'pcs', category: 'Fixed Assets',  reason: 'Server room needs power backup upgrade.',                                      priority: 'low',    department: 'IT',          estimatedCost: '25000', status: 'rejected', requestedBy: 'Suresh IT',  requestedAt: '2024-02-12', comments: 'Budget not available this quarter.' },
];

// ── Request Modal ─────────────────────────────────────────────────────────
function RequestModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_REQ);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">New Purchase Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Item Name *">
                <input required value={form.itemName} onChange={e => set('itemName', e.target.value)}
                  className={inputCls} placeholder="e.g. HP LaserJet Toner" />
              </Field>
            </div>
            <Field label="Quantity">
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} className={inputCls}/>
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={e => set('unit', e.target.value)} className={inputCls} placeholder="pcs / box / kg"/>
            </Field>
            <Field label="Department">
              <input value={form.department} onChange={e => set('department', e.target.value)} className={inputCls} placeholder="Your department" list="dept-list"/>
              <datalist id="dept-list">
                <option value="Computer Science"/>
                <option value="Electronics & Communication"/>
                <option value="Mechanical"/>
                <option value="Civil"/>
                <option value="Admin"/>
                <option value="Library"/>
              </datalist>
            </Field>
            <Field label="Est. Cost (₹)">
              <input type="number" value={form.estimatedCost} onChange={e => set('estimatedCost', e.target.value)} className={inputCls} placeholder="0"/>
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {['Lab Equipment','Consumables','Fixed Assets','Construction','Digital','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Reason / Justification *">
                <textarea required value={form.reason} onChange={e => set('reason', e.target.value)}
                  className={`${inputCls} resize-none`} rows={3} placeholder="Why is this item needed?"/>
              </Field>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin"/>}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────
const ApprovalCard = React.memo(function ApprovalCard({ req, onApprove, onReject }) {
  const [comment, setComment]       = useState('');
  const [showComment, setShowComment] = useState(false);
  const [acting, setActing]         = useState(null);
  const cfg  = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const act = async (action) => {
    setActing(action);
    if (action === 'approve') await onApprove(req, comment);
    else await onReject(req, comment);
    setActing(null);
    setShowComment(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{req.id}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${PRIORITY[req.priority]}`}>{req.priority}</span>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
              <Icon size={11}/> {cfg.label}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mt-2">{req.itemName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{req.quantity} {req.unit} · {req.category} · {req.department}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">₹{Number(req.estimatedCost || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400">est. cost</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-3">{req.reason}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span className="flex items-center gap-1"><User size={11}/> {req.requestedBy}</span>
        <span className="flex items-center gap-1"><Calendar size={11}/> {req.requestedAt}</span>
      </div>

      {req.comments && (
        <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2 mb-3">
          <MessageSquare size={13} className="text-blue-400 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-blue-700">{req.comments}</p>
        </div>
      )}

      {req.status === 'pending' && (
        <div className="space-y-2">
          {showComment && (
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs resize-none focus:ring-2 focus:ring-blue-500 outline-none"
              rows={2} placeholder="Add a comment (optional)..." />
          )}
          <div className="flex gap-2">
            <button onClick={() => setShowComment(!showComment)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              <MessageSquare size={13}/>
            </button>
            <button onClick={() => act('reject')} disabled={!!acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
              {acting === 'reject' ? <Loader2 size={13} className="animate-spin"/> : <XCircle size={13}/>} Reject
            </button>
            <button onClick={() => act('approve')} disabled={!!acting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
              {acting === 'approve' ? <Loader2 size={13} className="animate-spin"/> : <CheckCircle2 size={13}/>} Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ── Main Approvals Page ───────────────────────────────────────────────────
export default function Approvals() {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'approvals'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setRequests(data.length ? data : DEMO_APPROVALS);
      setLoading(false);
    }, () => {
      setRequests(DEMO_APPROVALS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (form) => {
    // close modal immediately
    setShowModal(false);
    const user = auth.currentUser;
    try {
      await addDoc(collection(db, 'approvals'), {
        ...form,
        id: `REQ-${Date.now().toString().slice(-4)}`,
        status: 'pending',
        requestedBy: user?.displayName || user?.email || 'Unknown',
        requestedAt: new Date().toISOString().split('T')[0],
        comments: '',
        createdAt: serverTimestamp(),
      });
    } catch (e) { console.error('Save failed:', e); }
  };

  const handleApprove = useCallback(async (req, comment) => {
    if (req.firestoreId && !req._demo) {
      await updateDoc(doc(db, 'approvals', req.firestoreId), {
        status: 'approved', comments: comment, resolvedAt: serverTimestamp()
      });
    } else {
      setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'approved', comments: comment } : x));
    }
  }, []);

  const handleReject = useCallback(async (req, comment) => {
    if (req.firestoreId && !req._demo) {
      await updateDoc(doc(db, 'approvals', req.firestoreId), {
        status: 'rejected', comments: comment, resolvedAt: serverTimestamp()
      });
    } else {
      setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'rejected', comments: comment } : x));
    }
  }, []);

  const counts = useMemo(() => ({
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  const filtered = useMemo(() =>
    filter === 'all' ? requests : requests.filter(r => r.status === filter),
  [requests, filter]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approval Workflows</h1>
          <p className="text-sm text-gray-400 mt-0.5">TraceSphere · Purchase requisitions and procurement approvals</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-200">
          <Plus size={16}/> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',    key: 'all',      color: 'text-gray-900'    },
          { label: 'Pending',  key: 'pending',  color: 'text-amber-600'   },
          { label: 'Approved', key: 'approved', color: 'text-emerald-600' },
          { label: 'Rejected', key: 'rejected', color: 'text-red-500'     },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${filter === s.key ? 'border-blue-300 shadow-md shadow-blue-100 bg-white' : 'border-gray-100 bg-white hover:shadow-sm'}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key]}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
            No {filter} requests found
          </div>
        ) : filtered.map((req) => (
          <ApprovalCard key={req.id} req={req} onApprove={handleApprove} onReject={handleReject}/>
        ))}
      </div>

      {showModal && <RequestModal onClose={() => setShowModal(false)} onSave={handleSave}/>}
    </div>
  );
}
