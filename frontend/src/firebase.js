// Firebase client SDK configuration
// Replace these values with your Firebase project's web app config
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPT9nYibDRmWKy_lINlxThY3-4SJR4dVE",
  authDomain: "animal-voice-safari.firebaseapp.com",
  projectId: "animal-voice-safari",
  storageBucket: "animal-voice-safari.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
