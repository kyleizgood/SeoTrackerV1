import React, { useState, useEffect } from 'react';
import { auth, db, storage } from './firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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

// Add a list of motivational quotes
const MOTIVATIONAL_QUOTES = [
  "Small steps every day!",
  "Progress, not perfection.",
  "You are your only limit.",
  "Dream big, start small.",
  "Stay positive, work hard, make it happen.",
  "Every day is a fresh start.",
  "Believe you can and you're halfway there.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Don't watch the clock; do what it does. Keep going.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Doubt kills more dreams than failure ever will.",
  "The secret of getting ahead is getting started.",
  "Little by little, a little becomes a lot.",
  "You don’t have to be perfect to be amazing.",
  "Start where you are. Use what you have. Do what you can.",
  "Don’t limit your challenges. Challenge your limits.",
  "It always seems impossible until it’s done.",
  "You are capable of amazing things.",
  "The best way to get something done is to begin.",
  "Don’t be afraid to fail. Be afraid not to try.",
  "Strive for progress, not perfection.",
  "You don’t have to go fast. You just have to go.",
  "Success doesn’t come from what you do occasionally, it comes from what you do consistently.",
  "Difficult roads often lead to beautiful destinations.",
  "The journey of a thousand miles begins with one step.",
  "You are stronger than you think.",
  "Don’t stop until you’re proud.",
  "One day or day one. You decide.",
  "Your only limit is your mind.",
  "If it doesn’t challenge you, it won’t change you.",
  "You’ve got this.",
  "Be the energy you want to attract.",
  "Don’t wish for it. Work for it.",
  "The best view comes after the hardest climb.",
  "Make today count.",
  "You are enough.",
  "Keep going. Everything you need will come to you.",
  "Don’t give up. Great things take time.",
  "You can do hard things.",
  "Stay patient and trust your journey.",
  "Be proud of how far you’ve come.",
  "Your future is created by what you do today, not tomorrow.",
  "Act as if what you do makes a difference. It does.",
  "The only way to do great work is to love what you do.",
  "You are braver than you believe, stronger than you seem, and smarter than you think.",
  "Success is not for the lazy.",
  "Don’t let yesterday take up too much of today.",
  "Dare to be different.",
  "You are unstoppable.",
  "Focus on the step in front of you, not the whole staircase."
];

