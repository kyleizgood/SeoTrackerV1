// All sessions expire at 6 PM every day

// Returns a Date object for the next 6 PM cutoff
function getNext6PM() {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(18, 0, 0, 0); // 18:00:00.000
  if (now >= cutoff) {
    // If it's already past 6 PM, set to 6 PM tomorrow
    cutoff.setDate(cutoff.getDate() + 1);
  }
  return cutoff;
}

// Returns true if the current time is past 6 PM (session expired)
export const isSessionExpired = () => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(18, 0, 0, 0);
  return now >= cutoff;
};

// Returns milliseconds remaining until 6 PM
export const getRemainingSessionTime = () => {
  const now = new Date();
  const cutoff = getNext6PM();
  return cutoff - now;
};

// Format remaining time in a human-readable format
export const formatRemainingTime = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
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

// No need for setSessionStartTime, getSessionStartTime, or clearSession anymore
export const setSessionStartTime = () => {};
export const getSessionStartTime = () => null;
export const clearSession = () => {}; 