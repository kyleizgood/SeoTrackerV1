import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, getDoc, query, where, orderBy, onSnapshot, addDoc, updateDoc, arrayUnion, limit as fsLimit, startAfter as fsStartAfter, enableIndexedDbPersistence, writeBatch } from 'firebase/firestore';
import { auth } from './firebase';
import { addOptimisticUpdate, completeOptimisticUpdate, failOptimisticUpdate, addBackgroundOperation } from './optimisticUI.js';

// Enhanced in-memory cache for frequently accessed data
const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (increased from 10)

// Cache helper functions
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (pattern) => {
  if (pattern) {
    Array.from(cache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    cache.clear();
  }
};

// Enhanced write throttling with optimistic updates
const writeThrottle = new Map();
const MIN_WRITE_INTERVAL = 1000; // 1 second - reduced for better user experience

const throttleWrite = (key) => {
  const now = Date.now();
  const lastWrite = writeThrottle.get(key) || 0;
  
  if (now - lastWrite < MIN_WRITE_INTERVAL) {
    return false; // Throttled
  }
  
  writeThrottle.set(key, now);
  return true; // Not throttled
};

// Optimistic save company function
export async function saveCompanyOptimistic(company, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `saveCompany_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('update', company, () => 
    setDoc(doc(db, 'users', user.uid, 'companies', company.id.toString()), company)
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(company);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Save company throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await setDoc(doc(db, 'users', user.uid, 'companies', company.id.toString()), company);
      clearCache(`companies_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Company saved to Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to save company:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic delete company function
export async function deleteCompanyOptimistic(companyId, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `deleteCompany_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('delete', { id: companyId }, () => 
    deleteDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()))
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(companyId);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Delete company throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()));
      clearCache(`companies_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Company deleted from Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to delete company:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic save template function
export async function saveTemplateOptimistic(template, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `saveTemplate_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('update', template, () => 
    setDoc(doc(db, 'users', user.uid, 'templates', template.id.toString()), template)
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(template);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Save template throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await setDoc(doc(db, 'users', user.uid, 'templates', template.id.toString()), template);
      clearCache(`templates_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Template saved to Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to save template:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic delete template function
export async function deleteTemplateOptimistic(templateId, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `deleteTemplate_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('delete', { id: templateId }, () => 
    deleteDoc(doc(db, 'users', user.uid, 'templates', templateId.toString()))
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(templateId);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Delete template throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'templates', templateId.toString()));
      clearCache(`templates_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Template deleted from Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to delete template:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic save ticket function
export async function saveTicketOptimistic(ticket, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `saveTicket_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('update', ticket, () => 
    setDoc(doc(db, 'users', user.uid, 'tickets', ticket.id.toString()), ticket)
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(ticket);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Save ticket throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await setDoc(doc(db, 'users', user.uid, 'tickets', ticket.id.toString()), ticket);
      clearCache(`tickets_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Ticket saved to Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to save ticket:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic delete ticket function
export async function deleteTicketOptimistic(ticketId, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `deleteTicket_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('delete', { id: ticketId }, () => 
    deleteDoc(doc(db, 'users', user.uid, 'tickets', ticketId.toString()))
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(ticketId);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Delete ticket throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'tickets', ticketId.toString()));
      clearCache(`tickets_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Ticket deleted from Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic save note function
export async function saveNoteOptimistic(note, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `saveNote_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('update', note, () => 
    setDoc(doc(db, 'users', user.uid, 'notes', note.id.toString()), note)
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(note);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Save note throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await setDoc(doc(db, 'users', user.uid, 'notes', note.id.toString()), note);
      clearCache(`notes_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Note saved to Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to save note:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Optimistic delete note function
export async function deleteNoteOptimistic(noteId, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `deleteNote_${user.uid}`;
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('delete', { id: noteId }, () => 
    deleteDoc(doc(db, 'users', user.uid, 'notes', noteId.toString()))
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(noteId);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      if (!throttleWrite(throttleKey)) {
        console.log('Delete note throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId.toString()));
      clearCache(`notes_${user.uid}`);
      completeOptimisticUpdate(optimisticId);
      console.log('Note deleted from Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to delete note:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

// Keep existing functions for backward compatibility
export async function saveCompany(company) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const throttleKey = `saveCompany_${user.uid}`;
  
  if (!throttleWrite(throttleKey)) {
    // console.log('Save company throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'companies', company.id.toString()), company);
  // Clear cache to ensure fresh data
  clearCache(`companies_${user.uid}`);
  // console.log('Company saved to Firestore (throttled)');
}

// Bulk save companies without throttling for better user experience
export async function saveCompaniesBulk(companies) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  console.log(`Saving ${companies.length} companies in bulk...`);
  
  // Use batch writes for better performance and atomicity
  const batch = writeBatch(db);
  
  companies.forEach(company => {
    const docRef = doc(db, 'users', user.uid, 'companies', company.id.toString());
    batch.set(docRef, company);
  });
  
  await batch.commit();
  clearCache(`companies_${user.uid}`);
  console.log(`Successfully saved ${companies.length} companies to Firestore`);
}

// Get all companies for the current user (with enhanced caching)
export async function getCompanies() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  const cacheKey = `companies_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached companies data');
    return cached;
  }
  
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'companies'));
  const data = snapshot.docs.map(doc => doc.data());
  setCachedData(cacheKey, data);
  return data;
}

// Delete a company
export async function deleteCompany(companyId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  if (!companyId) throw new Error('No companyId provided to deleteCompany');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `deleteCompany_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    // console.log('Delete company throttled, skipping write');
    return;
  }
  
  await deleteDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()));
  // Clear cache to ensure fresh data
  clearCache(`companies_${user.uid}`);
      // console.log('Company deleted from Firestore (throttled)');
}

// --- PACKAGE HELPERS ---
export async function savePackagesOptimistic(packages, onSuccess, onError) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Create optimistic update
  const optimisticId = addOptimisticUpdate('update', packages, () => 
    setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages })
  );
  
  // Apply optimistic update immediately
  if (onSuccess) onSuccess(packages);
  
  // Execute background operation
  addBackgroundOperation(async () => {
    try {
      const throttleKey = `savePackages_${user.uid}`;
      if (!throttleWrite(throttleKey)) {
        console.log('Save packages throttled, skipping write');
        completeOptimisticUpdate(optimisticId);
        return;
      }
      
      await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
      clearCache('packages');
      completeOptimisticUpdate(optimisticId);
      console.log('Packages saved to Firestore (optimistic)');
    } catch (error) {
      console.error('Failed to save packages:', error);
      failOptimisticUpdate(optimisticId, error);
      if (onError) onError(error);
    }
  });
  
  return optimisticId;
}

export async function savePackages(packages) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check if this is a critical operation (Business Profile Claiming update)
  const isCriticalOperation = Object.values(packages).some(pkgCompanies => 
    pkgCompanies.some(company => 
      company.tasks?.businessProfileClaiming === 'Ticket' || 
      company.tasks?.businessProfileClaiming === 'Completed'
    )
  );
  
  // Skip throttling for critical operations
  if (!isCriticalOperation) {
    const throttleKey = `savePackages_${user.uid}`;
    if (!throttleWrite(throttleKey)) {
      console.log('Save packages throttled, skipping write');
      return;
    }
  }
  
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
  
  // Clear cache when packages are updated
  clearCache('packages');
  console.log(`Packages saved to Firestore ${isCriticalOperation ? '(critical operation)' : '(throttled)'}`);
}

export async function getPackages() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `packages_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached packages data');
    return cached;
  }
  
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  const packages = meta ? meta.data().packages : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
  
  // Cache the result
  setCachedData(cacheKey, packages);
  return packages;
}

// --- TEMPLATE HELPERS ---
export async function saveTemplate(template) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveTemplate_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save template throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'templates', template.id.toString()), template);
  console.log('Template saved to Firestore (throttled)');
}

export async function getTemplates() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `templates_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached templates data');
    return cached;
  }
  
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'templates'));
  const data = snapshot.docs.map(doc => doc.data());
  setCachedData(cacheKey, data);
  return data;
}

