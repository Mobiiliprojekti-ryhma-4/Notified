// services/googleAuth.ts
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase/Config";
import { useEffect, useState, useRef } from "react";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth(): {
  signInWithGoogle: () => Promise<void>;
  isReady: boolean;
  loading: boolean;
} {
  const redirectUri = Google.makeRedirectUri({ scheme: "com.anonymous.HuoltoHommeli" });
  console.log('[useGoogleAuth] redirectUri:', redirectUri);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    redirectUri,
  });

  const [loading, setLoading] = useState(false);
  const pendingRef = useRef<{
    resolve: () => void;
    reject: (err?: any) => void;
  } | null>(null);

  useEffect(() => {
    async function handleResponse() {
      if (!response) return;
      console.log('[useGoogleAuth] response:', response);

      if (response.type !== "success") {
        // non-success responses (dismiss/cancel) should reject pending promise
        if (pendingRef.current) {
          pendingRef.current.reject(new Error(`Auth response: ${response.type}`));
          pendingRef.current = null;
        }
        return;
      }

      // try both places for id token depending on provider hook
      const idToken = response.authentication?.idToken ?? (response.params as any)?.id_token;
      if (!idToken) {
        if (pendingRef.current) {
          pendingRef.current.reject(new Error("No id_token returned from provider"));
          pendingRef.current = null;
        }
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);

      setLoading(true);
      try {
        await signInWithCredential(auth, credential);
        console.log("Firebase sign-in success");
        if (pendingRef.current) {
          pendingRef.current.resolve();
          pendingRef.current = null;
        }
      } catch (err) {
        console.error("Firebase auth error:", err);
        if (pendingRef.current) {
          pendingRef.current.reject(err);
          pendingRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    }

    void handleResponse();
  }, [response]);

  const signInWithGoogle = async () => {
    // create a promise that will resolve/reject once Firebase sign-in finishes
    return new Promise<void>(async (resolve, reject) => {
      if (pendingRef.current) {
        // another sign-in in progress
        reject(new Error("Sign-in already in progress"));
        return;
      }

      pendingRef.current = { resolve, reject };

      try {
        const result = await promptAsync();
        console.log('[useGoogleAuth] promptAsync result:', result);
        // some flows resolve immediately (web) and provide params here
        // but we rely on the response effect to handle the rest.
        if (result?.type === "error") {
          if (pendingRef.current) {
            pendingRef.current.reject(new Error("Prompt error"));
            pendingRef.current = null;
          }
        }
      } catch (err) {
        console.error("Google prompt error:", err);
        if (pendingRef.current) {
          pendingRef.current.reject(err);
          pendingRef.current = null;
        }
      }
    });
  };

  return {
    signInWithGoogle,
    isReady: !!request,
    loading,
  };
}

