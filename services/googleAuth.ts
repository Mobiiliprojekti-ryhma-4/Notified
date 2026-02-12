
// services/googleAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/Config";
import { initializeGoogleUser } from "./authService";
import { useEffect, useState, useRef } from "react";
import { Platform } from "react-native";
import * as AuthSession from "expo-auth-session";
WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri();

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);

  const pendingRef = useRef<{ resolve: () => void; reject: (err?: any) => void } | null>(null);

  //  Android/iOS OAuth
  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest({
      androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
      //iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
       webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, 
       redirectUri,
      });
console.log(redirectUri);
  //  Web-only: modern Google Identity API
  const signInWithGoogleWeb = async () => {
    return new Promise<void>((resolve, reject) => {
      // @ts-ignore
      if (!window.google?.accounts?.id) {
        reject(new Error("Google Identity Services not loaded"));
        return;
      }

      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
        callback: async (response: any) => {
          if (!response?.credential) {
            reject(new Error("No credential returned from Google"));
            return;
          }
          try {
            const credential = GoogleAuthProvider.credential(response.credential);
            const userCredential = await signInWithCredential(auth, credential);
            
            // Initialize user in Firestore
            await initializeGoogleUser(
              userCredential.user.uid,
              userCredential.user.email || "",
              userCredential.user.displayName || undefined
            );
            
            console.log("Firebase login success (Web)");
            resolve();
          } catch (err) {
            console.error("Firebase login error (Web):", err);
            reject(err);
          }
        },
      });
  
      // @ts-ignore
      window.google.accounts.id.prompt();
    });
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      if (!response) return;

      if (response.type !== "success") {
        pendingRef.current?.reject(new Error(response.type));
        pendingRef.current = null;
        return;
      }

      const idToken = response.authentication?.idToken ?? (response.params as any)?.id_token;
      if (!idToken) {
        pendingRef.current?.reject(new Error("No id_token"));
        pendingRef.current = null;
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);
      setLoading(true);

      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          // Initialize user in Firestore
          await initializeGoogleUser(
            userCredential.user.uid,
            userCredential.user.email || "",
            userCredential.user.displayName || undefined
          );
          console.log("Firebase login success (Android/iOS)");
          pendingRef.current?.resolve();
        })
        .catch((err) => {
          console.error("Firebase login error:", err);
          pendingRef.current?.reject(err);
        })
        .finally(() => {
          pendingRef.current = null;
          setLoading(false);
        });
    }
  }, [response]);

  const signInWithGoogle = () =>
    new Promise<void>((resolve, reject) => {
      pendingRef.current = { resolve, reject };

      if (Platform.OS === "web") {
        signInWithGoogleWeb()
          .then(() => pendingRef.current?.resolve())
          .catch((err) => pendingRef.current?.reject(err))
          .finally(() => (pendingRef.current = null));
      } else {
        if (!request) {
          reject(new Error("Auth request not ready"));
          pendingRef.current = null;
          return;
        }
        promptAsync();
      }
    });

  return {
    signInWithGoogle,
    isReady: Platform.OS === "web" || !!request,
    loading,
  };
}
    