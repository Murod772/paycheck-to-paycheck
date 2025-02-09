const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function cleanupDuplicateWallets() {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    console.error('Must be authenticated to cleanup wallets');
    return;
  }

  const walletsRef = collection(db, 'users', userId, 'wallets');
  const q = query(walletsRef, where('userId', '==', userId));
  
  const querySnapshot = await getDocs(q);
  const wallets = querySnapshot.docs;
  
  console.log(`Found ${wallets.length} wallets for user`);
  
  // Keep the first wallet and delete the rest
  for (let i = 1; i < wallets.length; i++) {
    console.log(`Deleting duplicate wallet ${wallets[i].id}`);
    await deleteDoc(wallets[i].ref);
  }
  
  console.log('Cleanup complete');
}

cleanupDuplicateWallets().catch(console.error);
