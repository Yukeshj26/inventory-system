import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './services/firebaseConfig';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Procurement from './pages/Procurement';
import Inventory from './pages/Inventory';
import Scanner from './pages/Scanner';
import Approvals from './pages/Approvals';

function App() {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('authUser');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!localStorage.getItem('authUser'));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const cached = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        localStorage.setItem('authUser', JSON.stringify(cached));
        setUser(firebaseUser);
      } else {
        localStorage.removeItem('authUser');
        setUser(null);
      }
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
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

        <Route
          path="/*"
          element={
            user ? (
              <div className="flex bg-gray-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 p-8">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/scanner" element={<Scanner />} />
                    <Route path="/approvals" element={<Approvals />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
