import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
const rawConfig = firebaseConfig as unknown as { firestoreDatabaseId?: string };
export const dbFirestore = rawConfig.firestoreDatabaseId
  ? getFirestore(app, rawConfig.firestoreDatabaseId)
  : getFirestore(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Error handler conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  rethrow = false
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (rethrow) {
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

// Verify Firestore connectivity on startup
let connectionTested = false;
export async function testConnection() {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(dbFirestore, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration: client is offline.');
    }
    // Ignore permission errors when unauthenticated on restricted test doc
  }
}

void testConnection();

// Add Workspace scopes to Google Auth Provider including Google Picker, Sheets write, and Gmail send scopes
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleAuthProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleAuthProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');

const OAUTH_TOKEN_STORAGE_KEY = 'titan_workspace_oauth_token';
let cachedAccessToken: string | null = (() => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(OAUTH_TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
})();

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(OAUTH_TOKEN_STORAGE_KEY);
      if (stored) {
        cachedAccessToken = stored;
        return stored;
      }
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
  return null;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem(OAUTH_TOKEN_STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(OAUTH_TOKEN_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
};

export const signInWithGoogleWorkspace = async () => {
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Workspace sign in error:', error);
    throw error;
  }
};

export const logoutWorkspace = async () => {
  await auth.signOut();
  setCachedAccessToken(null);
};

export interface RealDriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  url: string;
  modifiedTime?: string;
}

export async function fetchDriveFiles(accessToken: string): Promise<RealDriveFile[]> {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=12&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,size,webViewLink,modifiedTime)&q=trashed%3Dfalse',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    throw new Error(`Google Drive API HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    files?: Array<{
      id: string;
      name: string;
      mimeType: string;
      size?: string;
      webViewLink?: string;
      modifiedTime?: string;
    }>;
  };
  return (data.files || []).map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    sizeBytes: f.size ? Number(f.size) : undefined,
    url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    modifiedTime: f.modifiedTime,
  }));
}

export default app;
