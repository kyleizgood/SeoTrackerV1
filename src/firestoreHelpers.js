import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, where, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, limit as fsLimit, startAfter as fsStartAfter } from 'firebase/firestore';
import { auth } from './firebase';

// Save a company for the current user
export async function saveCompany(company) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'companies', company.id.toString()), company);
}

// Get all companies for the current user
export async function getCompanies() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'companies'));
  return snapshot.docs.map(doc => doc.data());
}

// Delete a company
export async function deleteCompany(companyId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  if (!companyId) throw new Error('No companyId provided to deleteCompany');
  await deleteDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()));
}

// --- PACKAGE HELPERS ---
export async function savePackages(packages) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
}
export async function getPackages() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  return meta ? meta.data().packages : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
}
// --- TEMPLATE HELPERS ---
export async function saveTemplate(template) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'templates', template.id.toString()), template);
}
export async function getTemplates() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'templates'));
  return snapshot.docs.map(doc => doc.data());
}
export async function deleteTemplate(templateId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'templates', templateId.toString()));
}
// --- TICKET HELPERS ---
export async function saveTicket(ticket) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'tickets', ticket.id.toString()), ticket);
}
export async function getTickets() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'tickets'));
  return snapshot.docs.map(doc => doc.data());
}
export async function deleteTicket(ticketId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'tickets', ticketId.toString()));
}
// --- TRASH HELPERS ---
export async function saveTrash(trash) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'trash'), { trash });
}
export async function getTrash() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'trash');
  return meta ? meta.data().trash : [];
}

// Update a specific audit status field for a company
export async function updateCompanyAuditStatus(companyId, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const companyRef = doc(db, 'users', user.uid, 'companies', companyId.toString());
  await setDoc(companyRef, { [field]: value }, { merge: true });
}

// --- RESOURCE HELPERS ---
export async function getResources() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'resources'));
  return snapshot.docs.map(doc => doc.data());
}

export async function saveResource(resource) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'resources', resource.id), resource);
}

export async function deleteResource(resourceId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'resources', resourceId));
}

// --- RESOURCE SECTION HELPERS ---
export async function getResourceSections() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = snapshot.docs.find(d => d.id === 'resourceSections');
  return meta ? meta.data().sections : ['Site Audit', 'Keyword Research', 'Other Sheets'];
}

export async function saveResourceSections(sections) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'resourceSections'), { sections });
}

// Update a specific status field for a company inside a package in meta/packages
export async function updatePackageCompanyStatus(companyId, pkg, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  // Get current packages
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  let packages = meta ? meta.data().packages : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
  // Update the company in the correct package
  packages[pkg] = (packages[pkg] || []).map(c =>
    c.id === companyId ? { ...c, [field]: value } : c
  );
  // Save back to Firestore
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
}

// NOTES HELPERS
export async function getNotes() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'notes'));
  return snapshot.docs.map(doc => doc.data());
}
export async function saveNote(note) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'notes', note.id), note);
}
export async function deleteNote(noteId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
}

// --- PAGINATED NOTES HELPER ---
export async function getNotesPaginated(limitCount = 20, startAfterDoc = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  let notesQuery = query(
    collection(db, 'users', user.uid, 'notes'),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc) {
    notesQuery = query(
      collection(db, 'users', user.uid, 'notes'),
      orderBy('createdAt', 'desc'),
      fsStartAfter(startAfterDoc),
      fsLimit(limitCount)
    );
  }
  const snapshot = await getDocs(notesQuery);
  const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = notes.length === limitCount;
  return { notes, lastDoc, hasMore };
}

// --- PAGINATED RESOURCES HELPER ---
export async function getResourcesPaginated(limitCount = 20, startAfterDoc = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  let q = query(
    collection(db, 'users', user.uid, 'resources'),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc) {
    q = query(
      collection(db, 'users', user.uid, 'resources'),
      orderBy('createdAt', 'desc'),
      fsStartAfter(startAfterDoc),
      fsLimit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  const hasMore = items.length === limitCount;
  return { items, lastDoc, hasMore };
}
// --- PAGINATED TICKETS HELPER ---
export async function getTicketsPaginated(limitCount = 20, startAfterDoc = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  let q = query(
    collection(db, 'users', user.uid, 'tickets'),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc) {
    q = query(
      collection(db, 'users', user.uid, 'tickets'),
      orderBy('createdAt', 'desc'),
      fsStartAfter(startAfterDoc),
      fsLimit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  const hasMore = items.length === limitCount;
  return { items, lastDoc, hasMore };
}
// --- PAGINATED PACKAGES HELPER ---
export async function getPackagesPaginated(limitCount = 20, startAfterDoc = null) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  let q = query(
    collection(db, 'users', user.uid, 'meta'),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc) {
    q = query(
      collection(db, 'users', user.uid, 'meta'),
      orderBy('createdAt', 'desc'),
      fsStartAfter(startAfterDoc),
      fsLimit(limitCount)
    );
  }
  const snap = await getDocs(q);
  const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  const hasMore = items.length === limitCount;
  return { items, lastDoc, hasMore };
}

// --- CATEGORY HELPERS ---
export async function saveCategories(categories) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'categories'), { categories });
}

export async function getCategories() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'categories');
  return meta ? meta.data().categories : null;
}

// --- CHAT HELPERS ---

