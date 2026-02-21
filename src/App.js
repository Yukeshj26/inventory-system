import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/firebaseConfig';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Procurement from './pages/Procurement';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import Approvals from './pages/Approvals';
import Reports  from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* ✅ redirect to / not /Dashboard */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
        <Route
          path="/*"
          element={
            user ? (
              <div className="flex bg-gray-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    {/* ✅ no leading slash on nested routes */}
                    <Route path="inventory"  element={<Inventory />} />
                    <Route path="scanner"    element={<Scanner />} />
                    <Route path="approvals"  element={<Approvals />} />
                    <Route path="procurement" element={<Procurement />} />
                    <Route path="reports"   element={<Reports />} />
                    <Route path="settings"  element={<Settings />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;