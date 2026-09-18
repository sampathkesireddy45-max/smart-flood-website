import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCJhugcJOMNqQ_hXp-yaurAhAjJI1OJuvM",
  authDomain: "suraksha-flood-7acce.firebaseapp.com",
  projectId: "suraksha-flood-7acce",
  storageBucket: "suraksha-flood-7acce.firebasestorage.app",
  messagingSenderId: "791169549046",
  appId: "1:791169549046:web:c70afccfda84e34afbe2d7",
  measurementId: "G-LEMS863WJZ"
};

const STORAGE_KEY = "suraksha_firebase_config";

export const getSavedFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Could not read saved firebase config", e);
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveFirebaseConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Could not save firebase config", e);
  }
};

let app = null;
let authInstance = null;

export const initFirebase = (customConfig = null) => {
  const config = customConfig || getSavedFirebaseConfig();
  if (!config || !config.apiKey) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    authInstance = getAuth(app);
    return authInstance;
  } catch (err) {
    console.error("Firebase init failed:", err);
    return null;
  }
};

export const getFirebaseAuth = () => {
  if (!authInstance) {
    return initFirebase();
  }
  return authInstance;
};

export const setupRecaptcha = (containerId = "recaptcha-container") => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Authentication is not initialized.");

  // Clear previous recaptcha verifier if exists on window
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {}
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA expired. Please request OTP again.");
    },
  });

  return window.recaptchaVerifier;
};

export const dispatchFirebaseOtp = async (clean10DigitPhone, containerId = "recaptcha-container") => {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not initialized.");

  const verifier = setupRecaptcha(containerId);
  const formattedPhone = `+91${clean10DigitPhone}`;
  
  const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
  return confirmationResult;
};