// Get all registered users (for user list)
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Create or get a 1-on-1 conversation between two users
export async function createConversation(userId1, userId2) {
  const convQuery = query(
    collection(db, 'conversations'),
    where('participants', 'in', [
      [userId1, userId2],
      [userId2, userId1],
    ])
  );
  const snapshot = await getDocs(convQuery);
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  // Fetch user info for both participants
  const user1Snap = await getDoc(doc(db, 'users', userId1));
  const user2Snap = await getDoc(doc(db, 'users', userId2));
  const user1 = user1Snap.exists() ? user1Snap.data() : {};
  const user2 = user2Snap.exists() ? user2Snap.data() : {};
  const participantsInfo = {
    [userId1]: {
      displayName: user1.displayName || '',
      photoURL: user1.photoURL || '',
    },
    [userId2]: {
      displayName: user2.displayName || '',
      photoURL: user2.photoURL || '',
    },
  };
  // Create new conversation
  const docRef = await addDoc(collection(db, 'conversations'), {
    participants: [userId1, userId2],
    participantsInfo,
    createdAt: new Date(),
    lastMessage: null,
  });
  return { id: docRef.id, participants: [userId1, userId2], participantsInfo, createdAt: new Date(), lastMessage: null };
}

// Get all conversations for a user
export async function getConversations(userId) {
  const convQuery = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(convQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Send a message in a conversation
export async function sendMessage(conversationId, senderId, text, localId = null, status = 'sent') {
  const msgRef = collection(db, 'conversations', conversationId, 'messages');
  const msgData = {
    senderId,
    text,
    timestamp: new Date(),
    readBy: [senderId],
    status, // new field for message status
  };
  if (localId) msgData.localId = localId; // new field for local message tracking
  const msgDoc = await addDoc(msgRef, msgData);
  // Update lastMessage in conversation
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: {
      text,
      senderId,
      timestamp: new Date(),
      ...(localId ? { localId } : {}),
    },
  });
  // Increment unreadCount for all other participants
  const convDoc = await getDoc(doc(db, 'conversations', conversationId));
  if (convDoc.exists()) {
    const data = convDoc.data();
    if (data.participants) {
      const updates = {};
      data.participants.forEach(uid => {
        if (uid !== senderId) {
          updates[`unreadCount.${uid}`] = (data.unreadCount && data.unreadCount[uid] ? data.unreadCount[uid] + 1 : 1);
        }
      });
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, 'conversations', conversationId), updates);
      }
    }
  }
  return msgDoc;
}

// Listen for messages in a conversation (real-time), with limit and pagination support
export function listenForMessages(conversationId, callback, limitCount = 50, startAfterMessage = null) {
  let msgsQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterMessage && startAfterMessage.timestamp) {
    msgsQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'desc'),
      fsStartAfter(startAfterMessage.timestamp),
      fsLimit(limitCount)
    );
  }
  return onSnapshot(msgsQuery, snapshot => {
    // Return messages in ascending order for UI
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
    callback(messages);
  });
}

// Fetch older messages for pagination (not real-time)
export async function fetchOlderMessages(conversationId, lastMessage, limitCount = 50) {
  let msgsQuery = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'desc'),
    fsStartAfter(lastMessage.timestamp),
    fsLimit(limitCount)
  );
  const snapshot = await getDocs(msgsQuery);
  // Return messages in ascending order for UI
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
}

// Mark all messages as read by user and reset unreadCount
export async function markMessagesAsRead(conversationId, userId) {
  const msgsQuery = query(collection(db, 'conversations', conversationId, 'messages'));
  const snapshot = await getDocs(msgsQuery);
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.readBy?.includes(userId)) {
      await updateDoc(docSnap.ref, { readBy: arrayUnion(userId) });
    }
  }
  // Reset unreadCount for this user
  await updateDoc(doc(db, 'conversations', conversationId), { [`unreadCount.${userId}`]: 0 });
}

// Add a reaction to a message
export async function addReactionToMessage(conversationId, messageId, emoji, userId) {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const msgSnap = await getDoc(msgRef);
  if (!msgSnap.exists()) return;
  const data = msgSnap.data();
  const reactions = data.reactions || {};
  if (!reactions[emoji]) reactions[emoji] = [];
  if (!reactions[emoji].includes(userId)) reactions[emoji].push(userId);
  await updateDoc(msgRef, { reactions });
}

// Remove a reaction from a message
export async function removeReactionFromMessage(conversationId, messageId, emoji, userId) {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  const msgSnap = await getDoc(msgRef);
  if (!msgSnap.exists()) return;
  const data = msgSnap.data();
  const reactions = data.reactions || {};
  if (reactions[emoji]) {
    reactions[emoji] = reactions[emoji].filter(uid => uid !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  }
  await updateDoc(msgRef, { reactions });
}

// Edit a message
export async function editMessage(conversationId, messageId, newText) {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, { text: newText, edited: true });
}

// Delete a message
export async function deleteMessage(conversationId, messageId) {
  const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  await deleteDoc(msgRef);
}

// Fetch archived messages for a conversation (with optional pagination)
export async function fetchArchivedMessages(conversationId, limitCount = 50, startAfterDoc = null) {
  let q = query(
    collection(db, 'conversations', conversationId, 'archived_messages'),
    orderBy('timestamp', 'desc'),
    fsLimit(limitCount)
  );
  if (startAfterDoc && startAfterDoc.timestamp) {
    q = query(
      collection(db, 'conversations', conversationId, 'archived_messages'),
      orderBy('timestamp', 'desc'),
      fsStartAfter(startAfterDoc.timestamp),
      fsLimit(limitCount)
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
} 

// --- GITS HELPERS ---
export async function saveGits(gitServers) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'gits'), { gitServers });
}
export async function getGits() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDoc(doc(db, 'users', user.uid, 'meta', 'gits'));
  return docSnap.exists() && docSnap.data().gitServers ? docSnap.data().gitServers : [
    { label: 'Git 3', ip: '47.128.64.60' },
    { label: 'Git 4', ip: '54.179.74.207' },
  ];
} 