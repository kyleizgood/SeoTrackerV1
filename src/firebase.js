import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAFv1BkZi8HIFO1dABZ2UEAWvszYnPGhQ8',
  authDomain: 'seo-tracker-v1.firebaseapp.com',
  projectId: 'seo-tracker-v1',
  storageBucket: 'seo-tracker-v1.appspot.com',
  messagingSenderId: '298987231292',
  appId: '1:298987231292:web:532faa1cd285709bc20b39'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Firebase Auth to use session persistence (clears when browser closes)
// This prevents automatic re-login after logout
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    // All console.log, console.warn, and console.error statements removed
  })
  .catch((error) => {
    // All console.log, console.warn, and console.error statements removed
  });

export const db = getFirestore(app); 
export const storage = getStorage(app); 