export async function deleteTemplate(templateId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `deleteTemplate_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Delete template throttled, skipping write');
    return;
  }
  
  await deleteDoc(doc(db, 'users', user.uid, 'templates', templateId.toString()));
  // Clear cache when templates are deleted
  clearCache(`templates_${user.uid}`);
  console.log('Template deleted from Firestore (throttled)');
}

// Bulk delete templates (for category deletion)
export async function deleteTemplatesBulk(templateIds) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Use a single throttle key for bulk operations
  const throttleKey = `deleteTemplatesBulk_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Bulk delete templates throttled, skipping write');
    return;
  }
  
  // Delete all templates in parallel
  const deletePromises = templateIds.map(id => 
    deleteDoc(doc(db, 'users', user.uid, 'templates', id.toString()))
  );
  
  await Promise.all(deletePromises);
  // Clear cache when templates are deleted
  clearCache(`templates_${user.uid}`);
  console.log(`${templateIds.length} templates deleted from Firestore (bulk operation)`);
}

// --- TICKET HELPERS ---
export async function saveTicket(ticket) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  console.log('🎫 saveTicket called with ticket:', ticket);
  console.log('🎫 Ticket taskType:', ticket.taskType);
  
  // Skip throttling for business profile claiming tickets (critical operation)
  const isBusinessProfileClaiming = ticket.taskType === 'businessProfileClaiming';
  
  if (!isBusinessProfileClaiming) {
    // Throttle writes to prevent excessive operations (only for non-critical tickets)
    const throttleKey = `saveTicket_${user.uid}`;
    if (!throttleWrite(throttleKey)) {
      console.log('🎫 Save ticket throttled, skipping write');
      return;
    }
  } else {
    console.log('🚨 Bypassing throttling for Business Profile Claiming ticket');
  }
  
  try {
    console.log('🎫 Attempting to save ticket to Firestore...');
    await setDoc(doc(db, 'users', user.uid, 'tickets', ticket.id.toString()), ticket);
    
    // Clear cache when tickets are updated
    clearCache('tickets');
    console.log(`🎫 Ticket saved to Firestore ${isBusinessProfileClaiming ? '(critical operation)' : '(throttled)'}`);
  } catch (error) {
    console.error('❌ Error in saveTicket:', error);
    throw error; // Re-throw to be caught by the calling function
  }
}

