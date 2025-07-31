import React, { useState, useCallback, useContext, createContext, useEffect, useRef } from 'react';
import ChatHead from './ChatHead';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { auth, db } from '../firebase';
import { createConversation, getConversations, sendMessage, markMessagesAsRead } from '../firestoreHelpers';
import { onSnapshot, doc, setDoc, collection, query } from 'firebase/firestore';

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

const USER_CACHE_KEY = 'chat_user_cache_v1';
const USER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const ChatManager = ({ children, sidebarCollapsed, mainContentMarginLeft }) => {
  const [activeChats, setActiveChats] = useState([]); // [{ id, user, unreadCount, isExpanded, position }]
  const [userList, setUserList] = useState([]); // All users
  const [currentUser, setCurrentUser] = useState(null);
  const chatHeadRefs = useRef({});

  // Load current user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      setCurrentUser(user);
      if (user) {
        // Set user status to online in Firestore - with throttling
        let lastStatusUpdate = 0;
        const MIN_STATUS_UPDATE_INTERVAL = 30000; // 30 seconds minimum between status updates
        
        const updateStatusWithThrottling = async (status) => {
          const now = Date.now();
          if (now - lastStatusUpdate > MIN_STATUS_UPDATE_INTERVAL) {
            await setDoc(doc(db, 'users', user.uid), { status }, { merge: true });
            lastStatusUpdate = now;
            console.log(`Status updated to: ${status}`);
          }
        };
        
        await updateStatusWithThrottling('online');
        
        // Set offline on disconnect (tab close) - only if not already offline
        window.addEventListener('beforeunload', () => {
          updateStatusWithThrottling('offline');
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time user list (all users, not just online/away) - with improved throttling
  useEffect(() => {
    if (!currentUser) return;
    
    let lastUpdate = 0;
    const THROTTLE_DELAY = 10000; // 10 seconds between updates to reduce writes
    
    // Listen for real-time updates to all users
    const q = query(
      collection(db, 'users')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_DELAY) {
        const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserList(users);
        setHasMoreUsers(false); // No pagination for real-time
        setLoadingUsers(false);
        lastUpdate = now;
        console.log('User list updated from Firestore (throttled)');
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Load all conversations for current user
  useEffect(() => {
    if (currentUser) {
      getConversations(currentUser.uid).then(setConversations);
    }
  }, [currentUser]);

  // Listen for all conversations and auto-open chat heads for new unread messages - with improved throttling
  useEffect(() => {
    if (!currentUser) return;
    
    let lastUpdate = 0;
    const THROTTLE_DELAY = 5000; // 5 seconds between updates to reduce writes
    
    // Listen for all conversations
    const unsub = onSnapshot(
      collection(db, 'conversations'),
      (snapshot) => {
        const now = Date.now();
        if (now - lastUpdate > THROTTLE_DELAY) {
          const myConvs = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.participants && data.participants.includes(currentUser.uid);
          });
          myConvs.forEach(convDoc => {
            const conv = { id: convDoc.id, ...convDoc.data() };
            // Use aggregate unreadCount field
            const unread = (conv.unreadCount && conv.unreadCount[currentUser.uid]) ? conv.unreadCount[currentUser.uid] : 0;
            setActiveChats(prev => {
              if (unread > 0 && !prev.some(c => c.id === conv.id)) {
                // Find the chat partner's user object
                const chatPartnerId = conv.participants.find(uid => uid !== currentUser.uid);
                let chatPartner = userList.find(u => u.id === chatPartnerId);
                // Fallback: use participantsInfo from conversation if available
                if (!chatPartner && conv.participantsInfo && conv.participantsInfo[chatPartnerId]) {
                  chatPartner = {
                    id: chatPartnerId,
                    displayName: conv.participantsInfo[chatPartnerId].displayName || 'User',
                    photoURL: conv.participantsInfo[chatPartnerId].photoURL || '',
                    status: 'offline',
                  };
                }
                // Final fallback
                if (!chatPartner) {
                  chatPartner = {
                    id: chatPartnerId,
                    displayName: 'User',
                    photoURL: '',
                    status: 'offline',
                  };
                }
                // Add chat head in minimized state with unread count
                const chatHeadWidth = 60;
                const chatHeadHeight = 60;
                const gap = 20;
                const x = window.innerWidth - chatHeadWidth - 40;
                const minY = 44;
                const y = Math.max(90 + (chatHeadHeight + gap) * prev.length, minY);
                return [
                  ...prev,
                  {
                    id: conv.id,
                    user: chatPartner,
                    unreadCount: unread,
                    isExpanded: false,
                    position: { x, y },
                    unsub: null,
                  }
                ];
              } else if (unread === 0 && prev.some(c => c.id === conv.id && !c.isExpanded)) {
                // Remove minimized chat head if all messages are read and not expanded
                return prev.filter(c => !(c.id === conv.id && !c.isExpanded));
              } else {
                // Update unread count if needed
                return prev.map(c => c.id === conv.id ? { ...c, unreadCount: unread } : c);
              }
            });
          });
          lastUpdate = now;
        }
      }
    );
    return () => unsub();
  }, [currentUser, userList]);

  // Activity tracking and status management - with improved throttling
  useEffect(() => {
    if (!currentUser) return;
    
    let isAway = false;
    let lastActivity = Date.now();
    let lastStatusUpdate = Date.now();
    let awayTimeout = null;
    let heartbeatInterval = null;
    let lastStatus = null; // Track last status sent to Firestore
    const MIN_STATUS_UPDATE_INTERVAL = 30000; // 30 seconds minimum between status updates

    const updateStatus = async (status) => {
      const now = Date.now();
      if (lastStatus !== status && (now - lastStatusUpdate) > MIN_STATUS_UPDATE_INTERVAL) {
        await setDoc(doc(db, 'users', currentUser.uid), { status }, { merge: true });
        lastStatus = status;
        lastStatusUpdate = now;
        console.log(`Status updated to: ${status} (throttled)`);
      }
    };

    const setOnline = async () => {
      if (isAway) {
        isAway = false;
        await updateStatus('online');
      } else if (Date.now() - lastStatusUpdate > 60000) {
        await updateStatus('online');
      }
    };
    const setAway = async () => {
      if (!isAway) {
        isAway = true;
        await updateStatus('away');
      }
    };
    const handleActivity = () => {
      setLastActivity(Date.now());
      if (isAway) {
        setOnline();
      }
      if (awayTimeout) clearTimeout(awayTimeout);
      awayTimeout = setTimeout(() => {
        setAway();
      }, 5 * 60 * 1000); // 5 minutes
    };
    // Listen for activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    // Heartbeat: update status every 60 seconds if online - with throttling
    heartbeatInterval = setInterval(() => {
      if (!isAway) setOnline();
    }, 60000);
    // Start away timer
    awayTimeout = setTimeout(() => {
      setAway();
    }, 5 * 60 * 1000);
    setAwayTimeout(awayTimeout);
    // Set initial status to online if not away
    setOnline();
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (awayTimeout) clearTimeout(awayTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [currentUser]);

  const sidebarWidth = typeof mainContentMarginLeft === 'number' ? mainContentMarginLeft : (sidebarCollapsed ? 56 : 220);

  // Open a chat head with a user
  const openChat = useCallback(async (otherUser) => {
    if (!currentUser) return;
    // Check if chat already open
    const existing = activeChats.find(c => c.user.id === otherUser.id);
    if (existing) {
      setActiveChats(prev => prev.map(c => c.user.id === otherUser.id ? { ...c, isExpanded: true, unreadCount: 0 } : c));
      return;
    }
    // Get or create conversation
    const conv = await createConversation(currentUser.uid, otherUser.id);
    // Find the chat partner's user object from userList
    const chatPartnerId = conv.participants.find(uid => uid !== currentUser.uid);
    const chatPartner = userList.find(u => u.id === chatPartnerId) || otherUser;
    // Use unreadCount from conversation
    const unread = (conv.unreadCount && conv.unreadCount[currentUser.uid]) ? conv.unreadCount[currentUser.uid] : 0;
    setActiveChats(prev => [
      ...prev,
      {
        id: conv.id,
        user: chatPartner,
        unreadCount: unread,
        isExpanded: true,
        position: { x: window.innerWidth - 60 - 40, y: Math.max(90 + (60 + 20) * prev.length, 44) },
        unsub: null,
      }
    ]);
  }, [activeChats, currentUser, sidebarWidth, userList]);

  // Close a chat head
  const closeChat = (id) => {
    setActiveChats(prev => {
      const chat = prev.find(c => c.id === id);
      if (chat && chat.unsub) chat.unsub();
      return prev.filter(c => c.id !== id);
    });
  };

  // Update unread count and mark as read when chat head is expanded
  const toggleExpand = (id) => {
    setActiveChats(prev => prev.map(c => c.id === id ? { ...c, isExpanded: !c.isExpanded, unreadCount: 0 } : c));
    // Mark messages as read
    if (currentUser) markMessagesAsRead(id, currentUser.uid);
  };

  // Move a chat head
  const setPosition = (id, pos) => setActiveChats(prev => prev.map(c => c.id === id ? { ...c, position: pos } : c));

  // Send a message
  const sendChatMessage = async (conversationId, text, localId = null, status = 'sent') => {
    if (!currentUser) return;
    await sendMessage(conversationId, currentUser.uid, text, localId, status);
  };

  return (
    <ChatContext.Provider value={{ openChat, closeChat, sendChatMessage, activeChats, userList }}>
      {children}
      {/* Removed fetchUsers button as it's not defined and real-time updates handle user loading */}
      {loadingUsers && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 4000, background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '8px 18px', fontSize: 15, color: '#888', boxShadow: '0 2px 8px #e0e7ef' }}>Loading users...</div>
      )}
      {/* Chat Heads Container - fixed position, but heads are positioned individually */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 3000 }}>
        <TransitionGroup component={null}>
          {activeChats.map(chat => {
            if (!chatHeadRefs.current[chat.id]) {
              chatHeadRefs.current[chat.id] = React.createRef();
            }
            return (
              <CSSTransition
                key={chat.id}
                timeout={350}
                classNames={{
                  enter: 'chat-head',
                  enterActive: 'chat-head',
                  exit: 'chat-head removing',
                  exitActive: 'chat-head removing',
                }}
                nodeRef={chatHeadRefs.current[chat.id]}
              >
                <div style={{ pointerEvents: 'auto' }}>
                  <ChatHead
                    ref={chatHeadRefs.current[chat.id]}
                    user={chat.user}
                    unreadCount={chat.unreadCount}
                    isExpanded={chat.isExpanded}
                    position={chat.position}
                    onToggle={() => toggleExpand(chat.id)}
                    onClose={() => closeChat(chat.id)}
                    onPositionChange={(pos) => setPosition(chat.id, pos)}
                    conversationId={chat.id}
                    sidebarWidth={sidebarWidth}
                  />
                </div>
              </CSSTransition>
            );
          })}
        </TransitionGroup>
      </div>
    </ChatContext.Provider>
  );
};

export default ChatManager; 