import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
const rawConfig = firebaseConfig as unknown as { firestoreDatabaseId?: string };

function createFirestoreClient(): Firestore {
  try {
    return rawConfig.firestoreDatabaseId
      ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, rawConfig.firestoreDatabaseId)
      : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    return rawConfig.firestoreDatabaseId
      ? getFirestore(app, rawConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const dbFirestore: Firestore = createFirestoreClient();
export const googleAuthProvider = new GoogleAuthProvider();

// Workspace OAuth Scopes (Calendar, Docs, Slides, Forms, Meet, Contacts/People, Drive, Sheets, Gmail, Classroom)
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
] as const;

for (const scope of WORKSPACE_SCOPES) {
  googleAuthProvider.addScope(scope);
}

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
  }
}

void testConnection();

// Strict in-memory OAuth access token cache (never persisted to web storage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;

onAuthStateChanged(auth, (user: User | null) => {
  if (!user && !isSigningIn) {
    cachedAccessToken = null;
  }
});

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signInWithGoogleWorkspace = async () => {
  isSigningIn = true;
  try {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Workspace sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logoutWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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
