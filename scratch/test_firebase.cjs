const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function run() {
  try {
    console.log('Uploading test file to Firebase Storage...');
    const storageRef = ref(storage, `test_posters/test_${Date.now()}.txt`);
    const fileBuffer = Buffer.from('hello world from firebase storage test');
    
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: 'text/plain'
    });
    console.log('Uploaded successfully! Path:', snapshot.metadata.fullPath);

    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL:', downloadURL);

    console.log('Fetching download URL to verify public accessibility...');
    const res = await fetch(downloadURL);
    console.log('Fetch status:', res.status);
    console.log('Fetch content:', await res.text());

  } catch (err) {
    console.error('Firebase Storage Error:', err);
  }
}

run();
