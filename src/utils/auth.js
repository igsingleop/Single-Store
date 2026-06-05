import { auth, isFirebaseConfigured, firestoreDb } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const CUSTOMER_SESSION_KEY = 'SINGLESTORE_CUSTOMER_SESSION';
const CUSTOMER_USERS_KEY = 'SINGLESTORE_CUSTOMER_USERS';

// Helper to get fallback users
function getFallbackUsers() {
  try {
    const data = localStorage.getItem(CUSTOMER_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Helper to save fallback users
function saveFallbackUsers(users) {
  localStorage.setItem(CUSTOMER_USERS_KEY, JSON.stringify(users));
}

// Global state for mock/fallback auth
let mockUser = null;
try {
  const saved = localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (saved) {
    mockUser = JSON.parse(saved);
  }
} catch (e) {
  console.warn("Error reading customer session", e);
}

const authListeners = new Set();

function notifyListeners(user) {
  authListeners.forEach(cb => cb(user));
}

// Setup Firebase observer or custom observer
export function subscribeAuth(callback) {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await getUserProfileDetails(user.uid, user.email);
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: (profile && profile.photoURL) || user.photoURL
          });
        } catch (e) {
          console.warn("Error merging profile image on subscribe:", e);
          callback(user);
        }
      } else {
        callback(null);
      }
    });
  } else {
    authListeners.add(callback);
    // Call immediately with initial value
    callback(mockUser);
    return () => {
      authListeners.delete(callback);
    };
  }
}

export async function loginWithEmail(email, password) {
  const emailLower = email.toLowerCase().trim();
  if (isFirebaseConfigured && auth) {
    const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
    return userCredential.user;
  } else {
    const users = getFallbackUsers();
    const matched = users.find(u => u.email === emailLower);
    if (!matched) {
      throw new Error("No account found with this email.");
    }
    if (matched.password !== password) {
      throw new Error("Incorrect password.");
    }
    const sessionUser = {
      uid: matched.uid,
      email: matched.email,
      displayName: matched.displayName,
      photoURL: null
    };
    mockUser = sessionUser;
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(mockUser));
    notifyListeners(mockUser);
    return mockUser;
  }
}

export async function registerWithEmail(name, email, password) {
  const emailLower = email.toLowerCase().trim();
  if (isFirebaseConfigured && auth) {
    const userCredential = await createUserWithEmailAndPassword(auth, emailLower, password);
    await updateProfile(userCredential.user, {
      displayName: name
    });
    // Force refresh the user
    return auth.currentUser;
  } else {
    const users = getFallbackUsers();
    if (users.some(u => u.email === emailLower)) {
      throw new Error("An account with this email already exists.");
    }
    const newUid = 'mock_uid_' + Math.random().toString(36).substring(2, 9);
    const newUser = {
      uid: newUid,
      email: emailLower,
      password: password,
      displayName: name
    };
    users.push(newUser);
    saveFallbackUsers(users);

    const sessionUser = {
      uid: newUid,
      email: emailLower,
      displayName: name,
      photoURL: null
    };
    mockUser = sessionUser;
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(mockUser));
    notifyListeners(mockUser);
    return mockUser;
  }
}

export async function loginWithGoogle() {
  if (isFirebaseConfigured && auth) {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential.user;
    } catch (error) {
      if (error.code === 'auth/unauthorized-domain') {
        throw new Error(`This domain (${window.location.hostname}) is not authorized in Firebase. Please add it to your Firebase Console under Authentication > Settings > Authorized domains.`);
      }
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        console.warn("Google Auth popup was blocked or cancelled. Falling back to signInWithRedirect...");
        await signInWithRedirect(auth, provider);
        // Return a promise that doesn't resolve to keep UI in loading state during redirect
        return new Promise(() => {});
      }
      throw error;
    }
  } else {
    // Simulate Google sign-in
    const mockGoogleUser = {
      uid: 'google_mock_' + Math.random().toString(36).substring(2, 9),
      email: 'alex.jones@gmail.com',
      displayName: 'Alex Jones',
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
    };
    mockUser = mockGoogleUser;
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(mockUser));
    notifyListeners(mockUser);
    return mockUser;
  }
}

export async function logout() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  } else {
    mockUser = null;
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    notifyListeners(null);
  }
}

export async function getUserProfileDetails(uid, defaultEmail) {
  if (isFirebaseConfigured && auth && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
    } catch (e) {
      console.warn("Firestore fetch user profile details failed (permissions or configuration issues), falling back to LocalStorage:", e);
    }
  }

  // LocalStorage fallback
  try {
    const key = `SINGLESTORE_PROFILE_${uid}`;
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch {
    // Return empty defaults if localStorage fetch fails
  }

  return {
    phone: '',
    dob: '',
    address: '',
    city: '',
    pinCode: '',
    country: 'India',
    contactEmail: defaultEmail || '',
    photoURL: ''
  };
}

function dataURLtoBlob(dataurl) {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Failed to parse base64 data url to blob:", e);
    return null;
  }
}

export async function updateUserProfileDetails(uid, profileData) {
  let finalPhotoURL = profileData.photoURL || '';

  // 2. Update Core Auth Profile (with placeholder/null photoURL to avoid Firebase Auth limit)
  if (isFirebaseConfigured && auth && auth.currentUser) {
    try {
      // Base64 strings are too long for Firebase Auth profile photoURL (max 2048 chars).
      // We pass null here and store the full Base64 string in Firestore/LocalStorage.
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: null
      });
    } catch (err) {
      console.warn("Core Auth profile update failed:", err);
    }
  }

  const extendedData = {
    phone: profileData.phone || '',
    dob: profileData.dob || '',
    address: profileData.address || '',
    city: profileData.city || '',
    pinCode: profileData.pinCode || '',
    country: profileData.country || 'India',
    contactEmail: profileData.contactEmail || '',
    photoURL: finalPhotoURL // Stores either short CDN URL or Base64 fallback
  };

  // 3. Update Firestore document (with permission error fallback)
  if (isFirebaseConfigured && auth && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'users', uid);
      await setDoc(docRef, extendedData, { merge: true });
    } catch (e) {
      console.warn("Firestore save user profile details failed (permissions or configuration issues), falling back to LocalStorage:", e);
    }
  }

  // Save to LocalStorage as fallback/backup
  const key = `SINGLESTORE_PROFILE_${uid}`;
  localStorage.setItem(key, JSON.stringify(extendedData));

  if (isFirebaseConfigured && auth && auth.currentUser) {
    // Clone user object to trigger reactive state updates in subscriber hooks
    const updated = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      photoURL: finalPhotoURL || auth.currentUser.photoURL
    };
    notifyListeners(updated);
    return { user: updated, details: extendedData };
  } else if (mockUser) {
    // 4. Fallback mock update
    const users = getFallbackUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index > -1) {
      users[index].displayName = profileData.displayName;
      users[index].photoURL = finalPhotoURL;
      saveFallbackUsers(users);
    }

    mockUser = {
      ...mockUser,
      displayName: profileData.displayName,
      photoURL: finalPhotoURL
    };
    localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(mockUser));
    notifyListeners(mockUser);
    return { user: mockUser, details: extendedData };
  }
  throw new Error("No active user session.");
}
