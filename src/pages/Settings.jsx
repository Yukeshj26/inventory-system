import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, Bell, Shield, Building, Save, CheckCircle, Loader2 } from 'lucide-react';

// ── Shared — outside component ────────────────────────────────────────────
const inputCls = {
  width: '100%', padding: '9px 12px', background: '#f8fafc',
  border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13,
  outline: 'none', fontFamily: 'inherit', color: '#1e293b', boxSizing: 'border-box'
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>{label}</label>
    {children}
  </div>
);

const Toggle = ({ label, desc, value, onChange }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{label}</div>
      {desc && <div style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</div>}
    </div>
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? '#2563eb' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: '.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: '.2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
    </div>
  </div>
);

export default function Settings() {
  const user = auth.currentUser;
  const [saved, setSaved]           = useState(null);
  const [saving, setSaving]         = useState(null);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm]         = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState(false);

  const [form, setForm] = useState({
    displayName:    user?.displayName || '',
    email:          user?.email       || '',
    institution:    '',
    department:     '',
    role:           'Admin',
    academicYear:   '2025-2026',
    emailAlerts:    true,
    lowStockAlerts: true,
    approvalAlerts: true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Load settings from Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setForm(f => ({
            ...f,
            displayName:    d.displayName    || f.displayName,
            institution:    d.institution    || '',
            department:     d.department     || '',
            role:           d.role           || 'Admin',
            academicYear:   d.academicYear   || '2025-2026',
            emailAlerts:    d.emailAlerts    ?? true,
            lowStockAlerts: d.lowStockAlerts ?? true,
            approvalAlerts: d.approvalAlerts ?? true,
          }));
        }
      } catch (e) { console.error(e); }
    };
    load();
  }, [user]);

  // ── Save section to Firestore ─────────────────────────────────────────
  const handleSave = async (section) => {
    setSaving(section);
    try {
      if (section === 'profile' && user) {
        await updateProfile(user, { displayName: form.displayName });
      }
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName:    form.displayName,
          institution:    form.institution,
          department:     form.department,
          role:           form.role,
          academicYear:   form.academicYear,
          emailAlerts:    form.emailAlerts,
          lowStockAlerts: form.lowStockAlerts,
          approvalAlerts: form.approvalAlerts,
        }, { merge: true });
      }
      setSaved(section);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  // ── Change Password ───────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    if (pwForm.next.length < 6)         { setPwError('Password must be at least 6 characters.'); return; }
    try {
      const credential = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, pwForm.next);
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => { setPwSuccess(false); setShowPwModal(false); }, 2000);
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.');
      } else {
        setPwError(e.message);
      }
    }
  };

  const handleClearDemo   = () => {
    if (window.confirm('This will reload the page. Real Firestore data is unaffected. Continue?')) {
      window.location.reload();
    }
  };

  const handleDeleteAccount = () => {
    window.alert('To delete your account, please contact your TraceSphere administrator.');
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
        <button onClick={() => handleSave(section)}
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: saved === section ? '#f0fdf4' : '#2563eb', color: saved === section ? '#059669' : '#fff', border: saved === section ? '1px solid #bbf7d0' : 'none', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '.2s' }}>
          {saving === section
            ? <><Loader2 size={15} className="animate-spin"/> Saving...</>
            : saved  === section
            ? <><CheckCircle size={15}/> Saved!</>
            : <><Save size={15}/> Save Changes</>}
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>TraceSphere · Manage your account and platform preferences</p>
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
            <input style={inputCls} value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="e.g. Your College Name" />
          </Field>
          <Field label="Department">
            <input style={inputCls} value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Computer Science" list="dept-list" />
            <datalist id="dept-list">
              <option value="Computer Science" />
              <option value="Electronics & Communication" />
              <option value="Mechanical" />
              <option value="Civil" />
              <option value="Admin" />
              <option value="Library" />
            </datalist>
          </Field>
          <Field label="Academic Year">
            <select style={inputCls} value={form.academicYear} onChange={e => set('academicYear', e.target.value)}>
              <option>2025-2026</option>
              <option>2024-2025</option>
              <option>2023-2024</option>
            </select>
          </Field>
        </Card>

        {/* Notifications */}
        <Card icon={Bell} title="Notifications" desc="Alert preferences" color="#fffbeb" section="notifications">
          <Toggle label="Email Alerts"     desc="Receive alerts via email"            value={form.emailAlerts}    onChange={v => set('emailAlerts', v)} />
          <Toggle label="Low Stock Alerts" desc="Alert when items fall below minimum" value={form.lowStockAlerts} onChange={v => set('lowStockAlerts', v)} />
          <Toggle label="Approval Alerts"  desc="Notify on new purchase requests"     value={form.approvalAlerts} onChange={v => set('approvalAlerts', v)} />
        </Card>

        {/* Security */}
        <Card icon={Shield} title="Security" desc="Account security settings" color="#fff0f3">
          <div style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Password</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Update your account password</div>
            <button onClick={() => { setShowPwModal(true); setPwError(''); setPwSuccess(false); }}
              style={{ padding: '7px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Change Password
            </button>
          </div>
          <div style={{ padding: '10px 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 2 }}>Two-Factor Auth</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>Add an extra layer of security</div>
            <button onClick={() => window.alert('2FA coming soon in next update.')}
              style={{ padding: '7px 14px', background: '#f0fdf4', color: '#059669', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
          <button onClick={handleClearDemo}
            style={{ padding: '9px 18px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Clear All Demo Data
          </button>
          <button onClick={handleDeleteAccount}
            style={{ padding: '9px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Change Password</h3>
            {pwSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#059669', fontWeight: 600 }}>
                <CheckCircle size={32} style={{ margin: '0 auto 8px' }}/> Password updated successfully!
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <Field label="Current Password">
                  <input type="password" required style={inputCls} value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" />
                </Field>
                <Field label="New Password">
                  <input type="password" required style={inputCls} value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="Min. 6 characters" />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" required style={inputCls} value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter new password" />
                </Field>
                {pwError && <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{pwError}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowPwModal(false)}
                    style={{ flex: 1, padding: 10, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer', background: '#fff' }}>
                    Cancel
                  </button>
                  <button type="submit"
                    style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', background: '#2563eb' }}>
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
