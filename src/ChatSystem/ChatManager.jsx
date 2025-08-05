import React, { useState, useCallback, useContext, createContext, useEffect, useRef } from 'react';
import ChatHead from './ChatHead';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { auth, db } from '../firebase';
import { createConversation, getConversations, sendMessage, markMessagesAsRead } from '../firestoreHelpers';
import { onSnapshot, doc, setDoc, collection, query } from 'firebase/firestore';

const ChatContext = createContext();

export function useChat(currentUser) {
  return useContext(ChatContext);
}

const USER_CACHE_KEY = 'chat_user_cache_v1';
const USER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Global throttling for chat operations
const CHAT_THROTTLE = {
  lastStatusUpdate: 0,
  lastUserListUpdate: 0,
  lastConversationUpdate: 0
};

const CHAT_THROTTLE_INTERVALS = {
  STATUS_UPDATE: 30000, // 30 seconds minimum between status updates - much more cost efficient
  USER_LIST_UPDATE: 30000, // 30 seconds between user list updates - much more cost efficient
  CONVERSATION_UPDATE: 60000 // 60 seconds between conversation updates - much more cost efficient
};

const isChatThrottled = (operation) => {
  const now = Date.now();
  const lastUpdate = CHAT_THROTTLE[operation] || 0;
  const interval = CHAT_THROTTLE_INTERVALS[operation];
  
  if (now - lastUpdate < interval) {
    return true; // Throttled
  }
  
  CHAT_THROTTLE[operation] = now;
  return false; // Not throttled
};

const ChatManager = ({ children, sidebarCollapsed, mainContentMarginLeft, currentUser }) => {
  // Guard against undefined currentUser
  if (!currentUser) {
    return <>{children}</>;
  }
  
  const [activeChats, setActiveChats] = useState([]); // [{ id, user, unreadCount, isExpanded, position }]
  const [userList, setUserList] = useState([]); // All users
  const [conversations, setConversations] = useState([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [awayTimeout, setAwayTimeout] = useState(null);
  const chatHeadRefs = useRef({});

  // User is now passed as prop from parent App component to prevent authentication conflicts
  // The onAuthStateChanged listener has been removed to prevent re-login issues during logout

  // Real-time user list (all users, not just online/away) - optimized for real-time
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingUsers(true); // Show loading state immediately
    
    // Listen for real-time updates to all users
    // Throttled to reduce Firestore reads - only update every 30 seconds
    const q = query(
      collection(db, 'users')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserList(users);
      setHasMoreUsers(false); // No pagination for real-time
      setLoadingUsers(false);
      
      // Debug: Log user statuses
      const onlineUsers = users.filter(u => u.status === 'online');
      const awayUsers = users.filter(u => u.status === 'away');
      const offlineUsers = users.filter(u => u.status === 'offline');
      // console.log(`📊 User list updated: ${onlineUsers.length} online, ${awayUsers.length} away, ${offlineUsers.length} offline`);
      // console.log('👥 Online users:', onlineUsers.map(u => u.email || u.displayName));
    }, (error) => {
      // console.error('Chat user list listener error:', error);
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied' && !currentUser) {
        // console.log('Chat user list listener permission error during logout - ignoring');
        return;
      }
      setLoadingUsers(false); // Hide loading on error
      if (error.code === 'resource-exhausted') {
        // console.warn('🚨 Chat system quota exceeded - reducing update frequency');
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
    
    // Listen for all conversations
    const unsub = onSnapshot(
      collection(db, 'conversations'),
      (snapshot) => {
            if (isChatThrottled('CONVERSATION_UPDATE')) {
      // console.log('Conversation update skipped (throttled)');
      return;
    }
        
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
         // console.log('Conversations updated from Firestore (throttled)');
       },
       (error) => {
         // console.error('Chat conversations listener error:', error);
         if (error.code === 'resource-exhausted') {
           // console.warn('🚨 Chat system quota exceeded - reducing update frequency');
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
    let awayTimeout = null;
    let heartbeatInterval = null;

    let currentStatus = 'offline'; // Track current status to avoid unnecessary updates

    const updateStatus = async (status) => {
      // Only update if status actually changed or if throttling allows
      if (currentStatus !== status && !isChatThrottled('STATUS_UPDATE')) {
        try {
          const userData = {
            status, 
            lastSeen: new Date().toISOString(),
            displayName: currentUser.displayName || currentUser.email,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          };
          await setDoc(doc(db, 'users', currentUser.uid), userData, { merge: true });
          currentStatus = status; // Update tracked status
          // console.log(`✅ Status updated to: ${status} for ${currentUser.email}`);
        } catch (error) {
          // console.error('❌ Failed to update status:', error);
        }
      } else if (currentStatus === status) {
        // console.log(`⏭️ Status unchanged: ${status} for ${currentUser.email}`);
      } else {
        // console.log(`⏳ Status update skipped (throttled): ${status} for ${currentUser.email}`);
      }
    };

    const setOnline = async () => {
      if (isAway) {
        isAway = false;
      }
      await updateStatus('online');
    };
    const setAway = async () => {
      if (!isAway) {
        isAway = true;
        await updateStatus('away');
      }
    };
    const setOffline = async () => {
      await updateStatus('offline');
    };
    
    // Throttle activity updates to reduce writes
    let lastActivityUpdate = 0;
    const ACTIVITY_THROTTLE = 30000; // 30 seconds between activity updates
    
    const handleActivity = () => {
      const now = Date.now();
      setLastActivity(now);
      
      // Only update status if away or if enough time has passed
      if (isAway) {
        setOnline();
      } else if (currentStatus === 'online' && (now - lastActivityUpdate) > ACTIVITY_THROTTLE) {
        // Update lastSeen less frequently to reduce writes
        setDoc(doc(db, 'users', currentUser.uid), { 
          lastSeen: new Date().toISOString() 
        }, { merge: true }).catch(console.error);
        lastActivityUpdate = now;
      }
      
      if (awayTimeout) clearTimeout(awayTimeout);
      awayTimeout = setTimeout(() => {
        setAway();
      }, 5 * 60 * 1000); // 5 minutes
    };
    
    // Handle browser close/tab close
    const handleBeforeUnload = () => {
      setOffline();
    };
    
    // Handle page visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAway();
      } else {
        setOnline();
      }
    };
    
    // Handle network status changes
    const handleOnline = () => {
      setOnline();
    };
    
    const handleOffline = () => {
      setOffline();
    };
    
    // Listen for activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    // Listen for browser events
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Heartbeat: update status every 5 minutes if online - much more cost efficient
    heartbeatInterval = setInterval(() => {
      if (!isAway && !document.hidden) setOnline();
    }, 300000); // 5 minutes instead of 2 minutes
    
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
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (awayTimeout) clearTimeout(awayTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Set offline when component unmounts
      setOffline();
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
  }, [activeChats, currentUser, mainContentMarginLeft, sidebarCollapsed, userList]);

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