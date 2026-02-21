import React, { useState } from 'react';
import { auth } from '../services/firebaseConfig';
import { updateProfile } from 'firebase/auth';
import { User, Bell, Shield, Building, Palette, Save, CheckCircle } from 'lucide-react';

export default function Settings() {
  const user = auth.currentUser;
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    institution: 'Chennai Institute of Technology',
    department: '',
    role: 'Admin',
    emailAlerts: true,
    lowStockAlerts: true,
    approvalAlerts: true,
    theme: 'light',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (section) => {
    try {
      if (section === 'profile' && user) {
        await updateProfile(user, { displayName: form.displayName });
      }
      setSaved(section);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const inputCls = {
    width: '100%', padding: '9px 12px', background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13,
    outline: 'none', fontFamily: 'inherit', color: '#1e293b'
  };

  const Card = ({ icon: Icon, title, desc, color, children, section }) => (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="#2563eb" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{desc}</div>
        </div>
      </div>
      {children}
      {section && (
        <button
          onClick={() => handleSave(section)}
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saved === section ? '#f0fdf4' : '#2563eb', color: saved === section ? '#059669' : '#fff', border: saved === section ? '1px solid #bbf7d0' : 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '.2s' }}>
          {saved === section ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      )}
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#2563eb' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '.2s' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: '.2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
      </div>
    </div>
  );

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Manage your account and platform preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Profile */}
        <Card icon={User} title="Profile" desc="Your account information" color="#eff6ff" section="profile">
          <Field label="Display Name">
            <input style={inputCls} value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Email Address">
            <input style={{ ...inputCls, background: '#f1f5f9', color: '#94a3b8' }} value={form.email} readOnly />
          </Field>
          <Field label="Role">
            <select style={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
              <option>Admin</option>
              <option>Staff</option>
              <option>Auditor</option>
              <option>HOD</option>
            </select>
          </Field>
        </Card>

        {/* Institution */}
        <Card icon={Building} title="Institution" desc="Campus and department details" color="#f0fdf4" section="institution">
          <Field label="Institution Name">
            <input style={inputCls} value={form.institution} onChange={e => set('institution', e.target.value)} />
          </Field>
          <Field label="Department">
            <input style={inputCls} value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Computer Science" />
          </Field>
          <Field label="Academic Year">
            <select style={inputCls}>
              <option>2025-2026</option>
              <option>2024-2025</option>
            </select>
          </Field>
        </Card>

        {/* Notifications */}
        <Card icon={Bell} title="Notifications" desc="Alert preferences" color="#fffbeb" section="notifications">
          <Toggle label="Email Alerts"       desc="Receive alerts via email"              value={form.emailAlerts}    onChange={v => set('emailAlerts', v)} />
          <Toggle label="Low Stock Alerts"   desc="Alert when items fall below minimum"   value={form.lowStockAlerts} onChange={v => set('lowStockAlerts', v)} />
          <Toggle label="Approval Alerts"    desc="Notify on new purchase requests"       value={form.approvalAlerts} onChange={v => set('approvalAlerts', v)} />
        </Card>

        {/* Security */}
        <Card icon={Shield} title="Security" desc="Account security settings" color="#fff0f3">
          <div style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Password</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Last changed 30 days ago</div>
            <button style={{ padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Change Password
            </button>
          </div>
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Two-Factor Auth</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Add an extra layer of security</div>
            <button style={{ padding: '7px 14px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Enable 2FA
            </button>
          </div>
        </Card>

      </div>

      {/* Danger Zone */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #fecaca', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.04)', marginTop: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Danger Zone</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>These actions are irreversible. Please be certain.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '9px 18px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Clear All Demo Data
          </button>
          <button style={{ padding: '9px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
