// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration - REPLACE WITH YOUR ACTUAL CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyByFuOhNKzsjbE7EfT8Ive3dV9a34v5PT8",
  authDomain: "shoe-store-8791a.firebaseapp.com",
  projectId: "shoe-store-8791a",
  storageBucket: "shoe-store-8791a.firebasestorage.app",
  messagingSenderId: "154262453308",
  appId: "1:154262453308:web:f9691f8eab4707657ad739",
  measurementId: "G-HPGD9FFV1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;