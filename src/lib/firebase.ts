import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration is now directly in the code.
// This ensures a reliable connection without needing a separate .env file.
export const firebaseConfig = {
  apiKey: "AIzaSyDkcJVdGbA211ODtqeEtZLiE6nwzj1SfqU",
  authDomain: "plotpilot-gi902.firebaseapp.com",
  projectId: "plotpilot-gi902",
  storageBucket: "plotpilot-gi902.firebasestorage.app",
  messagingSenderId: "668482620016",
  appId: "1:668482620016:web:2110c3605663151d0342b5"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This check prevents re-initializing the app on hot reloads
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
