import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, ScanLine, ClipboardCheck,
  BarChart3, Settings, LogOut, ShieldCheck, ChevronRight
} from 'lucide-react';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory',  icon: Package,         label: 'Inventory' },
  { to: '/approvals',  icon: ClipboardCheck,  label: 'Approvals' },
  { to: '/procurement', icon: Package, label: 'Procurement' },
  { to: '/scanner',    icon: ScanLine,        label: 'QR Scanner' },
  { to: '/reports',    icon: BarChart3,       label: 'Reports' },
  { to: '/settings',   icon: Settings,        label: 'Settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(auth.currentUser);
 useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return () => unsub();
  }, []);
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">TraceSphere</p>
            <p className="text-blue-400 text-xs">Inventory Platform</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Profile + Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.displayName || 'User'}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
