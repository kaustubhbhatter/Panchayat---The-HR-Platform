import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvGDVwIRDxyUPaIBo9IABwUSqyLUeL37o",
  authDomain: "panchayat-a9b29.firebaseapp.com",
  projectId: "panchayat-a9b29",
  storageBucket: "panchayat-a9b29.firebasestorage.app",
  messagingSenderId: "681772256581",
  appId: "1:681772256581:web:a33891d08f08019501c22c",
  measurementId: "G-L61QKTYKR9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
