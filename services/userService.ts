import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/Config"

export type UserRole = "admin" | "worker" | "customer"

export async function getUserRole(uid: string): Promise<UserRole> {
  const ref = doc(db, "users", uid)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    throw new Error("User document not found")
  }

  return snap.data().role as UserRole
}
