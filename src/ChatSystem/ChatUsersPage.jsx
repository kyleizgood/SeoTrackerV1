import React, { useState, useRef } from 'react';
import { useChat } from './ChatManager';
import { getAuth } from 'firebase/auth';
import { createPortal } from 'react-dom';

const ChatUsersPage = () => {
  const { userList, openChat } = useChat();
  const currentUser = getAuth().currentUser;
  const [search, setSearch] = useState('');
  const [hoveredUser, setHoveredUser] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [cardHover, setCardHover] = useState(false);
  const [nicknames, setNicknames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userNicknames') || '{}');
    } catch {
      return {};
    }
  });
  const [nicknameInput, setNicknameInput] = useState('');
  const [editingNickname, setEditingNickname] = useState(null);
  const listRef = useRef();
  const hidePopupTimeout = useRef(null); // <-- add this
  const [bioCache, setBioCache] = useState({}); // userId -> bio

  // Helper to save nickname locally
  const saveNickname = (userId, nickname) => {
    const newNicks = { ...nicknames, [userId]: nickname };
    setNicknames(newNicks);
    localStorage.setItem('userNicknames', JSON.stringify(newNicks));
  };

  // Sort users: online > away > offline
  const sortedUsers = Array.isArray(userList)
    ? [...userList].filter(u => u && (u.displayName || u.email) && (!currentUser || u.id !== currentUser.uid))
        .sort((a, b) => {
          const statusOrder = { online: 0, away: 1, offline: 2 };
          const aStatus = statusOrder[a.status] ?? 2;
          const bStatus = statusOrder[b.status] ?? 2;
          return aStatus - bStatus;
        })
    : [];
  // Filter by search
  const filteredUsers = sortedUsers.filter(u =>
    (u.displayName && u.displayName.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );
  const hasUsers = filteredUsers.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #e0e7ef 0%, #f5f7fa 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '48px 0 48px 0',
      overflowY: 'auto',
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    }}>
      <section style={{
        maxWidth: 420,
        width: '100%',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 2px 24px #e0e7ef',
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        position: 'relative',
        margin: '0 auto',
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: 8,
          fontWeight: 800,
          fontSize: '2em',
          letterSpacing: '0.01em',
          color: '#1976d2',
          textShadow: '0 2px 8px #e0e7ef',
        }}>Chat Users</h1>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 10, fontWeight: 500, textAlign: 'center' }}>
          Start a chat with any registered user. <span style={{ color: '#81c784', fontWeight: 700 }}>Say hi! 👋</span>
        </div>
        <div style={{ width: '100%', height: 2, background: 'linear-gradient(90deg, #e0e7ef 0%, #81c784 100%)', borderRadius: 2, margin: '0 0 18px 0' }} />
        {/* Search bar */}
        <div style={{ marginTop: 18, marginBottom: 24, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 240 }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#1976d2',
              fontSize: 20,
              pointerEvents: 'none',
              opacity: 0.85
            }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: 18,
                border: '1.5px solid #e0e7ef',
                fontSize: 16,
                background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
                boxShadow: '0 2px 8px #e0e7ef',
                outline: 'none',
                transition: 'border 0.18s, box-shadow 0.18s',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #1976d2'}
              onBlur={e => e.target.style.border = '1.5px solid #e0e7ef'}
            />
          </div>
        </div>
        {/* User list */}
        <ul
          ref={listRef}
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            maxHeight: 420,
            overflowY: 'auto',
            marginTop: 10,
            width: '100%',
            border: '1.5px solid #e0e7ef',
            borderRadius: 14,
            background: 'linear-gradient(90deg, #f7f6f2 60%, #e0e7ef 100%)',
            boxShadow: '0 2px 8px #e0e7ef',
            position: 'relative',
          }}>
          {hasUsers ? (
            filteredUsers.map(u => {
              const nickname = nicknames[u.id] || '';
              
              // Debug logging
              console.log(`Rendering user ${u.displayName || u.email}:`, {
                status: u.status,
                lastOnlineText: u.lastOnlineText,
                hasLastOnlineText: !!u.lastOnlineText
              });
              
              return (
                <li key={u.id} style={{ marginBottom: 16, width: '100%', position: 'relative' }}>
                  <button
                    onClick={() => openChat(u)}
                    onMouseEnter={e => {
                      if (hidePopupTimeout.current) {
                        clearTimeout(hidePopupTimeout.current);
                        hidePopupTimeout.current = null;
                      }
                      setHoveredUser(u.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    onMouseLeave={() => {
                      hidePopupTimeout.current = setTimeout(() => {
                        if (!cardHover) setHoveredUser(null);
                      }, 250);
                    }}
                    onMouseMove={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoverPos({ x: rect.left + rect.width / 2, y: rect.top });
                    }}
                    style={{
                      width: '100%',
                      minWidth: 220,
                      background: '#fff',
                      border: '1.5px solid #e0e7ef',
                      borderRadius: 12,
                      padding: '12px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      fontSize: 16,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px #f0f0f0',
                      overflow: 'visible',
                      whiteSpace: 'normal',
                      transition: 'box-shadow 0.18s, border 0.18s, background 0.18s',
                      marginBottom: 2,
                      position: 'relative',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = '#e0e7ef';
                      e.currentTarget.style.boxShadow = '0 4px 16px #b6b6d8';
                      e.currentTarget.style.border = '1.5px solid #1976d2';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = '#fff';
                      e.currentTarget.style.boxShadow = '0 2px 8px #f0f0f0';
                      e.currentTarget.style.border = '1.5px solid #e0e7ef';
                    }}
                  >
                    {/* Avatar */}
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName || u.email}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          background: '#eee',
                          border: '2px solid #1976d2',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: '#1976d2',
                        color: '#fff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 18,
                        flexShrink: 0,
                      }}>
                        {u.displayName && u.displayName.length > 0
                          ? u.displayName[0]
                          : u.email && u.email.length > 0
                            ? u.email[0]
                            : "?"}
                      </span>
                    )}
                    {/* Display Name */}
                    <span style={{
                      fontWeight: 600,
                      fontSize: 17,
                      color: '#222',
                      flex: 1,
                      overflow: 'visible',
                      whiteSpace: 'normal',
                      textOverflow: 'clip',
                      minWidth: 0,
                    }}>
                      {u.displayName || u.email || u.id}
                      {nickname && (
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#888', marginLeft: 6 }}>
                          ({nickname})
                        </span>
                      )}
                    </span>
                    {/* Online/Offline Indicator */}
                    {u.status === 'online' && (
                      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: '#43a047', fontSize: 18 }} title="Online">●</span>
                        <span style={{ 
                          color: '#43a047', 
                          fontSize: 11, 
                          marginTop: 2,
                          fontStyle: 'italic'
                        }} title="Online">
                          Online
                        </span>
                      </div>
                    )}
                    {u.status === 'away' && (
                      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: '#fbc02d', fontSize: 18 }} title="Away">●</span>
                        <span style={{ 
                          color: '#fbc02d', 
                          fontSize: 11, 
                          marginTop: 2,
                          fontStyle: 'italic'
                        }} title="Away">
                          Away
                        </span>
                      </div>
                    )}
                    {(u.status === 'offline' || !u.status) && (
                      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ color: '#888', fontSize: 18 }} title="Offline">●</span>
                        <span style={{ 
                          color: '#999', 
                          fontSize: 11, 
                          marginTop: 2,
                          fontStyle: 'italic'
                        }} title={`Last online: ${u.lastOnlineText || 'Unknown'}`}>
                          {u.lastOnlineText ? `last online ${u.lastOnlineText}` : 'Unknown'}
                        </span>
                      </div>
                    )}
                  </button>
                  {/* Mini profile preview on hover - use portal for floating above all */}
                  {((hoveredUser === u.id) || (cardHover && hoveredUser === u.id)) && createPortal(
                    <MiniProfilePopup
                      user={u}
                      nickname={nickname}
                      bioCache={bioCache}
                      setBioCache={setBioCache}
                      editingNickname={editingNickname}
                      setEditingNickname={setEditingNickname}
                      nicknameInput={nicknameInput}
                      setNicknameInput={setNicknameInput}
                      hoverPos={hoverPos}
                      onMouseEnter={() => {
                        if (hidePopupTimeout.current) {
                          clearTimeout(hidePopupTimeout.current);
                          hidePopupTimeout.current = null;
                        }
                        setCardHover(true);
                      }}
                      onMouseLeave={() => {
                        setCardHover(false);
                        setHoveredUser(null);
                      }}
                      saveNickname={saveNickname}
                    />,
                    document.body
                  )}
                </li>
              );
            })
          ) : (
            <li style={{ textAlign: 'center', color: '#888', fontWeight: 500, padding: '18px 0' }}>No other users found.</li>
          )}
        </ul>
        <style>{`
          @keyframes fadeInProfile {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </section>
    </div>
  );
};

function MiniProfilePopup({ user, nickname, bioCache, setBioCache, editingNickname, setEditingNickname, nicknameInput, setNicknameInput, hoverPos, onMouseEnter, onMouseLeave, saveNickname }) {
  const [loadingBio, setLoadingBio] = useState(false);
  const [bio, setBio] = useState(user.bio || bioCache[user.id] || '');

  React.useEffect(() => {
    if (!user.bio && !bioCache[user.id]) {
      setLoadingBio(true);
      import('../firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          getDoc(doc(db, 'users', user.id)).then(docSnap => {
            if (docSnap.exists()) {
              const fetchedBio = docSnap.data().bio || '';
              setBio(fetchedBio);
              setBioCache(prev => ({ ...prev, [user.id]: fetchedBio }));
            }
            setLoadingBio(false);
          }).catch(() => setLoadingBio(false));
        });
      });
    }
  }, [user, bioCache, setBioCache]);

  return (
    <div
      style={{
        position: 'fixed',
        left: `max(16px, min(${(hoverPos?.x || 0) - 120}px, calc(100vw - 340px)))`,
        top: `${(hoverPos?.y || 0) - 110}px`,
        minWidth: 220,
        maxWidth: 320,
        background: '#fff',
        border: '1.5px solid #e0e7ef',
        borderRadius: 14,
        boxShadow: '0 8px 32px #b6b6d855',
        padding: '14px 18px',
        zIndex: 9999,
        fontSize: 15,
        color: '#232323',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        animation: 'fadeInProfile 0.25s',
        pointerEvents: 'auto',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || user.email} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #1976d2' }} />
        ) : (
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: '#1976d2', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>?</span>
        )}
        <span style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
          {user.displayName || user.email || user.id}
          {nickname && (
            <span style={{ fontWeight: 500, fontSize: 13, color: '#888', marginLeft: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
              ({nickname})
              {/* Pencil beside nickname if present */}
              {editingNickname !== user.id && (
                <button
                  onClick={() => { setEditingNickname(user.id); setNicknameInput(nickname); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                  title="Edit Nickname"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.3 5.7l2 2M5 15l2.5-.5 7-7a1.4 1.4 0 0 0-2-2l-7 7L5 15z" /></svg>
                </button>
              )}
            </span>
          )}
          {/* Pencil beside name if no nickname */}
          {!nickname && editingNickname !== user.id && (
            <button
              onClick={() => { setEditingNickname(user.id); setNicknameInput(nickname); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', marginLeft: 6 }}
              title="Add Nickname"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.3 5.7l2 2M5 15l2.5-.5 7-7a1.4 1.4 0 0 0-2-2l-7 7L5 15z" /></svg>
            </button>
          )}
        </span>
      </div>
      <div style={{ color: '#888', fontSize: 14, fontWeight: 500, maxWidth: 260, whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 10 }}>
        {loadingBio ? 'Loading bio...' : (bio ? bio.slice(0, 200) : 'This user has no bio yet.')}
      </div>
      {/* Nickname input */}
      {editingNickname === user.id ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
          <input
            type="text"
            value={nicknameInput}
            onChange={e => setNicknameInput(e.target.value)}
            placeholder="Enter nickname"
            style={{
              fontSize: 13,
              padding: '4px 8px',
              borderRadius: 8,
              border: '1px solid #e0e7ef',
              outline: 'none',
              width: 110,
              marginRight: 4,
            }}
            maxLength={20}
          />
          <button
            onClick={() => {
              saveNickname(user.id, nicknameInput.trim());
              setEditingNickname(null);
            }}
            style={{ fontSize: 13, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            title="Save"
          >
            {/* Checkmark icon */}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#1976d2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 11 9 15 15 7" /></svg>
          </button>
          <button
            onClick={() => setEditingNickname(null)}
            style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            title="Cancel"
          >
            {/* X icon */}
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="14" y2="14" /><line x1="14" y1="6" x2="6" y2="14" /></svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ChatUsersPage; 