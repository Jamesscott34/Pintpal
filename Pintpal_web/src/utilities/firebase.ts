/**
 * firebase.ts
 *
 * Purpose: Initialises the shared Firebase web app for PintPal (Auth, Firestore, Storage).
 * Connects to: Firebase project pintpal-71452. Imported by feature data modules under
 *              features/<name>/data. Not used directly from App Router pages.
 * Notes: Client-safe config only. Analytics is intentionally not initialised here until
 *        we confirm it is required (Section 2 stack does not list Analytics).
 *        Import this module from client components / hooks only (browser SDK).
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAn_IRGuBJLCrqZpPVrbHJjJ_JsUwmykv0",
  authDomain: "pintpal-71452.firebaseapp.com",
  projectId: "pintpal-71452",
  storageBucket: "pintpal-71452.firebasestorage.app",
  messagingSenderId: "681785760069",
  appId: "1:681785760069:web:34678a72fca2b92c91062c",
  measurementId: "G-BV2VS33CS6",
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseFirestore(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
