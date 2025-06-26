import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
export const db = getFirestore(app); 