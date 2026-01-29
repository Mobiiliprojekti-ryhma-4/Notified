//AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, User } from "firebase/auth"
import { auth } from "../firebase/Config"
import { getUserRole, UserRole } from "../services/userService"

type AuthContextType = {
  user: User | null
  role: UserRole | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        try {
          const r = await getUserRole(u.uid)
          setRole(r)
        } catch (error) {
          console.warn("User role not found, defaulting to 'customer':", error)
          // Fallback to a safe default role so UI renders for new users
          setRole('customer')
        }
      } else {
        setRole(null)
      }

      setLoading(false)
    })

    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
