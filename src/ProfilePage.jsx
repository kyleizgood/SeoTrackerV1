import React, { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const GIF_AVATARS = [
  'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGp4Zms1eDB0aGQ1ZXMybjNjdjVkNXIyN2xmN3Z3amZmYmlta2FxNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UYzNgRSTf9X1e/giphy.gif',
  'https://media.tenor.com/I52W87bM7K8AAAAj/anime-aaaa.gif',
  'https://media.tenor.com/AUaTmhkdY-0AAAAj/tea-the-khajiit-cute.gif',
  'https://media1.tenor.com/m/P7hCyZlzDH4AAAAd/wink-anime.gif',
  'https://media1.tenor.com/m/xCv9kpxFGEYAAAAd/anya-forger.gif',
  'https://media.tenor.com/Lp97Wy2LPdEAAAAj/nonono-anime-no.gif',
  'https://media.tenor.com/AjfRZZrv_uMAAAAj/cute-anime.gif',
  'https://media.tenor.com/Tv8fJWb2NlkAAAAj/anime-angry-anime.gif',
  'https://media.tenor.com/pMxLooaqEv0AAAAj/shy-girl-anime.gif',
  'https://media1.tenor.com/m/21LeAZoJ-X4AAAAd/anime-anime-girl.gif',
];

const getProfileCompletion = (user, displayName, photoURL) => {
  let complete = 0;
  if (displayName) complete += 1;
  if (user?.email) complete += 1;
  if (photoURL) complete += 1;
  return Math.round((complete / 3) * 100);
};

const ProfilePage = ({ onProfileUpdate }) => {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedGif, setSelectedGif] = useState(user?.photoURL && GIF_AVATARS.includes(user.photoURL) ? user.photoURL : '');
  const [customUrl, setCustomUrl] = useState(user?.photoURL && !GIF_AVATARS.includes(user.photoURL) ? user.photoURL : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setSelectedGif(user.photoURL || '');
      setCustomUrl(user.photoURL || '');
    }
  }, [user]);

  const avatarUrl = customUrl || selectedGif || user?.photoURL || '';

  const handleGifSelect = (gif) => {
    setSelectedGif(gif);
    setCustomUrl('');
  };
  const handleCustomUrlChange = (e) => {
    setCustomUrl(e.target.value);
    setSelectedGif('');
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Update Firebase Auth profile
      await updateProfile(user, { photoURL: avatarUrl });
      // Update Firestore
      await setDoc(doc(db, 'users', user.uid), { photoURL: avatarUrl }, { merge: true });
      if (onProfileUpdate) onProfileUpdate({ photoURL: avatarUrl });
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 2000);
    } catch (err) {
      setError('Failed to update profile.');
    }
    setSaving(false);
  };

  const profileCompletion = getProfileCompletion(user, displayName, avatarUrl);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #e0e7ef 0%, #f5f7fa 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2vw',
    }}>
      <style>{`
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(32px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .profile-card {
          animation: cardFadeIn 0.6s cubic-bezier(.4,0,.2,1);
        }
        .avatar-anim:hover {
          box-shadow: 0 0 0 5px #1976d2aa, 0 2px 8px #e0e7ef;
          transition: box-shadow 0.25s;
        }
        .divider-line { width: 100%; height: 1.5px; background: #e0e7ef; margin: 18px 0; border-radius: 2px; }
        .profile-btn {
          background: linear-gradient(90deg, #1976d2 60%, #81c784 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 0;
          font-weight: 700;
          font-size: 1.08em;
          margin-top: 10px;
          cursor: pointer;
          box-shadow: 0 2px 8px #e0e7ef;
          transition: background 0.18s, color 0.18s, box-shadow 0.18s;
        }
        .profile-btn:active {
          background: #1976d2;
        }
        .profile-card input, .profile-card label {
          font-size: 1.08em;
        }
        .profile-input {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1.5px solid #bdbdbd;
          margin-top: 6px;
          box-sizing: border-box;
          background: #2222 0 0 no-repeat padding-box;
          color: #222;
        }
        .profile-input[readonly] {
          background: #f5f7fa;
          color: #888;
          cursor: not-allowed;
        }
        @media (max-width: 600px) {
          .profile-card { padding: 18px !important; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-16px) scale(0.98); }
          10% { opacity: 1; transform: translateY(0) scale(1); }
          90% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-16px) scale(0.98); }
        }
      `}</style>
      <section className="profile-card" style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px #e0e7ef', padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 18, fontWeight: 800, fontSize: '2em', letterSpacing: '0.01em', color: '#1976d2' }}>Profile Settings</h2>
        <div className="divider-line" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div className="avatar-anim" style={{ width: 100, height: 100, borderRadius: '50%', background: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#fff', overflow: 'hidden', marginBottom: 8, boxShadow: '0 2px 8px #e0e7ef', transition: 'box-shadow 0.25s' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.slice(0,2).toUpperCase()}</span>
            )}
          </div>
          {/* GIF avatar grid */}
          <div style={{ fontWeight: 600, fontSize: 15, margin: '10px 0 8px 0', color: '#1976d2' }}>Choose a GIF Avatar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 56px)', gap: 12, marginBottom: 12 }}>
            {GIF_AVATARS.map((gif, i) => (
              <img
                key={gif}
                src={gif}
                alt={`GIF avatar ${i+1}`}
                onClick={() => handleGifSelect(gif)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  border: avatarUrl === gif ? '3px solid #1976d2' : '2px solid #e0e7ef',
                  cursor: 'pointer',
                  objectFit: 'cover',
                  boxShadow: avatarUrl === gif ? '0 2px 8px #1976d2aa' : '0 1px 4px #e0e7ef',
                  transition: 'border 0.18s, box-shadow 0.18s',
                }}
              />
            ))}
          </div>
          <label style={{ fontSize: 15, color: '#1976d2', fontWeight: 600, marginTop: 8, width: '100%' }}>
            Or use your own Avatar Image/GIF URL
            <input
              type="url"
              value={customUrl}
              onChange={handleCustomUrlChange}
              placeholder="Paste image or GIF URL (e.g., from Imgur)"
              className="profile-input"
            />
          </label>
        </div>
        <div style={{ width: '100%', marginBottom: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Profile Completion</div>
          <div style={{ width: '100%', height: 10, background: '#e0e7ef', borderRadius: 8, overflow: 'hidden', marginBottom: 2 }}>
            <div style={{ width: `${profileCompletion}%`, height: '100%', background: profileCompletion === 100 ? 'linear-gradient(90deg, #81c784 60%, #1976d2 100%)' : 'linear-gradient(90deg, #ffd600 60%, #ff9800 100%)', borderRadius: 8, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 13, color: profileCompletion === 100 ? '#388e3c' : '#b26a00', fontWeight: 600 }}>{profileCompletion}% Complete</div>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
          <label style={{ fontWeight: 600 }}>Display Name
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="profile-input" />
          </label>
          <label style={{ fontWeight: 600 }}>Email
            <input type="email" value={email} readOnly className="profile-input" />
          </label>
          <label style={{ fontWeight: 600 }}>Current Password
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="profile-input" placeholder="Enter current password to change password" />
          </label>
          <label style={{ fontWeight: 600 }}>New Password
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="profile-input" placeholder="Leave blank to keep current" />
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="profile-btn"
          >{saving ? 'Saving...' : 'Save Changes'}</button>
          {error && <div style={{ color: '#c00', marginTop: 8 }}>{error}</div>}
        </form>
      </section>
      {/* Stylish confirmation dialog */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #81c784 60%, #1976d2 100%)',
          color: '#fff',
          borderRadius: 12,
          padding: '14px 38px',
          fontWeight: 700,
          fontSize: '1.15em',
          boxShadow: '0 2px 16px #e0e7ef',
          zIndex: 3000,
          letterSpacing: '0.02em',
          textAlign: 'center',
          animation: 'fadeInOut 2s',
        }}>
          Profile updated successfully!
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 