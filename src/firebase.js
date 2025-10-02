// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Reemplaza estos valores con los de tu proyecto Firebase
const firebaseConfig = {
      apiKey: "AIzaSyBwzuNZsIRzNr11V-nQDaLj9sJI2Y0nuew",
      authDomain: "androidbar.firebaseapp.com",
      projectId: "androidbar",
      storageBucket: "androidbar.firebasestorage.app",
      messagingSenderId: "580141798965",
      appId: "1:580141798965:web:e408ec3616cfc3a8dc037c",
      measurementId: "G-E846SE1JD8"
   };


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