export async function getTickets() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `tickets_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached tickets data');
    return cached;
  }
  
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'tickets'));
  const tickets = snapshot.docs.map(doc => doc.data());
  
  // Cache the result
  setCachedData(cacheKey, tickets);
  return tickets;
}

export async function deleteTicket(ticketId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `deleteTicket_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Delete ticket throttled, skipping write');
    return;
  }
  
  await deleteDoc(doc(db, 'users', user.uid, 'tickets', ticketId.toString()));
  // Clear cache when tickets are updated
  clearCache('tickets');
  console.log('Ticket deleted from Firestore (throttled)');
}

// --- TRASH HELPERS ---
export async function saveTrash(trash) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveTrash_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save trash throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'meta', 'trash'), { trash });
  console.log('Trash saved to Firestore (throttled)');
}

export async function getTrash() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `trash_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached trash data');
    return cached;
  }
  
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'trash');
  const trash = meta ? meta.data().trash : [];
  
  // Cache the result
  setCachedData(cacheKey, trash);
  return trash;
}

// --- COMPANY STATUS HELPERS ---
export async function updateCompanyAuditStatus(companyId, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `updateCompanyAuditStatus_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Update company audit status throttled, skipping write');
    return;
  }
  
  await updateDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()), {
    [field]: value
  });
  console.log('Company audit status updated (throttled)');
}

