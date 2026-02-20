import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider, 
  signInWithPopup
} from "firebase/auth";
import { db, auth } from "./firebaseConfig"; 
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Move provider OUTSIDE all functions
const provider = new GoogleAuthProvider();

// Login with Email
export const loginEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Helper function to sync user with Firestore
const syncUserWithFirestore = async (user) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: "staff",
    lastActive: serverTimestamp()
  }, { merge: true });
};

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  await syncUserWithFirestore(result.user);
  return result.user;
};

// Register with Email
export const registerEmail = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  return userCredential.user;
};