const ProfilePage = ({ onProfileUpdate }) => {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState(''); // <-- add bio state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedGif, setSelectedGif] = useState(user?.photoURL && GIF_AVATARS.includes(user.photoURL) ? user.photoURL : '');
  const [customUrl, setCustomUrl] = useState(user?.photoURL && !GIF_AVATARS.includes(user.photoURL) ? user.photoURL : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  // Add toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setSelectedGif(user.photoURL || '');
      setCustomUrl(user.photoURL || '');
      // Fetch bio from Firestore
      import('./firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          getDoc(doc(db, 'users', user.uid)).then(docSnap => {
            if (docSnap.exists()) {
              setBio(docSnap.data().bio || '');
            }
          });
        });
      });
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
      // Update Firebase Auth profile (displayName and photoURL)
      await updateProfile(user, { displayName, photoURL: avatarUrl });
      // Update Firestore (displayName, photoURL, and bio)
      await setDoc(doc(db, 'users', user.uid), { displayName, photoURL: avatarUrl, bio }, { merge: true });
      if (onProfileUpdate) onProfileUpdate({ displayName, photoURL: avatarUrl, bio });
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 2000);
      // Add toast for save
      setToastMessage('Profile updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
      display: 'block',
      padding: '48px 0 48px 0',
      overflowY: 'auto',
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
      <section className="profile-card" style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, boxShadow: '0 2px 24px #e0e7ef', padding: 36, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8, fontWeight: 900, fontSize: '2.3em', letterSpacing: '0.01em', color: '#1976d2' }}>Profile Settings</h2>
        <div style={{ color: '#43a047', fontWeight: 700, fontSize: 18, marginBottom: 10, textAlign: 'center' }}>{MOTIVATIONAL_QUOTES[(new Date().getFullYear() * 366 + new Date().getMonth() * 31 + new Date().getDate()) % MOTIVATIONAL_QUOTES.length]}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18 }}>
          <div style={{
            background: 'linear-gradient(135deg, #1976d2 60%, #ffd600 100%)',
            padding: 4,
            borderRadius: '50%',
            boxShadow: '0 0 0 6px #ffd600, 0 2px 12px #e0e7ef',
            marginBottom: 10,
          }}>
            <div className="avatar-anim" style={{ width: 110, height: 110, borderRadius: '50%', background: '#2196f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, color: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px #e0e7ef', transition: 'box-shadow 0.25s' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : user?.email?.slice(0,2).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div style={{ background: '#ffd600', color: '#1976d2', fontWeight: 800, fontSize: 18, borderRadius: 12, padding: '6px 22px', marginBottom: 10, boxShadow: '0 2px 8px #e0e7ef', letterSpacing: '0.01em' }}>Profile Complete</div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2', margin: '10px 0 8px 0', textAlign: 'center' }}>Choose a GIF Avatar</div>
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
                borderRadius: 14,
                border: avatarUrl === gif ? '3px solid #1976d2' : '2px solid #e0e7ef',
                cursor: 'pointer',
                objectFit: 'cover',
                boxShadow: avatarUrl === gif ? '0 2px 8px #1976d2aa' : '0 1px 4px #e0e7ef',
                transition: 'border 0.18s, box-shadow 0.18s',
                outline: avatarUrl === gif ? '3px solid #ffd600' : 'none',
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
        {/* Unified minimalist card for the rest of the form */}
        <div style={{ width: '100%', margin: '28px 0 0 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Profile Completion</div>
          <div style={{ width: '100%', height: 14, background: '#f0f4fa', borderRadius: 8, overflow: 'hidden', marginBottom: 2, boxShadow: '0 1px 4px #e0e7ef' }}>
            <div style={{ width: `${profileCompletion}%`, height: '100%', background: profileCompletion === 100 ? 'linear-gradient(90deg, #81c784 60%, #1976d2 100%)' : 'linear-gradient(90deg, #ffd600 60%, #ff9800 100%)', borderRadius: 8, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 13, color: profileCompletion === 100 ? '#388e3c' : '#b26a00', fontWeight: 600, marginBottom: 10 }}>{profileCompletion}% Complete</div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
            <label style={{ fontWeight: 600, marginBottom: 2 }}>Display Name
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="profile-input" style={{ marginTop: 4, border: 'none', borderBottom: '2px solid #e0e7ef', borderRadius: 0, background: '#f7fafd', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderBottom = '2.5px solid #1976d2'} onBlur={e => e.target.style.borderBottom = '2px solid #e0e7ef'} />
            </label>
            <label style={{ fontWeight: 600, marginBottom: 2 }}>Email
              <input type="email" value={email} readOnly className="profile-input" style={{ marginTop: 4, border: 'none', borderBottom: '2px solid #e0e7ef', borderRadius: 0, background: '#f7fafd', color: '#888', cursor: 'not-allowed' }} />
            </label>
            <label style={{ fontWeight: 600, marginBottom: 2 }}>Bio
              <textarea value={bio} onChange={e => setBio(e.target.value)} className="profile-input" rows={3} maxLength={200} placeholder="Tell others about yourself (max 200 chars)" style={{ resize: 'vertical', minHeight: 60, marginTop: 4, border: 'none', borderBottom: '2px solid #e0e7ef', borderRadius: 0, background: '#f7fafd', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderBottom = '2.5px solid #1976d2'} onBlur={e => e.target.style.borderBottom = '2px solid #e0e7ef'} />
              <div style={{ fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 }}>{bio.length}/200</div>
            </label>
            <div style={{ height: 1, background: '#e0e7ef', borderRadius: 1, margin: '8px 0' }} />
            <label style={{ fontWeight: 600, marginBottom: 2 }}>Current Password
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="profile-input" placeholder="Enter current password to change password" style={{ marginTop: 4, border: 'none', borderBottom: '2px solid #e0e7ef', borderRadius: 0, background: '#f7fafd', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderBottom = '2.5px solid #1976d2'} onBlur={e => e.target.style.borderBottom = '2px solid #e0e7ef'} />
            </label>
            <label style={{ fontWeight: 600, marginBottom: 2 }}>New Password
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="profile-input" placeholder="Leave blank to keep current" style={{ marginTop: 4, border: 'none', borderBottom: '2px solid #e0e7ef', borderRadius: 0, background: '#f7fafd', transition: 'border-color 0.2s', outline: 'none' }} onFocus={e => e.target.style.borderBottom = '2.5px solid #1976d2'} onBlur={e => e.target.style.borderBottom = '2px solid #e0e7ef'} />
            </label>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: 'linear-gradient(90deg, #1976d2 60%, #81c784 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 0',
                fontWeight: 800,
                fontSize: '1.1em',
                marginTop: 10,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px #e0e7ef',
                transition: 'background 0.18s, color 0.18s, box-shadow 0.18s',
                letterSpacing: '0.01em',
                opacity: saving ? 0.7 : 1,
              }}
            >{saving ? 'Saving...' : 'Save Changes'}</button>
            {error && <div style={{ color: '#c00', marginTop: 8 }}>{error}</div>}
          </form>
        </div>
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
      {/* Add toast notification */}
      {showToast && (
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
          ✅ {toastMessage}
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 