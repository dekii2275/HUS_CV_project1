import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection check as per instructions
async function testConnection() {
  try {
    // Attempting to reach the server directly
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firebase connection established successfully.");
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.error("CRITICAL: Could not reach Cloud Firestore backend. Please ensure Firestore is enabled in your Firebase Console and the database has been created.");
    } else if (error?.code === 'permission-denied') {
      // This is actually a good sign - it means we reached the server but don't have access
      console.log("Firestore reached (Permission Denied as expected).");
    } else {
      console.error("Firebase Configuration Error:", error);
    }
  }
}

testConnection();

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider).catch((error) => {
    if (error.code === 'auth/configuration-not-found') {
      console.error("CRITICAL: Firebase Authentication is not configured correctly. Please ensure 'Google' sign-in is enabled in the Firebase Console under Authentication > Sign-in method.");
    }
    throw error;
  });
};

export const signOut = () => auth.signOut();
