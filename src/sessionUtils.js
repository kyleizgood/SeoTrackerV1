// Session timeout is set to 1 hour (3600000 milliseconds)
const SESSION_TIMEOUT_MS = 3600000; // 1 hour in milliseconds

// Track user activity to reset the session timer
let lastActivityTime = Date.now();

// Update activity time whenever user interacts with the page
export const updateActivityTime = () => {
  lastActivityTime = Date.now();
  const user = getAuth().currentUser;
  if (user) {
    localStorage.setItem(`lastActivity_${user.uid}`, lastActivityTime.toString());
  }
};

// Returns true if the session is expired based on last activity
export const isSessionExpired = () => {
  const user = getAuth().currentUser;
  if (!user) return false;
  
  const lastActivity = localStorage.getItem(`lastActivity_${user.uid}`);
  if (!lastActivity) return false;
  
  const lastActivityNum = Number(lastActivity);
  if (isNaN(lastActivityNum)) return false;
  
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityNum;
  
  return timeSinceLastActivity >= SESSION_TIMEOUT_MS;
};

// Returns milliseconds remaining until session expires
export const getRemainingSessionTime = () => {
  const user = getAuth().currentUser;
  if (!user) return 0;
  
  const lastActivity = localStorage.getItem(`lastActivity_${user.uid}`);
  if (!lastActivity) return 0;
  
  const lastActivityNum = Number(lastActivity);
  if (isNaN(lastActivityNum)) return 0;
  
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityNum;
  const remainingTime = SESSION_TIMEOUT_MS - timeSinceLastActivity;
  
  return Math.max(0, remainingTime);
};

// Format remaining time in a human-readable format
export const formatRemainingTime = (milliseconds) => {
  if (!milliseconds || isNaN(milliseconds) || milliseconds <= 0) return 'Expired';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
};

import { getAuth } from 'firebase/auth';

export function setSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    const now = Date.now();
    localStorage.setItem(`sessionStartTime_${user.uid}`, now.toString());
    localStorage.setItem(`lastActivity_${user.uid}`, now.toString());
    lastActivityTime = now;
  }
}

export function getSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    const val = localStorage.getItem(`sessionStartTime_${user.uid}`);
    if (!val) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function clearSessionStartTime() {
  const user = getAuth().currentUser;
  if (user) {
    localStorage.removeItem(`sessionStartTime_${user.uid}`);
    localStorage.removeItem(`lastActivity_${user.uid}`);
  }
}

// Set up activity listeners to track user interaction
export const setupActivityTracking = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const activityHandler = () => {
    updateActivityTime();
  };
  
  events.forEach(event => {
    document.addEventListener(event, activityHandler, true);
  });
  
  // Return cleanup function
  return () => {
    events.forEach(event => {
      document.removeEventListener(event, activityHandler, true);
    });
  };
}; 