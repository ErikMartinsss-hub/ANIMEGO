import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAn8F2LnAkxKzpA59X0Y9eixjixwwvfBDw",
  authDomain: "cinebr-d5c09.firebaseapp.com",
  projectId: "cinebr-d5c09",
  storageBucket: "cinebr-d5c09.firebasestorage.app",
  messagingSenderId: "53691818219",
  appId: "1:53691818219:web:43faf0795115a0502c1eae",
  measurementId: "G-67EWDH64R2"
};

const app = initializeApp(firebaseConfig);

// Inicializamos o Auth com persistência para React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);