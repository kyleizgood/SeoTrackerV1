import React, { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // Register state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setLoginError('Incorrect email or password.');
      } else {
        setLoginError('Login failed. Please try again.');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    try {
      await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      setRegSuccess('Registration successful! You can now log in.');
      setRegEmail('');
      setRegPassword('');
    } catch (err) {
      setRegError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(120deg, #e0e7ef 0%, #f7f6f2 100%)' }}>
      <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 32px #e0e7ef', padding: '2.5em 2.2em 2em 2.2em', minWidth: 340, maxWidth: 380, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/public/vite.svg" alt="Logo" style={{ width: 48, marginBottom: 8 }} />
          <h1 style={{ fontWeight: 800, fontSize: '2.1em', letterSpacing: '0.04em', color: '#1976d2', margin: 0 }}>SEO Tracker</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <button onClick={() => setTab('login')} style={{
            background: tab === 'login' ? 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)' : '#f7f6f2',
            color: tab === 'login' ? '#fff' : '#232323',
            border: 'none',
            borderRadius: '12px 0 0 12px',
            fontWeight: 700,
            fontSize: '1.08em',
            padding: '0.7em 1.6em',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            boxShadow: tab === 'login' ? '0 2px 8px #e0e7ef' : 'none',
          }}>Login</button>
          <button onClick={() => setTab('register')} style={{
            background: tab === 'register' ? 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)' : '#f7f6f2',
            color: tab === 'register' ? '#fff' : '#232323',
            border: 'none',
            borderRadius: '0 12px 12px 0',
            fontWeight: 700,
            fontSize: '1.08em',
            padding: '0.7em 1.6em',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            boxShadow: tab === 'register' ? '0 2px 8px #e0e7ef' : 'none',
          }}>Register</button>
        </div>
        {tab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" required style={{ padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em' }} />
            <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" required style={{ padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em' }} />
            <button type="submit" style={{ background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1.1em', padding: '0.8em 0', marginTop: 6, cursor: 'pointer', boxShadow: '0 2px 8px #e0e7ef' }}>Login</button>
            {loginError && <div style={{ color: '#c00', fontWeight: 600, marginTop: 4 }}>{loginError}</div>}
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email" required style={{ padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em' }} />
            <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Password" required style={{ padding: '0.9em 1em', borderRadius: 10, border: '1.5px solid #b6b6d8', fontSize: '1.08em' }} />
            <button type="submit" style={{ background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1.1em', padding: '0.8em 0', marginTop: 6, cursor: 'pointer', boxShadow: '0 2px 8px #e0e7ef' }}>Register</button>
            {regError && <div style={{ color: '#c00', fontWeight: 600, marginTop: 4 }}>{regError}</div>}
            {regSuccess && <div style={{ color: '#1976d2', fontWeight: 600, marginTop: 4 }}>{regSuccess}</div>}
          </form>
        )}
      </div>
    </div>
  );
} 