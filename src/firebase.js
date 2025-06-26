import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
<<<<<<< HEAD
import { getFirestore } from 'firebase/firestore';
=======
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd

const firebaseConfig = {
  apiKey: 'AIzaSyAFv1BkZi8HIFO1dABZ2UEAWvszYnPGhQ8',
  authDomain: 'seo-tracker-v1.firebaseapp.com',
  projectId: 'seo-tracker-v1',
  storageBucket: 'seo-tracker-v1.appspot.com',
  messagingSenderId: '298987231292',
  appId: '1:298987231292:web:532faa1cd285709bc20b39'
};

const app = initializeApp(firebaseConfig);
<<<<<<< HEAD
export const auth = getAuth(app);
export const db = getFirestore(app); 
=======
export const auth = getAuth(app); 
>>>>>>> f6da3cd75bab56c6c636b57e5b112d12ff0c6dbd
