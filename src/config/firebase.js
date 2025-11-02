import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getDatabase } from "firebase/database"

// Firebase configuration for SmartSwitch
const firebaseConfig = {
  apiKey: "AIzaSyBajwnFuLDUY1ioE7Q7U7jiwtnrFMJ1_Zs",
  authDomain: "smart-switch-67033.firebaseapp.com",
  databaseURL: "https://smart-switch-67033-default-rtdb.firebaseio.com",
  projectId: "smart-switch-67033",
  storageBucket: "smart-switch-67033.firebasestorage.app",
  messagingSenderId: "168524619999",
  appId: "1:168524619999:android:5cc68428bbca50132cc96a"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Initialize Realtime Database (for ESP32 device control)
export const realtimeDb = getDatabase(app)

export default app
