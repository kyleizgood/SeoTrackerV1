import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useChat } from './ChatManager';
import { listenForMessages, markMessagesAsRead, addReactionToMessage, removeReactionFromMessage, editMessage, deleteMessage, fetchOlderMessages, fetchArchivedMessages } from '../firestoreHelpers';
import { auth } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { toast } from 'sonner';

const ChatHead = forwardRef(({
  user,
  unreadCount = 0,
  isExpanded = false,
  onToggle,
  onClose,
  position = { x: 200, y: 200 },
  onPositionChange,
  conversationId,
  sidebarWidth = 220, // new prop, default to 220
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const localRef = useRef(null);
  const chatHeadRef = ref || localRef;
  const [wasDragging, setWasDragging] = useState(false);

  // Handle drag start
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault(); // Prevent browser drag ghost image
    setIsDragging(true);
    isDraggingRef.current = true;
    setWasDragging(false);
    const rect = chatHeadRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  // Handle drag
  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    setWasDragging(true);
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    // Keep within viewport bounds, and not into sidebar
    const minX = sidebarWidth;
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    const minY = 36; // ensure X button is always visible
    const boundedX = Math.max(minX, Math.min(newX, maxX));
    const boundedY = Math.max(minY, Math.min(newY, maxY));
    onPositionChange({ x: boundedX, y: boundedY });
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    document.body.style.userSelect = '';
  };

  const handleAvatarClick = (e) => {
    if (!wasDragging) {
      onToggle();
    }
  };

  useEffect(() => {
    if (isDragging) {
      isDraggingRef.current = true;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        isDraggingRef.current = false;
      };
    }
  }, [isDragging, dragOffset]);

  // Removed unused getUserInitials function

  const chatHeadStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: 60,
    height: '60px',
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'all 0.3s ease',
    zIndex: 10010, // ensure above other elements
    userSelect: 'none',
    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
    overflow: 'visible', // ensure button is visible outside
  };

  const avatarStyle = {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667ea0, #764ba2 100%)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '20px',
  };

  const unreadBadgeStyle = {
    position: 'absolute',
    top: -5,
    right: -5,
    background: '#ff4757',
    color: 'white',
    borderRadius: '50%',
    minWidth: 20,
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '2px solid white',
  };

  const onlineStatusStyle = {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    background: user?.status === 'online' ? '#257374' : user?.status === 'away' ? '#fbc02d' : '#747d8c',
  };

  const chatWindowStyle = {
    position: 'absolute',
    top: 70,
    right: 0,
    width: '320px',
    height: '400px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  };

  return (
    <div
      ref={chatHeadRef}
      className="chat-head"
      style={chatHeadStyle}
      draggable={false}
      onDragStart={e => e.preventDefault()} // Prevent browser drag ghost
    >
      {/* Messenger-style Unread Badge - outside the chat head */}
      {unreadCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: '50%',
            transform: 'translateX(60%)',
            background: '#f44336',
            color: '#fff',
            borderRadius: '50%',
            minWidth: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 'bold',
            border: '2px solid #fff',
            zIndex: 200,
            boxShadow: '0 2px 8px #e0e7ef',
            padding: '0 6px',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      {/* Close (X) Button - only show when expanded, outside the chat head */}
      {isExpanded && (
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          style={{
            position: 'absolute',
            top: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 26,
            height: 26,
            border: '2px solid #d32f2f',
            borderRadius: '50%',
            background: '#fff',
            color: '#d32f2f',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(0,0,0,0.22)',
            padding: 0,
          }}
          title="Close chat"
        >
          ×
        </button>
      )}
      {/* Chat Head Avatar */}
      <div
        style={avatarStyle}
        onClick={handleAvatarClick}
        onMouseDown={handleMouseDown} // Only avatar is draggable
        draggable={false} // Prevent browser drag ghost
        onDragStart={e => e.preventDefault()} // Prevent browser drag ghost
      >
        {(() => { 
          if (user && user.photoURL) {
            return (
          <img
            src={user.photoURL}
                alt={user.displayName || user.email || 'User'}
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', background: '#eee', border: '2px solid #1976d2' }}
            draggable={false}
                onDragStart={e => e.preventDefault()}
              />
            );
          } else if (user && (user.displayName || user.email)) {
            // Show initials from displayName or email
            const initials = user.displayName
              ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
              : user.email
                ? user.email.slice(0, 2).toUpperCase()
                : 'U';
            return <span>{initials}</span>;
          } else {
            // Fallback: generic avatar
            return <span>U</span>;
          }
        })()}
        {/* Online Status */}
        <div style={onlineStatusStyle} />
      </div>
      {/* Expandable Chat Window */}
      {isExpanded && (
        <div
          style={{
            resize: 'both',
            overflow: 'auto',
            minWidth: 260,
            minHeight: 260,
            maxWidth: 600,
            maxHeight: 700,
            width: 380,
            height: 480,
            boxSizing: 'border-box',
            position: 'absolute',
            top: 70,
            right: 0,
            zIndex: 10020,
            background: 'transparent',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
          }}
        >
          <div className="chat-window" style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', minHeight: 0 }}>
          <ChatWindow
            user={user}
            onClose={onClose}
            onMinimize={onToggle}
            conversationId={conversationId}
          />
          </div>
        </div>
      )}
    </div>
  );
});

  // Chat Window Component
  const ChatWindow = ({ user, onClose, onMinimize, conversationId }) => {
    const currentUser = auth.currentUser;
    const { sendChatMessage, userList } = useChat(currentUser);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true); // For pagination
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState([]); // {id, text, status: 'sending'|'sent'|'failed'}
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null); // messageId or null
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [deletedMessageIds, setDeletedMessageIds] = useState([]);
  const [menuOpenFor, setMenuOpenFor] = useState(null); // messageId or null
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null); // messageId or null

  // Add to ChatWindow state:
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [matchIndices, setMatchIndices] = useState([]); // [{msgIdx, start, end}]
  const [currentMatch, setCurrentMatch] = useState(0);
  const searchInputRef = useRef(null);



  const currentUserId = auth.currentUser?.uid;

  // Listen for latest messages in this conversation (limit 50)
  useEffect(() => {
    if (!conversationId) return;
    const unsub = listenForMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setHasMore(msgs.length === 50); // If we got 50, there may be more
      setPendingMessages((pending) => pending.filter(pm => !msgs.some(m => m.localId === pm.localId || (m.text === pm.text && m.senderId === currentUserId))));
    }, 50);
    return () => unsub && unsub();
  }, [conversationId, currentUserId]);

  // Pagination: fetch older messages
  const loadOlderMessages = async () => {
    if (!conversationId || messages.length === 0 || loadingMore) return;
    setLoadingMore(true);
    const older = await fetchOlderMessages(conversationId, messages[0], 50);
    setMessages(prev => [...older, ...prev]);
    setHasMore(older.length === 50);
    setLoadingMore(false);
  };

  // Option 1: Button to load older messages
  // Option 2: Infinite scroll (when scrolled to top)
  const messagesAreaRef = useRef(null);
  useEffect(() => {
    const ref = messagesAreaRef.current;
    if (!ref) return;
    const handleScroll = () => {
      if (ref.scrollTop === 0 && hasMore && !loadingMore) {
        loadOlderMessages();
      }
    };
    ref.addEventListener('scroll', handleScroll);
    return () => ref.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, messages]);

  // Typing indicator: listen for other user's typing
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const convDoc = doc(db, 'conversations', conversationId);
    const unsub = onSnapshot(convDoc, (snap) => {
      const data = snap.data();
      if (!data || !data.typing) return setOtherTyping(false);
      // typing: { [userId]: true/false }
      const typingObj = data.typing;
      const othersTyping = Object.entries(typingObj).some(([uid, val]) => uid !== currentUserId && val);
      setOtherTyping(othersTyping);
    }, (error) => {
      console.error('Chat typing listener error:', error);
      // Don't break the app on permission errors during logout
      if (error.code === 'permission-denied') {
        console.log('Chat typing listener permission error - ignoring');
        return;
      }
    });
    return () => unsub();
  }, [conversationId, currentUserId]);

  const typingTimeout = useRef(null);
  const lastTypingUpdate = useRef(0);
  const MIN_TYPING_UPDATE_INTERVAL = 3000; // 3 seconds minimum between typing updates
  
  // Set typing flag in Firestore when user types (throttled)
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    if (!newMessage) return; // Don't set typing if input is empty
    const convDoc = doc(db, 'conversations', conversationId);
    let timeout;
    const setTyping = async () => {
      const now = Date.now();
      if (now - lastTypingUpdate.current < MIN_TYPING_UPDATE_INTERVAL) return;
      lastTypingUpdate.current = now;
      try {
        await updateDoc(convDoc, { [`typing.${currentUserId}`]: true });
      } catch {}
    };
    typingTimeout.current = setTimeout(() => {
      setTyping();
    }, 500);
    // Clear typing after 2 seconds of inactivity
    timeout = setTimeout(async () => {
      try {
        await updateDoc(convDoc, { [`typing.${currentUserId}`]: false });
      } catch {}
    }, 2000);
    return () => {
      clearTimeout(timeout);
      clearTimeout(typingTimeout.current);
      // Optionally clear typing immediately on unmount
      updateDoc(convDoc, { [`typing.${currentUserId}`]: false }).catch(() => {});
    };
  }, [newMessage, conversationId, currentUserId]);

  const markReadTimeout = useRef(null);
  const lastMarkRead = useRef(0);
  // Debounced mark all as read
  const markAllAsRead = () => {
    if (!conversationId || !currentUserId) return;
    const now = Date.now();
    if (now - lastMarkRead.current < 2000) return;
    lastMarkRead.current = now;
    if (markReadTimeout.current) clearTimeout(markReadTimeout.current);
    markReadTimeout.current = setTimeout(() => {
      markMessagesAsRead(conversationId, currentUserId);
    }, 200);
  };

  useEffect(() => {
    markAllAsRead();
  }, [conversationId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when typing indicator appears
  useEffect(() => {
    if (otherTyping) {
      setTimeout(() => {
        scrollToBottom();
      }, 30);
    }
  }, [otherTyping]);

  const [sendError, setSendError] = useState('');

  // Send message with status
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendError('');
    const localId = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const pendingMsg = {
      localId,
      text: newMessage,
      status: 'sending',
      senderId: currentUserId,
      timestamp: new Date(),
    };
    setPendingMessages((prev) => [...prev, pendingMsg]);
    setNewMessage('');
    try {
      // Actually send the message
      await sendChatMessage(conversationId, newMessage, localId);
      setPendingMessages((prev) => prev.map(pm => pm.localId === localId ? { ...pm, status: 'sent' } : pm));
    } catch (err) {
      setPendingMessages((prev) => prev.map(pm => pm.localId === localId ? { ...pm, status: 'failed' } : pm));
      setSendError('Failed to send message. Please try again.');
      console.error('Send message error:', err);
    }
  };

  // Retry sending a failed message
  const retrySend = async (pendingMsg) => {
    setPendingMessages((prev) => prev.map(pm => pm.localId === pendingMsg.localId ? { ...pm, status: 'sending' } : pm));
    try {
      await sendChatMessage(conversationId, pendingMsg.text, pendingMsg.localId);
      setPendingMessages((prev) => prev.map(pm => pm.localId === pendingMsg.localId ? { ...pm, status: 'sent' } : pm));
    } catch (err) {
      setPendingMessages((prev) => prev.map(pm => pm.localId === pendingMsg.localId ? { ...pm, status: 'failed' } : pm));
    }
  };

  // Insert emoji at cursor position
  const insertEmoji = (emoji) => {
    const emojiChar = emoji.native;
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewMessage((msg) => msg + emojiChar);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = newMessage.slice(0, start);
    const after = newMessage.slice(end);
    const updated = before + emojiChar + after;
    setNewMessage(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emojiChar.length;
    }, 0);
  };

  // Debounce map for reactions
  const reactionTimeouts = useRef({});

  // Add or remove reaction (debounced)
  const handleReaction = (messageId, emoji, hasReacted) => {
    if (!conversationId || !messageId || !currentUserId) return;
    const key = `${messageId}_${emoji}_${currentUserId}`;
    if (reactionTimeouts.current[key]) clearTimeout(reactionTimeouts.current[key]);
    reactionTimeouts.current[key] = setTimeout(async () => {
      if (hasReacted) {
        await removeReactionFromMessage(conversationId, messageId, emoji, currentUserId);
      } else {
        await addReactionToMessage(conversationId, messageId, emoji, currentUserId);
      }
      setReactionPickerFor(null);
      delete reactionTimeouts.current[key];
    }, 400);
  };

  // Edit message handlers
  const startEditing = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
  };
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText('');
  };
  const saveEditing = async (msg) => {
    if (!editingText.trim()) return;
    await editMessage(conversationId, msg.id, editingText);
    setEditingMessageId(null);
    setEditingText('');
  };
  // Delete message handler
  const handleDelete = async (msg) => {
    setConfirmDeleteFor(msg.id);
    setMenuOpenFor(null);
  };
  const confirmDelete = async (msg) => {
    await deleteMessage(conversationId, msg.id);
    setDeletedMessageIds(ids => [...ids, msg.id]);
    setConfirmDeleteFor(null);
          cancelEditing();
      toast.success('Message deleted successfully');
    

  };
  const cancelDelete = () => setConfirmDeleteFor(null);

  // Close menu on outside click
  useEffect(() => {
    const closeMenu = () => setMenuOpenFor(null);
    if (menuOpenFor) {
      window.addEventListener('click', closeMenu);
      return () => window.removeEventListener('click', closeMenu);
    }
  }, [menuOpenFor]);

  // Helper to get sender info
  const getSenderInfo = (senderId) => {
    if (senderId === currentUserId) {
      return auth.currentUser;
    }
    return userList.find(u => u.id === senderId) || { displayName: 'User', photoURL: '', email: '' };
  };

  // Helper to render avatar
  const renderAvatar = (sender) => {
    if (sender.photoURL) {
      return <img src={sender.photoURL} alt={sender.displayName || sender.email || 'User'} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#eee', border: '2px solid #1976d2' }} />;
    } else if (sender.displayName || sender.email) {
      const initials = sender.displayName
        ? sender.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
        : sender.email
          ? sender.email.slice(0, 2).toUpperCase()
          : 'U';
      return <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{initials}</span>;
    } else {
      return <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>U</span>;
    }
  };

  // Helper to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    // Check for yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    // Default: show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to render message status icon
  const renderStatusIcon = (status, onRetry) => {
    if (status === 'sending') {
      return <span style={{ marginLeft: 6, fontSize: 13, color: '#888' }} title="Sending...">⏳</span>;
    }
    if (status === 'sent') {
      return <span style={{ marginLeft: 6, fontSize: 15, color: '#43a047' }} title="Sent">✔</span>;
    }
    if (status === 'failed') {
      return <span style={{ marginLeft: 6, fontSize: 15, color: '#d32f2f', cursor: 'pointer' }} title="Failed. Click to retry." onClick={onRetry}>❗</span>;
    }
    return null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+/ or Cmd+/ to focus input
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        textareaRef.current?.focus();
        e.preventDefault();
      }
      // Esc to blur input or close emoji picker
      if (e.key === 'Escape') {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else {
          textareaRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEmojiPicker]);

  // Keyboard shortcut for Ctrl+F/Cmd+F
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchActive(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape' && searchActive) {
        setSearchActive(false);
        setSearchQuery('');
        setMatchIndices([]);
        setCurrentMatch(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchActive]);

  // Update match indices when searchQuery or messages change
  useEffect(() => {
    if (!searchQuery) {
      setMatchIndices([]);
      setCurrentMatch(0);
      return;
    }
    const indices = [];
    messages.forEach((msg, msgIdx) => {
      if (deletedMessageIds.includes(msg.id)) return;
      let text = msg.text || '';
      let i = 0;
      const q = searchQuery.toLowerCase();
      let from = 0;
      while ((i = text.toLowerCase().indexOf(q, from)) !== -1) {
        indices.push({ msgIdx, start: i, end: i + q.length });
        from = i + q.length;
      }
    });
    setMatchIndices(indices);
    setCurrentMatch(indices.length ? 0 : 0);
  }, [searchQuery, messages, deletedMessageIds]);

  // Scroll to current match
  useEffect(() => {
    if (!searchActive || !matchIndices.length) return;
    const { msgIdx } = matchIndices[currentMatch] || {};
    const el = document.querySelector(`[data-msg-idx="${msgIdx}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentMatch, matchIndices, searchActive]);

  // Enter/Shift+Enter in textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
    // Shift+Enter: allow newline (default behavior)
  };

  // Add these refs at the top of ChatWindow
  const emojiPickerRef = useRef(null);
  const reactionPickerRef = useRef(null);

  // Update the useEffect for outside click:
  useEffect(() => {
    if (!showEmojiPicker && !reactionPickerFor) return;
    function handleClickOutside(e) {
      const emojiPickerNode = emojiPickerRef.current;
      const reactionPickerNode = reactionPickerRef.current;
      if (
        (showEmojiPicker && emojiPickerNode && !emojiPickerNode.contains(e.target)) ||
        (reactionPickerFor && reactionPickerNode && !reactionPickerNode.contains(e.target))
      ) {
        setShowEmojiPicker(false);
        setReactionPickerFor(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, reactionPickerFor]);

  const [archivedMessages, setArchivedMessages] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedChecked, setArchivedChecked] = useState(false);
  const [loadingArchived, setLoadingArchived] = useState(false);

  // Check if there are archived messages (only check once per chat)
  useEffect(() => {
    if (!conversationId || archivedChecked) return;
    setLoadingArchived(true);
    fetchArchivedMessages(conversationId, 1).then(msgs => {
      setArchivedChecked(true);
      setLoadingArchived(false);
      if (msgs.length > 0) setShowArchived(false); // Only show button if there are archived
    });
  }, [conversationId, archivedChecked]);

  // Fetch archived messages when shown
  const handleShowArchived = async () => {
    setLoadingArchived(true);
    const msgs = await fetchArchivedMessages(conversationId, 50);
    setArchivedMessages(msgs);
    setShowArchived(true);
    setLoadingArchived(false);
  };
  const handleHideArchived = () => {
    setShowArchived(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}
      role="region"
      aria-label="Chat conversation window"
    >
      {/* Chat Header with Display Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 18px',
          height: 54,
          background: 'linear-gradient(90deg, #e3f2fd 0%, #fff 100%)',
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottom: '1px solid #e0e7ef',
          fontWeight: 600,
          fontSize: 17,
          color: '#222',
          position: 'relative',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 17 }}>{user?.displayName || user?.email || 'User'}</span>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: user?.status === 'online' ? '#43a047' : user?.status === 'away' ? '#fbc02d' : '#888',
            marginLeft: 8,
            display: 'inline-block',
            border: '1.5px solid #fff',
            boxShadow: '0 1px 4px #e0e7ef',
          }}
          title={user?.status === 'online' ? 'Online' : user?.status === 'away' ? 'Away' : 'Offline'}
        />
        {user?.status === 'away' && (
          <span style={{ color: '#fbc02d', fontWeight: 600, fontSize: 14, marginLeft: 6 }}>Away</span>
        )}
      </div>
      {/* Messages Area */}
      <div
        ref={messagesAreaRef}
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          background: '#f8f9fa',
          height: '280px',
          transition: 'padding-bottom 0.2s',
          paddingBottom: otherTyping ? 96 : 0 // Add more space for typing indicator if visible
        }}
        onScroll={markAllAsRead}
        onClick={markAllAsRead}
      >
        {/* Archived Messages UI */}
        {archivedChecked && !showArchived && !loadingArchived && (
          <button onClick={handleShowArchived} style={{ margin: '0 auto 12px', display: 'block', fontSize: 13, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }}>Show Archived Messages</button>
        )}
        {loadingArchived && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 8 }}>Loading archived messages...</div>
        )}
        {showArchived && archivedMessages.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ textAlign: 'center', color: '#888', fontSize: 13, margin: '8px 0', fontWeight: 600 }}>
              Archived Messages (older than 15 days)
              <button onClick={handleHideArchived} style={{ marginLeft: 12, fontSize: 12, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }}>Hide</button>
            </div>
            <div style={{ borderTop: '1.5px dashed #b0b8c1', margin: '8px 0 12px 0' }} />
            {archivedMessages.map((message, msgIdx) => (
              <div key={message.id} className={`message message-archived`} style={{ opacity: 0.7, background: '#f4f7fa', color: '#888', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{message.text}</div>
                <div style={{ fontSize: 11, textAlign: 'right', marginTop: 2 }}>{formatTimestamp(message.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
        {hasMore && !loadingMore && (
          <button onClick={loadOlderMessages} style={{ margin: '0 auto 12px', display: 'block', fontSize: 13, color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer' }}>Load older messages</button>
        )}
        {loadingMore && (
          <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 8 }}>Loading...</div>
        )}
        {searchActive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            background: '#f4f7fa',
            borderBottom: '1px solid #e0e7ef',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            maxWidth: '100%',
            boxSizing: 'border-box',
            minWidth: 0,
          }}>
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in chat..."
              style={{ flex: 1, fontSize: 15, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #1976d2', outline: 'none', minWidth: 0 }}
              autoFocus
            />
            <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>{matchIndices.length ? `${currentMatch + 1} of ${matchIndices.length}` : 'No matches'}</span>
            <button onClick={() => setCurrentMatch((c) => (c - 1 + matchIndices.length) % matchIndices.length)} disabled={!matchIndices.length} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1976d2', padding: 2, minWidth: 0 }} title="Previous match">&#8593;</button>
            <button onClick={() => setCurrentMatch((c) => (c + 1) % matchIndices.length)} disabled={!matchIndices.length} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#1976d2', padding: 2, minWidth: 0 }} title="Next match">&#8595;</button>
            <button
              onClick={() => { setSearchActive(false); setSearchQuery(''); setMatchIndices([]); setCurrentMatch(0); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#d32f2f',
                fontWeight: 900,
                cursor: 'pointer',
                marginLeft: 4,
                lineHeight: 1,
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
                minWidth: 0,
              }}
              title="Close search"
              onMouseOver={e => e.currentTarget.style.background = '#ffeaea'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              ×
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 100, color: '#666', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: '16px', opacity: 0.5 }}>💬</div>
            <div style={{ fontSize: '14px', lineHeight: 1.4 }}>Start a conversation with {user?.displayName || user?.email || 'User'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Render pending messages (local, not yet in Firestore) */}
            {pendingMessages.map((pm) => (
              <div
                key={pm.localId}
                className="message message-sent message-appear"
                style={{
                  display: 'flex',
                  flexDirection: 'row-reverse',
                  alignItems: 'flex-end',
                  gap: 10,
                }}
              >
                <div>{renderAvatar(auth.currentUser)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '70%' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 18,
                      fontSize: 15,
                      lineHeight: 1.5,
                      background: 'linear-gradient(90deg, #e3f2fd 0%, #81c784 100%)',
                      color: '#222',
                      marginBottom: 2,
                      boxShadow: '0 2px 8px #e0e7ef',
                      alignSelf: 'flex-end',
                      opacity: pm.status === 'sending' ? 0.7 : 1,
                      position: 'relative',
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: pm.text.replace(/\n/g, '<br />') }} />
                    <div style={{ fontSize: 11, opacity: 0.7, textAlign: 'right', marginTop: 2 }}>
                      Just now
                      {renderStatusIcon(pm.status, () => retrySend(pm))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {messages.map((message, msgIdx) => {
              if (deletedMessageIds.includes(message.id)) return null;
              const isMe = message.senderId === currentUserId;
              const sender = getSenderInfo(message.senderId);
              // Read receipt: show for last message sent by me if the other user has read it
              let showReadReceipt = false;
              if (
                isMe &&
                msgIdx === messages.length - 1 &&
                Array.isArray(message.readBy) &&
                userList.some(u => u.id !== currentUserId && message.readBy.includes(u.id))
              ) {
                showReadReceipt = true;
              }
              return (
                <div
                  key={message.id}
                  data-msg-idx={msgIdx}
                  className={`message ${isMe ? 'message-sent' : 'message-received'} message-appear`}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 10,
                    position: 'relative',
                  }}
                  onMouseLeave={cancelEditing}
                  tabIndex={0}
                  onFocus={e => e.currentTarget.classList.add('msg-hover')}
                  onBlur={e => e.currentTarget.classList.remove('msg-hover')}
                  onMouseEnter={e => e.currentTarget.classList.add('msg-hover')}
                  onMouseOut={e => e.currentTarget.classList.remove('msg-hover')}
                >
                  {/* Avatar */}
                  <div>{renderAvatar(sender)}</div>
                  {/* Message bubble and read receipt */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div
                      style={{
                    padding: '10px 14px',
                    borderRadius: 18,
                    fontSize: 15,
                    lineHeight: 1.5,
                        background: isMe ? 'linear-gradient(90deg, #e3f2fd 0%, #81c784 100%)' : '#fff',
                    color: '#222',
                        marginBottom: 2,
                    boxShadow: '0 2px 8px #e0e7ef',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                        position: 'relative',
                        minWidth: 60,
                        cursor: 'default',
                  }}
                >
                      {/* Minimalist three-dot menu for own messages */}
                      {isMe && editingMessageId !== message.id && (
                        <button
                          onClick={e => { e.stopPropagation(); setMenuOpenFor(message.id); }}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 6,
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: 18,
                            cursor: 'pointer',
                            padding: 0,
                            zIndex: 10,
                          }}
                          aria-label="Message options"
                        >
                          ⋯
                        </button>
                      )}
                      {/* Popover menu */}
                      {menuOpenFor === message.id && (
                        <div style={{ position: 'absolute', top: 28, right: 6, background: '#fff', border: '1px solid #e0e7ef', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef', zIndex: 20, minWidth: 90, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setMenuOpenFor(null); startEditing(message); }} style={{ background: 'none', border: 'none', color: '#1976d2', fontSize: 15, padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>Edit</button>
                          <button onClick={() => handleDelete(message)} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: 15, padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>Delete</button>
                  </div>
                      )}
                      {/* Minimalist confirmation popover for delete */}
                      {confirmDeleteFor === message.id && (
                        <div style={{ position: 'absolute', top: 28, right: 6, background: '#fff', border: '1px solid #e0e7ef', borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef', zIndex: 30, minWidth: 120, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }} onClick={e => e.stopPropagation()}>
                          <span style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>Delete this message?</span>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={() => confirmDelete(message)} style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 14, cursor: 'pointer' }}>Delete</button>
                            <button onClick={cancelDelete} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                          </div>
                        </div>
                      )}
                      {/* Inline editing */}
                      {editingMessageId === message.id ? (
                        <form onSubmit={e => { e.preventDefault(); saveEditing(message); }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            style={{ fontSize: 15, padding: '4px 8px', borderRadius: 8, border: '1px solid #1976d2', width: '100%' }}
                            autoFocus
                            aria-label="Edit message"
                          />
                          <button type="submit" style={{ background: '#43a047', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 14, cursor: 'pointer' }} title="Save">Save</button>
                          <button type="button" onClick={cancelEditing} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: 14, cursor: 'pointer' }} title="Cancel">Cancel</button>
                        </form>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          maxWidth: '100%',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-all',
                          whiteSpace: 'pre-line',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          msUserSelect: 'text',
                          cursor: 'text',
                        }}>{(() => {
                          if (!searchQuery) return message.text;
                          const q = searchQuery.toLowerCase();
                          const t = message.text || '';
                          const parts = [];
                          let last = 0;
                          let idx = 0;
                          let lower = t.toLowerCase();
                          while (true) {
                            const i = lower.indexOf(q, last);
                            if (i === -1) break;
                            if (i > last) parts.push(t.slice(last, i));
                            const isCurrent = matchIndices[currentMatch] && matchIndices[currentMatch].msgIdx === msgIdx && matchIndices[currentMatch].start === i;
                            parts.push(
                              <mark key={idx} style={{ background: isCurrent ? '#ffe066' : '#fffa9e', color: '#222', padding: 0 }}>{t.slice(i, i + q.length)}</mark>
                            );
                            last = i + q.length;
                            idx++;
                          }
                          if (last < t.length) parts.push(t.slice(last));
                          return parts;
                        })()}</span>
                      )}
                      <div style={{ fontSize: 11, opacity: 0.7, textAlign: isMe ? 'right' : 'left', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {formatTimestamp(message.timestamp)}
                        {message.edited && <span style={{ fontStyle: 'italic', color: '#888', marginLeft: 4 }} title="Edited">(edited)</span>}
                        {/* Show status icon for messages sent by me */}
                        {isMe && renderStatusIcon(message.status)}
                      </div>
                      {/* Reactions UI */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', zIndex: 1 }}>
                        {message.reactions && Object.entries(message.reactions).map(([emoji, uids]) => {
                          const hasReacted = uids.includes(currentUserId);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji, hasReacted)}
                              style={{
                                background: hasReacted ? '#e3f2fd' : '#f4f7fa',
                                border: hasReacted ? '1.5px solid #1976d2' : '1px solid #e0e7ef',
                                borderRadius: 12,
                                fontSize: 17,
                                padding: '2px 8px',
                                marginRight: 2,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                color: hasReacted ? '#1976d2' : '#333',
                                fontWeight: hasReacted ? 700 : 500,
                                outline: 'none',
                              }}
                              aria-label={`Reacted with ${emoji}${hasReacted ? ' (click to remove)' : ''}`}
                            >
                              <span>{emoji}</span>
                              <span style={{ fontSize: 13 }}>{uids.length}</span>
                            </button>
                          );
                        })}
                        {/* Always render the ＋ button */}
                        <button
                          onClick={() => setReactionPickerFor(message.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #e0e7ef',
                            borderRadius: 10,
                            fontSize: 17,
                            padding: '0px 7px',
                            cursor: 'pointer',
                            color: '#229ED9',
                            marginLeft: 2,
                            height: 24,
                            minWidth: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            transition: 'background 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = '#e3f2fd'}
                          onMouseOut={e => e.currentTarget.style.background = 'none'}
                          aria-label="Add reaction"
                        >
                          ＋
                        </button>
                        {reactionPickerFor === message.id && (
                          <div
                            ref={reactionPickerRef}
                            data-reaction-picker
                            style={{
                              position: 'absolute',
                              zIndex: 200,
                              top: 36,
                              left: isMe ? '50%' : 0,
                              transform: isMe ? 'translateX(-50%)' : 'none',
                              background: '#fff',
                              borderRadius: 8,
                    boxShadow: '0 2px 8px #e0e7ef',
                              padding: 0,
                              minWidth: 180,
                            }}
                          >
                            <button
                              onClick={() => setReactionPickerFor(null)}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: 'none',
                                border: 'none',
                                color: '#888',
                                fontSize: 16,
                                cursor: 'pointer',
                                zIndex: 210,
                                padding: 0,
                              }}
                              aria-label="Close emoji picker"
                            >
                              ×
                            </button>
                            <Picker
                              data={data}
                              onEmojiSelect={emoji => handleReaction(message.id, emoji.native, false)}
                              theme="light"
                              previewPosition="none"
                              skinTonePosition="search"
                              width={180}
                              maxHeight={150}
                              emojiSize={15}
                              perLine={6}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Read receipt */}
                    {showReadReceipt && (
                      <span style={{
                        marginTop: 2,
                        fontSize: 13,
                        color: '#43a047',
                        fontWeight: 600,
                        opacity: 0.85,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <span style={{ fontSize: 15 }}>✔</span> Seen
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      {/* Typing Indicator (absolutely positioned above input) */}
      {otherTyping && (
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 64, // height of input area + margin
          display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-start',
          minHeight: 36, paddingLeft: 18, pointerEvents: 'none', zIndex: 10
        }}>
          <div>{renderAvatar(user)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="typing-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#bbb', marginRight: 2, animation: 'typing 1.4s infinite ease-in-out' }}></span>
            <span className="typing-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#bbb', marginRight: 2, animation: 'typing 1.4s infinite ease-in-out', animationDelay: '-0.16s' }}></span>
            <span className="typing-dot" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#bbb', animation: 'typing 1.4s infinite ease-in-out', animationDelay: '-0.32s' }}></span>
          </div>
        </div>
      )}
      {/* Message Input */}
      <form
        style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'white', borderTop: '1px solid #e1e5e9', alignItems: 'center', position: 'relative' }}
        onSubmit={handleSendMessage}
        role="search"
        aria-label="Send a message"
      >
        {/* Attach and emoji buttons stacked vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center', marginRight: 4 }}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
              color: '#555',
            }}
            tabIndex={-1}
            title="Insert emoji"
            aria-label="Insert emoji"
          >
            <span role="img" aria-label="emoji">😊</span>
          </button>
        </div>
        {/* Emoji picker popover remains unchanged */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: 48, left: 0, zIndex: 100, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
            <Picker
              data={data}
              onEmojiSelect={insertEmoji}
              theme="light"
              previewPosition="none"
              skinTonePosition="search"
              width={180}
              maxHeight={150}
              emojiSize={15}
              perLine={6}
            />
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{
            width: '100%',
            border: '1.5px solid #1976d2',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            resize: 'both',
            minHeight: 36,
            maxHeight: 200,
            marginBottom: 4,
            color: '#222',
            background: '#fff',
          }}
          rows={2}
          onFocus={markAllAsRead}
          onKeyDown={handleTextareaKeyDown}
          aria-label="Type a message"
        />
        <button
          type="submit"
          style={{
            background: '#229ED9',
            border: '2px solid #229ED9',
            borderRadius: '50%',
            width: 36,
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!newMessage.trim()) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            fontSize: '16px',
            boxShadow: '0 2px 8px #e0e7ef',
            outline: 'none',
            color: '#fff',
            opacity: (!newMessage.trim()) ? 0.5 : 1,
            pointerEvents: (!newMessage.trim()) ? 'none' : 'auto',
            marginBottom: 0,
          }}
          onMouseOver={e => { if (e.currentTarget.style.pointerEvents !== 'none') { e.currentTarget.style.background = '#1976d2'; e.currentTarget.style.color = '#fff'; } }}
          onMouseOut={e => { if (e.currentTarget.style.pointerEvents !== 'none') { e.currentTarget.style.background = '#229ED9'; e.currentTarget.style.color = '#fff'; } }}
          aria-label="Send message"
        >
          <span style={{ fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="img" aria-label="send">➤</span>
        </button>
      </form>
      {/* Error message for send failure */}
      {sendError && (
        <div style={{ color: '#d32f2f', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{sendError}</div>
      )}

    </div>
  );
};

export default ChatHead; 