export async function updatePackageCompanyStatus(companyId, pkg, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `updatePackageCompanyStatus_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Update package company status throttled, skipping write');
    return;
  }
  
  const packages = await getPackages();
  if (packages[pkg]) {
    const updatedCompanies = packages[pkg].map(company => {
      if (company.id === companyId) {
        return { ...company, [field]: value };
      }
      return company;
    });
    packages[pkg] = updatedCompanies;
    await savePackages(packages);
    console.log('Package company status updated (throttled)');
  }
}

// --- NOTES HELPERS ---
export async function getNotes() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `notes_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    // console.log('Using cached notes data');
    return cached;
  }
  
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'notes'));
  const notes = snapshot.docs.map(doc => doc.data());
  
  // Cache the result
  setCachedData(cacheKey, notes);
  return notes;
}

export async function saveNote(note) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveNote_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save note throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'notes', note.id.toString()), note);
  // Clear cache when notes are updated
  clearCache('notes');
  console.log('Note saved to Firestore (throttled)');
}

export async function deleteNote(noteId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `deleteNote_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Delete note throttled, skipping write');
    return;
  }
  
  await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId.toString()));
  // Clear cache when notes are updated
  clearCache('notes');
  console.log('Note deleted from Firestore (throttled)');
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
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveCategories_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save categories throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'meta', 'categories'), { categories });
  console.log('Categories saved to Firestore (throttled)');
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

// --- EOC HELPERS ---
export async function getEOCAccounts() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');

  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  const packages = meta ? meta.data().packages : {};

  const eocAccounts = [];
  Object.entries(packages).forEach(([pkg, companies]) => {
    companies.forEach(company => {
      if (company.status === 'EOC') {
        // Calculate EOC date if not present
        let eocDate = company.eocDate;
        if (!eocDate && company.start) {
          const startParts = company.start.match(/(\w+)\s+(\d+),\s+(\d+)/);
          if (startParts) {
            const [_, month, day, year] = startParts;
            const startDate = new Date(`${month} ${day}, ${year}`);
            const eocDateObj = new Date(startDate);
            eocDateObj.setFullYear(eocDateObj.getFullYear() + 1);
            const months = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            eocDate = `${months[eocDateObj.getMonth()]} ${eocDateObj.getDate()}, ${eocDateObj.getFullYear()}`;
          }
        }

        eocAccounts.push({
          ...company,
          package: pkg,
          eocDate: eocDate || 'N/A'
        });
      }
    });
  });

  return eocAccounts;
}

// Update the markAsEOC function to accept a custom EOC date and only set it when final
export async function markAsEOC(companyId, pkg, finalEOCDate) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  if (!finalEOCDate) throw new Error('Final EOC date must be provided when marking as EOC');
  
  // Get current packages
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  let packages = meta ? meta.data().packages : {};
  
  // Find the company to get its start date
  const company = packages[pkg]?.find(c => c.id === companyId);
  if (!company) {
    console.error('Company not found:', { companyId, pkg });
    return;
  }

  // Create updated company data with provided final EOC date
  const updatedCompany = {
    ...company,
    status: 'EOC',
    eocDate: finalEOCDate
  };
  
  // Update the company in the correct package
  packages[pkg] = (packages[pkg] || []).map(c =>
    c.id === companyId ? updatedCompany : c
  );
  
  // Save back to Firestore
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
  
  return updatedCompany;
}

// Reactivate an EOC account
export async function reactivateEOCAccount(companyId, pkg, newStatus = 'Active') {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Get current packages
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  let packages = meta ? meta.data().packages : {};
  
  // Update the company in the correct package
  packages[pkg] = (packages[pkg] || []).map(c =>
    c.id === companyId ? {
      ...c,
      status: newStatus,
      eocDate: null,
      reactivatedDate: new Date().toISOString(),
    } : c
  );
  
  // Save back to Firestore
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
} 

// Add function to update EOC date
export async function updateEOCDate(companyId, pkg, newEOCDate) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Get current packages
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  let packages = meta ? meta.data().packages : {};
  console.log('[updateEOCDate] Packages before update:', JSON.parse(JSON.stringify(packages)));
  
  // Ensure companyId is a string for comparison
  const companyIdStr = String(companyId);
  // Find and update the company
  packages[pkg] = (packages[pkg] || []).map(c =>
    String(c.id) === companyIdStr ? { ...c, eocDate: newEOCDate } : c
  );
  console.log('[updateEOCDate] Packages after update:', JSON.parse(JSON.stringify(packages)));
  
  // Save back to Firestore with error logging
  try {
    await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
    // Clear cache to ensure fresh data
    clearCache(`packages_${user.uid}`);
  } catch (err) {
    console.error('[updateEOCDate] Firestore error:', err);
    throw err;
  }
  
  return { id: companyId, package: pkg, eocDate: newEOCDate };
} 

// --- HISTORY LOG HELPERS ---

/**
 * Save a history log array for a given page (e.g., 'report', 'bookmarking', 'linkbuilding')
 */
export async function saveHistoryLog(pageKey, historyArr) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'history', pageKey), { log: historyArr });
}

/**
 * Load a history log array for a given page
 */
export async function loadHistoryLog(pageKey) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDoc(doc(db, 'users', user.uid, 'history', pageKey));
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data.log || [];
  }
  return [];
}

/**
 * Clear a history log for a given page
 */
export async function clearHistoryLog(pageKey) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'history', pageKey), { log: [] });
} 

export async function updateCompanyStatus(companyId, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `updateCompanyStatus_${user.uid}_${companyId}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Update company status throttled, skipping write');
    return;
  }
  
  const companyRef = doc(db, 'users', user.uid, 'companies', companyId.toString());
  await setDoc(companyRef, { [field]: value }, { merge: true });
  
  // Clear cache when companies are updated
  clearCache('companies');
  console.log('Company status updated in Firestore (throttled)');
}

