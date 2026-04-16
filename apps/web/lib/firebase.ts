import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
} from "firebase/auth";

import { env } from "./env";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

export function getFirebaseAuth() {
  if (!hasFirebaseConfig()) {
    return null;
  }
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function signInWithGooglePopup() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not configured in this environment.");
  }
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function requestEmailLink(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not configured in this environment.");
  }
  await sendSignInLinkToEmail(auth, email, {
    url: env.NEXT_PUBLIC_APP_URL,
    handleCodeInApp: true,
  });
}

export async function completeEmailLinkSignIn(email: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not configured in this environment.");
  }
  if (!isSignInWithEmailLink(auth, window.location.href)) {
    throw new Error("No email sign-in link was found in the current URL.");
  }
  return signInWithEmailLink(auth, email, window.location.href);
}
