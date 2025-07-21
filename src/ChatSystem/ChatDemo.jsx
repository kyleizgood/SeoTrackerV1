import React, { useState, useRef, useEffect } from 'react';

const ChatDemo = () => {
  const [chatHeads, setChatHeads] = useState([
    {
      id: 1,
      user: { displayName: 'John Doe', email: 'john@example.com', status: 'online' },
      unreadCount: 3,
      isExpanded: false,
      position: { x: 20, y: 20 },
    },
    {
      id: 2,
      user: { displayName: 'Jane Smith', email: 'jane@example.com', status: 'offline' },
      unreadCount: 0,
      isExpanded: false,
      position: { x: 100, y: 20 },
    },
  ]);

  const handleToggleChat = (chatId) => {
    setChatHeads(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isExpanded: !chat.isExpanded }
        : { ...chat, isExpanded: false } // Close other chats
    ));
  };

  const handleCloseChat = (chatId) => {
    setChatHeads(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, isExpanded: false, unreadCount: 0 }
        : chat
    ));
  };

  const handlePositionChange = (chatId, newPosition) => {
    setChatHeads(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, position: newPosition }
        : chat
    ));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Floating Chat Heads Demo</h2>
      <p>Click on the chat heads to expand them. Drag them around the screen!</p>
      
      {chatHeads.map(chat => (
        <ChatHead
          key={chat.id}
          user={chat.user}
          unreadCount={chat.unreadCount}
          isExpanded={chat.isExpanded}
          position={chat.position}
          onToggle={() => handleToggleChat(chat.id)}
          onClose={() => handleCloseChat(chat.id)}
          onPositionChange={(newPos) => handlePositionChange(chat.id, newPos)}
        />
      ))}
    </div>
  );
};

const ChatHead = ({ 
  user, 
  unreadCount = 0, isExpanded = false, 
  onToggle, 
  onClose,
  position = { x: 200, y: 200 }, onPositionChange 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const chatHeadRef = useRef(null);

  // Handle drag start
  const handleMouseDown = (e) => {   if (e.target.closest('.chat-window')) return; // Don't drag if clicking inside chat window
    
    setIsDragging(true);
    const rect = chatHeadRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Handle drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    onPositionChange({ x: boundedX, y: boundedY });
  };

  // Handle drag end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {   document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const getUserInitials = (user) => {
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';  };

  const chatHeadStyle = { 
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: 60,
    height: '60px',
    borderRadius: '50%',    background: '#fff',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'all 0.3s ease',
    zIndex: isExpanded ? 10000 : 1,
    userSelect: 'none',
    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
  };

  const avatarStyle = {
    position: 'relative',
    width: 100,
    height: '100%',
    borderRadius: '50%', overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667ea0, #764ba2 100)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '20px',
  };

  const unreadBadgeStyle = {
    position: 'absolute',
    top: -5,
    right: '-5',    background: '#ff4757',
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
    bottom: 2,    right: 2,
    width: 12,
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',  background: user?.status === 'online' ? '#257374' : '#747d8c' };

  const chatWindowStyle = {
    position: 'absolute',
    top: 70,
    right: 0,
    width: '320px',
    height: '400px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)', overflow: 'hidden',
  };

  return (
    <div
      ref={chatHeadRef}
      style={chatHeadStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Chat Head Avatar */}
      <div 
        style={avatarStyle}
        onClick={onToggle}
      >
        {getUserInitials(user)}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div style={unreadBadgeStyle}>
            {unreadCount > 999 ? '999+' : unreadCount}
          </div>
        )}
        
        {/* Online Status */}
        <div style={onlineStatusStyle} />
      </div>

      {/* Expandable Chat Window */}
      {isExpanded && (
        <div style={chatWindowStyle} className="chat-window">       <ChatWindow 
            user={user} 
            onClose={onClose}
            onMinimize={onToggle}
          />
        </div>
      )}
    </div>
  );
};

