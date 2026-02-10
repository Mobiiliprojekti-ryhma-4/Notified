import { auth, provider } from '../firebase/Config';
import { signInWithPopup } from 'firebase/auth';

export async function signInWithGoogleWeb() {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Logged in:', result.user);
    return result.user;
  } catch (err) {
    console.error('Google login failed:', err);
    throw err;
  }
}