import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import {
  Plus, Search, Download, QrCode, Edit2, Trash2,
  X, AlertTriangle, Loader2
} from 'lucide-react';

// ── Categories & Locations ────────────────────────────────────────────────
const CATEGORIES = ['Lab Equipment', 'Consumables', 'Fixed Assets', 'Construction', 'Digital', 'Furniture', 'Other'];
const LOCATIONS  = ['Main Block', 'Admin Block', 'CS Lab', 'ECE Lab', 'Mechanical Lab', 'Civil Lab', 'Seminar Hall', 'Hostel', 'Main Store', 'Library'];
const STATUSES   = ['available', 'issued', 'maintenance', 'disposed'];

const STATUS_STYLE = {
  available:   { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  issued:      { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  maintenance: { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  disposed:    { dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200' },
};

const EMPTY_FORM = {
  name: '', assetId: '', category: 'Lab Equipment', location: 'Main Store',
  quantity: 1, minQuantity: 5, unit: 'pcs', status: 'available',
  department: '', description: '', purchaseDate: '', cost: ''
};

// ── QR Code Modal ─────────────────────────────────────────────────────────
function QRModal({ asset, onClose }) {
  const qrData = encodeURIComponent(JSON.stringify({ id: asset.assetId, name: asset.name, location: asset.location }));
  const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QR - ${asset.name}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}h2{margin:0}p{color:#666;font-size:13px}</style>
      </head><body>
      <h2>${asset.name}</h2>
      <p>${asset.assetId} · ${asset.location}</p>
      <img src="${qrUrl}" style="margin:20px auto;display:block"/>
      <p>CampusAsset AI · Chennai Institute of Technology · ${new Date().toLocaleDateString()}</p>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900">Asset QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>
        <img src={qrUrl} alt="QR" className="w-48 h-48 mx-auto rounded-xl border border-gray-100 shadow" />
        <p className="font-semibold text-gray-800 mt-4">{asset.name}</p>
        <p className="text-xs text-gray-400 mt-1">{asset.assetId} · {asset.location}</p>
        <div className="flex gap-3 mt-6">
          <a href={qrUrl} download={`${asset.assetId}-qr.png`}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition-colors">
            <Download size={15}/> Download
          </a>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            <QrCode size={15}/> Print
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────
function AssetModal({ asset, onClose, onSave }) {
  const [form, setForm] = useState(asset || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">{asset ? 'Edit Asset' : 'Add New Asset'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Asset Name *">
              <input required value={form.name} onChange={e => set('name', e.target.value)}
                className={inputCls} placeholder="e.g. Dell OptiPlex 7090" />
            </Field>
            <Field label="Asset ID *">
              <input required value={form.assetId} onChange={e => set('assetId', e.target.value)}
                className={inputCls} placeholder="e.g. AST-0001" />
            </Field>

            {/* Category — type or pick */}
            <Field label="Category">
              <input value={form.category} onChange={e => set('category', e.target.value)}
                className={inputCls} placeholder="e.g. Lab Equipment" list="category-list" />
              <datalist id="category-list">
                {CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </Field>

            {/* Location — type or pick */}
            <Field label="Location">
              <input value={form.location} onChange={e => set('location', e.target.value)}
                className={inputCls} placeholder="e.g. CS Lab" list="location-list" />
              <datalist id="location-list">
                {LOCATIONS.map(l => <option key={l} value={l} />)}
              </datalist>
            </Field>

            <Field label="Quantity">
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', Number(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Min. Quantity (Alert)">
              <input type="number" min="0" value={form.minQuantity} onChange={e => set('minQuantity', Number(e.target.value))}
                className={inputCls} />
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={e => set('unit', e.target.value)}
                className={inputCls} placeholder="pcs / kg / m / box" />
            </Field>

            {/* Status — type or pick */}
            <Field label="Status">
              <input value={form.status} onChange={e => set('status', e.target.value)}
                className={inputCls} placeholder="e.g. available" list="status-list" />
              <datalist id="status-list">
                {STATUSES.map(s => <option key={s} value={s} />)}
              </datalist>
            </Field>

            <Field label="Department">
              <input value={form.department} onChange={e => set('department', e.target.value)}
                className={inputCls} placeholder="e.g. Computer Science" list="dept-list" />
              <datalist id="dept-list">
                <option value="Computer Science" />
                <option value="Electronics & Communication" />
                <option value="Mechanical" />
                <option value="Civil" />
                <option value="Admin" />
                <option value="Library" />
              </datalist>
            </Field>
            <Field label="Cost (₹)">
              <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)}
                className={inputCls} placeholder="0.00" />
            </Field>
            <Field label="Purchase Date">
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)}
                className={inputCls} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className={`${inputCls} resize-none`} rows={2} placeholder="Optional notes..." />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              {saving ? <Loader2 size={16} className="animate-spin"/> : null}
              {asset ? 'Save Changes' : 'Add Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Asset Row ─────────────────────────────────────────────────────────────
const AssetRow = React.memo(function AssetRow({ asset, onEdit, onDelete, onQr }) {
  const st = STATUS_STYLE[asset.status] || STATUS_STYLE.available;
  const isLow = asset.quantity <= asset.minQuantity;
  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{asset.assetId}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">{asset.name}</p>
          {isLow && <AlertTriangle size={13} className="text-amber-500 flex-shrink-0"/>}
        </div>
        {asset.description && <p className="text-xs text-gray-400 truncate max-w-48">{asset.description}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{asset.category}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{asset.location}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-gray-800'}`}>{asset.quantity}</span>
          <span className="text-xs text-gray-400">{asset.unit}</span>
        </div>
        {isLow && <p className="text-xs text-amber-500">Min: {asset.minQuantity}</p>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${st.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}/>{asset.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{asset.department || '—'}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <button onClick={() => onQr(asset)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><QrCode size={15}/></button>
          <button onClick={() => onEdit(asset)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"><Edit2 size={15}/></button>
          <button onClick={() => onDelete(asset)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15}/></button>
        </div>
      </td>
    </tr>
  );
});

// ── Main Inventory Page ───────────────────────────────────────────────────
export default function Inventory() {
  const [assets, setAssets]                     = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState('');
  const [debouncedSearch, setDebouncedSearch]   = useState('');
  const [filterCat, setFilterCat]               = useState('All');
  const [filterStatus, setFilterStatus]         = useState('All');
  const [showModal, setShowModal]               = useState(false);
  const [editAsset, setEditAsset]               = useState(null);
  const [qrAsset, setQrAsset]                   = useState(null);

  // ── Debounce search ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ── Firestore listener ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'assets'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
      setAssets(data.length ? data : DEMO_ASSETS);
      setLoading(false);
    }, () => {
      setAssets(DEMO_ASSETS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (form) => {
    if (editAsset?.firestoreId) {
      await updateDoc(doc(db, 'assets', editAsset.firestoreId), { ...form, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'assets'), { ...form, createdAt: serverTimestamp() });
    }
    setEditAsset(null);
  }, [editAsset]);

  const handleDelete = useCallback(async (asset) => {
    if (!window.confirm(`Delete "${asset.name}"?`)) return;
    if (asset.firestoreId && !asset._demo) {
      await deleteDoc(doc(db, 'assets', asset.firestoreId));
    } else {
      setAssets(a => a.filter(x => x.assetId !== asset.assetId));
    }
  }, []);

  // ── Filtering ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => assets.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                        a.assetId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                        a.department?.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchCat    = filterCat    === 'All' || a.category === filterCat;
    const matchStatus = filterStatus === 'All' || a.status   === filterStatus;
    return matchSearch && matchCat && matchStatus;
  }), [assets, debouncedSearch, filterCat, filterStatus]);

  const lowStockCount = useMemo(() =>
    assets.filter(a => a.quantity <= a.minQuantity).length,
  [assets]);

  // ── CSV Export ────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Asset ID','Name','Category','Location','Quantity','Unit','Status','Department','Cost','Purchase Date'];
    const rows = filtered.map(a => [a.assetId, a.name, a.category, a.location, a.quantity, a.unit, a.status, a.department, a.cost, a.purchaseDate]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'cit-inventory.csv'; a.click();
  };

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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {assets.length} total assets ·{' '}
            {lowStockCount > 0 && <span className="text-amber-500 font-semibold">{lowStockCount} low stock</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={16}/> Export
          </button>
          <button onClick={() => { setEditAsset(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-200">
            <Plus size={16}/> Add Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, department..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"/>
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="All">All Statuses</option>
          {STATUSES.map(s => <option key={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Asset ID','Name','Category','Location','Qty','Status','Department','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">No assets found</td></tr>
              ) : filtered.map((asset) => (
                <AssetRow
                  key={asset.assetId}
                  asset={asset}
                  onQr={setQrAsset}
                  onEdit={(a) => { setEditAsset(a); setShowModal(true); }}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Showing <strong>{filtered.length}</strong> of <strong>{assets.length}</strong> assets</p>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
              <AlertTriangle size={12}/> {lowStockCount} items need reorder
            </span>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <AssetModal
          asset={editAsset}
          onClose={() => { setShowModal(false); setEditAsset(null); }}
          onSave={handleSave}
        />
      )}
      {qrAsset && <QRModal asset={qrAsset} onClose={() => setQrAsset(null)}/>}
    </div>
  );
}

// ── Demo Data — CIT Chennai ───────────────────────────────────────────────
const DEMO_ASSETS = [
  { firestoreId: 'd1', _demo: true, assetId: 'CIT-0001', name: 'Dell OptiPlex 7090',         category: 'Fixed Assets',  location: 'CS Lab',        quantity: 20, minQuantity: 5,  unit: 'pcs', status: 'available',   department: 'Computer Science',          description: 'Core i7, 16GB RAM', purchaseDate: '2023-06-15', cost: '45000' },
  { firestoreId: 'd2', _demo: true, assetId: 'CIT-0002', name: 'Digital Oscilloscope',        category: 'Lab Equipment', location: 'ECE Lab',        quantity: 8,  minQuantity: 2,  unit: 'pcs', status: 'issued',      department: 'Electronics & Communication', description: '4-channel 50MHz',   purchaseDate: '2022-11-20', cost: '28000' },
  { firestoreId: 'd3', _demo: true, assetId: 'CIT-0003', name: 'Printer Toner HP 85A',        category: 'Consumables',   location: 'Admin Block',   quantity: 3,  minQuantity: 10, unit: 'box', status: 'available',   department: 'Admin',                     description: '',                  purchaseDate: '2024-01-10', cost: '1200'  },
  { firestoreId: 'd4', _demo: true, assetId: 'CIT-0004', name: 'Projector BenQ MX522',        category: 'Fixed Assets',  location: 'Seminar Hall',  quantity: 4,  minQuantity: 2,  unit: 'pcs', status: 'maintenance', department: 'Admin',                     description: 'XGA 3300 lumens',   purchaseDate: '2021-08-05', cost: '35000' },
  { firestoreId: 'd5', _demo: true, assetId: 'CIT-0005', name: 'Vernier Caliper',             category: 'Lab Equipment', location: 'Mechanical Lab',quantity: 15, minQuantity: 5,  unit: 'pcs', status: 'available',   department: 'Mechanical',                description: '0-150mm range',     purchaseDate: '2023-03-10', cost: '2500'  },
  { firestoreId: 'd6', _demo: true, assetId: 'CIT-0006', name: 'AutoCAD Workstation',         category: 'Fixed Assets',  location: 'Civil Lab',     quantity: 10, minQuantity: 3,  unit: 'pcs', status: 'available',   department: 'Civil',                     description: 'Licensed AutoCAD',  purchaseDate: '2023-07-22', cost: '55000' },
  { firestoreId: 'd7', _demo: true, assetId: 'CIT-0007', name: 'Arduino Uno Kit',             category: 'Lab Equipment', location: 'ECE Lab',        quantity: 25, minQuantity: 10, unit: 'pcs', status: 'available',   department: 'Electronics & Communication', description: 'With breadboard',   purchaseDate: '2024-01-05', cost: '800'   },
  { firestoreId: 'd8', _demo: true, assetId: 'CIT-0008', name: 'Whiteboard Markers (Box)',    category: 'Consumables',   location: 'Main Block',    quantity: 9,  minQuantity: 30, unit: 'box', status: 'available',   department: 'Admin',                     description: 'Multicolor set',   purchaseDate: '2024-02-01', cost: '350'   },
];