// --- RESOURCE HELPERS ---

export async function saveResource(resource) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveResource_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save resource throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'resources', resource.id.toString()), resource);
  
  // Clear cache when resources are updated
  clearCache('resources');
  console.log('Resource saved to Firestore (throttled)');
}

export async function deleteResource(resourceId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `deleteResource_${user.uid}_${resourceId}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Delete resource throttled, skipping write');
    return;
  }
  
  await deleteDoc(doc(db, 'users', user.uid, 'resources', resourceId.toString()));
  
  // Clear cache when resources are updated
  clearCache('resources');
  console.log('Resource deleted from Firestore (throttled)');
}

export async function getResourceSections() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Check cache first
  const cacheKey = `resourceSections_${user.uid}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    console.log('Using cached resource sections data');
    return cached;
  }
  
  const docSnap = await getDoc(doc(db, 'users', user.uid, 'meta', 'resourceSections'));
  const sections = docSnap.exists() ? docSnap.data().sections : ['Site Audit', 'Keyword Research', 'Other Sheets'];
  
  // Cache the result
  setCachedData(cacheKey, sections);
  return sections;
}

export async function saveResourceSections(sections) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  
  // Throttle writes to prevent excessive operations
  const throttleKey = `saveResourceSections_${user.uid}`;
  if (!throttleWrite(throttleKey)) {
    console.log('Save resource sections throttled, skipping write');
    return;
  }
  
  await setDoc(doc(db, 'users', user.uid, 'meta', 'resourceSections'), { sections });
  
  // Clear cache when resource sections are updated
  clearCache('resourceSections');
  console.log('Resource sections saved to Firestore (throttled)');
} 