// Chat Window Component
const ChatWindow = ({ user, onClose, onMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate reply
      const reply = {
        id: Date.now() + 1,
        text: `Thanks for your message: ${newMessage}`,
        sender: user?.displayName || user?.email?.split('@')[0] || 'User',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, reply]);
    }, 10 + Math.random() * 200);
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #667ea0, #764ba2 100)',
    color: 'white',
    borderRadius: '12px 12px 0 0',
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  };

  const userAvatarStyle = {   width: 32,
    height: '32px',
    borderRadius: '50%', overflow: 'hidden',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
  };

  const userDetailsStyle = {
    flex: 1,
  };

  const userNameStyle = {   fontWeight: 600,
    fontSize: 14,
    marginBottom: '2px',
  };

  const userStatusStyle = {
    fontSize: '12px',
    opacity: 0.8,
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const actionBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    width: 24,
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'background 0.2s ease',
  };

  const messagesAreaStyle = {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',    background: '#f8f9fa',
    height: '280px',
  };

  const emptyChatStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    color: '#666',
    textAlign: 'center',
  };

  const emptyChatIconStyle = {
    fontSize: 48,
    marginBottom: '16px',
    opacity: 0.5,
  };

  const emptyChatTextStyle = {
    fontSize: '14px',
    lineHeight: 1.4
  };

  const messagesListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const messageStyle = (isSent) => ({
    maxWidth: '80%',
    padding: '8px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    lineHeight: 1.4,
    alignSelf: isSent ? 'flex-end' : 'flex-start',    background: isSent ? 'linear-gradient(135deg, #667ea0, #764ba2 100)' : 'white',
    color: isSent ? 'white' : '#333',
    border: isSent ? 'none' : '1px solid #e1e5e9',
    borderBottomRightRadius: isSent ? '16px' : '4px',
    borderBottomLeftRadius: isSent ? '16px' : '4px',
  });

  const messageContentStyle = {
    marginBottom: '4px',
  };

  const messageTimeStyle = (isSent) => ({
    fontSize: '11px',
    opacity: 0.7,
    textAlign: isSent ? 'right' : 'left',
  });

  const typingIndicatorStyle = {
    display: 'flex',
    gap: 4,
    padding: 8,
  };

  const typingDotStyle = {    width: 6,
    height: '6px',
    borderRadius: '50%',    background: '#999',
    animation: 'typing 1.4s infinite ease-in-out',
  };

  const inputContainerStyle = {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    background: 'white',
    borderTop: '1px solid #e1e5e9',
  };

  const inputStyle = {
    flex: 1,
    border: '1px solid #e1e5e9',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const sendButtonStyle = {
    background: 'linear-gradient(135deg, #667ea0, #764ba2 100)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    fontSize: '16px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <div style={headerStyle}>
        <div style={userInfoStyle}>
          <div style={userAvatarStyle}>
            {user?.displayName ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
          </div>
          <div style={userDetailsStyle}>
            <div style={userNameStyle}>
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </div>
            <div style={userStatusStyle}>
              {user?.status === 'online' ? '🟢 Online' : '⚫ Offline'}
            </div>
          </div>
        </div>
        <div style={actionsStyle}>
          <button style={actionBtnStyle} onClick={onMinimize} title="Minimize">
            <span>−</span>
          </button>
          <button style={actionBtnStyle} onClick={onClose} title="Close">
            <span>×</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={messagesAreaStyle}>
        {messages.length === 0 ? (
          <div style={emptyChatStyle}>
            <div style={emptyChatIconStyle}>💬</div>
            <div style={emptyChatTextStyle}>
              Start a conversation with {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </div>
          </div>
        ) : (
          <div style={messagesListStyle}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                style={messageStyle(message.sender === 'me')}
              >
                <div style={messageContentStyle}>
                  {message.text}
                </div>
                <div style={messageTimeStyle(message.sender === 'me')}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={messageStyle(false)}>
                <div style={typingIndicatorStyle}>
                  <span style={typingDotStyle}></span>
                  <span style={typingDotStyle}></span>
                  <span style={typingDotStyle}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form style={inputContainerStyle} onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={inputStyle}
        />
        <button type="submit" style={sendButtonStyle} disabled={!newMessage.trim()}>
          <span>📤</span>
        </button>
      </form>
    </div>
  );
};

export default ChatDemo; 