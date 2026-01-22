import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/Config'
import { signOut } from 'firebase/auth' // added sign out 

export const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  )
  return userCredential.user
}


export const register = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )
  return userCredential.user
}

export const logout = async () => {
  await signOut(auth)
}