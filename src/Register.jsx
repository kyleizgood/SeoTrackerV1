import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Add user to Firestore for chat system
      await setDoc(doc(db, 'users', user.uid), {
        displayName,
        email: user.email,
        photoURL: user.photoURL || '',
        status: 'online',
        createdAt: new Date()
      });
      // Clear chat user cache to force fresh fetch
      localStorage.removeItem('chat_user_cache_v1');
      alert('Registration successful! You can now log in.');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleRegister} style={{marginBottom: 24}}>
      <h2>Register</h2>
      <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Register</button>
      {error && <div style={{color:'red'}}>{error}</div>}
    </form>
  );
} 