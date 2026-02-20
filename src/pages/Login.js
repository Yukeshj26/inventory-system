import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, loginEmail } from '../services/authService';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { ShieldCheck, Mail, Lock, Loader2, UserPlus, LogIn, KeyRound, ArrowLeft } from 'lucide-react';

// view: 'login' | 'signup' | 'forgot'
const Login = () => {
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const resetForm = (nextView) => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setMessage('');
    setView(nextView);
  };

  // ── Google Login ──────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email Login ───────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginEmail(email, password);
      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found':   setMessage('No account found with this email.'); break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential': setMessage('Incorrect email or password.'); break;
        default: setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ───────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setMessage('Passwords do not match.'); return; }
    if (password.length < 6) { setMessage('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use': setMessage('An account with this email already exists.'); break;
        case 'auth/invalid-email':        setMessage('Invalid email address.'); break;
        default: setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Reset link sent! Check your inbox.');
    } catch (error) {
      switch (error.code) {
        case 'auth/user-not-found': setMessage('No account found with this email.'); break;
        case 'auth/invalid-email':  setMessage('Invalid email address.'); break;
        default: setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Branding Section */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <ShieldCheck size={32} />
            <span className="text-2xl font-bold">CampusAsset AI</span>
          </div>
          <h1 className="text-4xl font-bold">Unified Inventory Control</h1>
          <p className="mt-4 text-blue-100">Traceability, Transparency, and Predictive Restocking.</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100">

          {/* ── LOGIN VIEW ── */}
          {view === 'login' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-500 text-sm">Access the central inventory node</p>
              </div>

              <button onClick={handleGoogleLogin} disabled={loading}
                className="w-full flex items-center justify-center space-x-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium mb-6 disabled:opacity-50 disabled:cursor-not-allowed">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="Google" />
                <span>{loading ? 'Signing in...' : 'Google Workspace'}</span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-gray-400 font-semibold tracking-widest">OR</span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="email" required value={email} className={inputCls}
                      placeholder="admin@campus.edu" onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                    <button type="button" onClick={() => resetForm('forgot')}
                      className="text-xs text-blue-600 hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="password" required value={password} className={inputCls}
                      placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                {message && <p className="text-xs text-red-500 font-medium">{message}</p>}
                <button disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={16}/> Login to Dashboard</>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button onClick={() => resetForm('signup')} className="text-blue-600 font-semibold hover:underline">
                  Sign Up
                </button>
              </p>
            </>
          )}

          {/* ── SIGN UP VIEW ── */}
          {view === 'signup' && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-500 text-sm">Register for inventory access</p>
              </div>

              <button onClick={handleGoogleLogin} disabled={loading}
                className="w-full flex items-center justify-center space-x-3 border border-gray-200 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium mb-6 disabled:opacity-50 disabled:cursor-not-allowed">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5" alt="Google" />
                <span>{loading ? 'Signing up...' : 'Continue with Google'}</span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 bg-white text-gray-400 font-semibold tracking-widest">OR</span>
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="email" required value={email} className={inputCls}
                      placeholder="you@campus.edu" onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="password" required value={password} className={inputCls}
                      placeholder="Min. 6 characters" onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="password" required value={confirmPassword} className={inputCls}
                      placeholder="Re-enter password" onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                {message && <p className="text-xs text-red-500 font-medium">{message}</p>}
                <button disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={16}/> Create Account</>}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => resetForm('login')} className="text-blue-600 font-semibold hover:underline">
                  Sign In
                </button>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === 'forgot' && (
            <>
              <button onClick={() => resetForm('login')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
                <ArrowLeft size={15}/> Back to Sign In
              </button>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={24} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                <p className="text-gray-500 text-sm mt-1">We'll send a reset link to your email</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="email" required value={email} className={inputCls}
                      placeholder="admin@campus.edu" onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                {message && (
                  <p className={`text-xs font-medium ${message.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}
                <button disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <><KeyRound size={16}/> Send Reset Link</>}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
