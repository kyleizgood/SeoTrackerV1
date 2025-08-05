// Optimistic UI Utility Functions
// This file provides utilities for implementing optimistic UI updates across the application

// Global optimistic update queue
const OPTIMISTIC_QUEUE = new Map();
let OPTIMISTIC_ID = 0;

// Optimistic update types
export const OPTIMISTIC_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  STATUS_CHANGE: 'status_change'
};

// Generate unique optimistic ID
const generateOptimisticId = () => {
  OPTIMISTIC_ID++;
  return `optimistic_${Date.now()}_${OPTIMISTIC_ID}`;
};

// Add optimistic update to queue
export const addOptimisticUpdate = (type, data, operation) => {
  const id = generateOptimisticId();
  OPTIMISTIC_QUEUE.set(id, {
    type,
    data,
    operation,
    timestamp: Date.now(),
    status: 'pending'
  });
  return id;
};

// Mark optimistic update as completed
export const completeOptimisticUpdate = (id) => {
  if (OPTIMISTIC_QUEUE.has(id)) {
    OPTIMISTIC_QUEUE.get(id).status = 'completed';
    // Remove from queue after 5 seconds
    setTimeout(() => {
      OPTIMISTIC_QUEUE.delete(id);
    }, 5000);
  }
};

// Mark optimistic update as failed
export const failOptimisticUpdate = (id, error) => {
  if (OPTIMISTIC_QUEUE.has(id)) {
    const update = OPTIMISTIC_QUEUE.get(id);
    update.status = 'failed';
    update.error = error;
    // Keep in queue for 10 seconds to show error
    setTimeout(() => {
      OPTIMISTIC_QUEUE.delete(id);
    }, 10000);
  }
};

// Get pending optimistic updates
export const getPendingOptimisticUpdates = () => {
  return Array.from(OPTIMISTIC_QUEUE.values()).filter(update => update.status === 'pending');
};

// Optimistic update wrapper for async operations
export const withOptimisticUpdate = async (optimisticId, operation, onSuccess, onError) => {
  try {
    const result = await operation();
    completeOptimisticUpdate(optimisticId);
    if (onSuccess) onSuccess(result);
    return result;
  } catch (error) {
    failOptimisticUpdate(optimisticId, error);
    if (onError) onError(error);
    throw error;
  }
};

// Optimistic state update helper
export const optimisticStateUpdate = (currentState, update, type) => {
  switch (type) {
    case OPTIMISTIC_TYPES.CREATE:
      return [...currentState, update];
    
    case OPTIMISTIC_TYPES.UPDATE:
      return currentState.map(item => 
        item.id === update.id ? { ...item, ...update } : item
      );
    
    case OPTIMISTIC_TYPES.DELETE:
      return currentState.filter(item => item.id !== update.id);
    
    case OPTIMISTIC_TYPES.STATUS_CHANGE:
      return currentState.map(item => 
        item.id === update.id ? { ...item, [update.field]: update.value } : item
      );
    
    default:
      return currentState;
  }
};

// Optimistic company update
export const optimisticCompanyUpdate = (companies, companyId, updates) => {
  return companies.map(company => 
    company.id === companyId ? { ...company, ...updates } : company
  );
};

// Optimistic package update
export const optimisticPackageUpdate = (packages, packageName, companyId, updates) => {
  const updatedPackages = { ...packages };
  if (updatedPackages[packageName]) {
    updatedPackages[packageName] = updatedPackages[packageName].map(company => 
      company.id === companyId ? { ...company, ...updates } : company
    );
  }
  return updatedPackages;
};

// Optimistic template update
export const optimisticTemplateUpdate = (templates, templateId, updates) => {
  return templates.map(template => 
    template.id === templateId ? { ...template, ...updates } : template
  );
};

// Optimistic ticket update
export const optimisticTicketUpdate = (tickets, ticketId, updates) => {
  return tickets.map(ticket => 
    ticket.id === ticketId ? { ...ticket, ...updates } : ticket
  );
};

// Optimistic note update
export const optimisticNoteUpdate = (notes, noteId, updates) => {
  return notes.map(note => 
    note.id === noteId ? { ...note, ...updates } : note
  );
};

// Optimistic trash update
export const optimisticTrashUpdate = (trash, itemId, updates) => {
  return trash.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );
};

// Debounced function for background operations
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttled function for background operations
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Background operation queue
const BACKGROUND_QUEUE = [];
let isProcessingBackground = false;

// Add operation to background queue
export const addBackgroundOperation = (operation, priority = 'normal') => {
  BACKGROUND_QUEUE.push({ operation, priority, timestamp: Date.now() });
  processBackgroundQueue();
};

// Process background queue
const processBackgroundQueue = async () => {
  if (isProcessingBackground || BACKGROUND_QUEUE.length === 0) return;
  
  isProcessingBackground = true;
  
  while (BACKGROUND_QUEUE.length > 0) {
    const { operation } = BACKGROUND_QUEUE.shift();
    
    try {
      await operation();
    } catch (error) {
      // All console.warn and console.error statements removed
    }
    
    // Small delay between operations to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  isProcessingBackground = false;
};

// Optimistic UI hook for React components
export const useOptimisticUI = (initialState) => {
  const [state, setState] = React.useState(initialState);
  const [pendingUpdates, setPendingUpdates] = React.useState(new Set());
  
  const optimisticUpdate = React.useCallback((updateFn, operation, optimisticId) => {
    // Apply optimistic update immediately
    setState(prevState => updateFn(prevState));
    setPendingUpdates(prev => new Set(prev).add(optimisticId));
    
    // Execute background operation
    addBackgroundOperation(async () => {
      try {
        await operation();
        setPendingUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(optimisticId);
          return newSet;
        });
      } catch (error) {
        // All console.warn and console.error statements removed
        // Optionally revert optimistic update on error
        // setState(prevState => revertUpdate(prevState));
      }
    });
  }, []);
  
  return [state, optimisticUpdate, pendingUpdates];
};

// Export React for the hook
import React from 'react'; 