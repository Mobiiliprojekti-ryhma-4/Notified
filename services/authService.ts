
// authService.ts
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/Config';

/**
 * Login käyttäjälle
 */
export const login = async (email: string, password: string) => {
  console.log('Login started for', email);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  console.log('Login success:', userCredential.user.uid);
  return userCredential.user;
};
console.log('Firebase app name:', auth.app.name)
/**
 * Rekisteröi käyttäjän Firebase Authiin ja luo Firestore-dokumentti roolilla
 */
// Rekisteröinti Authiin ja Firestoreen
export const register = async (email: string, password: string) => {
  console.log('Register started for', email);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('Auth user created', user.uid);

    
    setDoc(doc(db, 'users', user.uid), {
      email,
      role: 'customer',
      createdAt: new Date(),
    })
      .then(() => console.log('Firestore doc created!'))
      .catch(err => console.error('Firestore doc error', err));

    return user;

  } catch (error: any) {
    console.error('Register error', error);
    throw error;
  }
};

/**
 * Initialize user in Firestore after Google/social login
 * Creates user document if it doesn't exist
 */
export const initializeGoogleUser = async (uid: string, email: string, displayName?: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Aseta käyttäjä roolilla jos dokumentti ei ole olemassa
    await setDoc(
      userRef,
      {
        email,
        displayName: displayName || email.split('@')[0],
        role: 'customer',
        createdAt: new Date(),
        lastLogin: new Date(),
        authProvider: 'google',
        googleId: uid, // Google:n antama uniikki tunniste
      },
      { merge: true } // Ei ylikirjoita olemassa olevaa dokumenttia
    );

    console.log('User initialized in Firestore:', uid);
    return true;
  } catch (error: any) {
    console.error('Failed to initialize user in Firestore:', error);
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async () => {
  await signOut(auth);
  console.log('User logged out');
};
