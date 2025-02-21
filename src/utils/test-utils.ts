import { FirebaseApp } from 'firebase/app';
import { Auth, User } from 'firebase/auth';
import {
  Firestore,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Query,
} from 'firebase/firestore';

export const mockUser: User = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: Date.now().toString(),
    lastSignInTime: Date.now().toString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'password',
};

export const mockAuth: Auth = {
  app: {} as FirebaseApp,
  name: 'mock-auth',
  config: {},
  currentUser: mockUser,
  languageCode: null,
  tenantId: null,
  settings: {
    appVerificationDisabledForTesting: false,
  },
  onAuthStateChanged: jest.fn(),
  onIdTokenChanged: jest.fn(),
  beforeAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  useDeviceLanguage: jest.fn(),
  updateCurrentUser: jest.fn(),
};

export const mockQuerySnapshot = (
  docs: DocumentData[] = []
): QuerySnapshot<DocumentData> => ({
  docs: docs.map((data) => ({
    id: 'mock-doc-id',
    data: () => data,
    exists: () => true,
    get: jest.fn(),
    ref: {} as any,
  })),
  empty: docs.length === 0,
  size: docs.length,
  forEach: jest.fn(),
  docChanges: jest.fn(),
  metadata: {
    fromCache: false,
    hasPendingWrites: false,
    isEqual: jest.fn(),
  },
});

export const mockDocumentSnapshot = (
  data: DocumentData | null = null
): DocumentSnapshot<DocumentData> => ({
  id: 'mock-doc-id',
  data: () => data,
  exists: () => !!data,
  get: jest.fn(),
  ref: {} as any,
  metadata: {
    fromCache: false,
    hasPendingWrites: false,
    isEqual: jest.fn(),
  },
});

export const mockFirestore: Firestore = {
  app: {} as FirebaseApp,
  name: 'mock-firestore',
  type: 'firestore',
  toJSON: jest.fn(),
};

export const mockQuery: Query<DocumentData> = {
  firestore: mockFirestore,
  type: 'query',
  withConverter: jest.fn(),
  endAt: jest.fn(),
  endBefore: jest.fn(),
  isEqual: jest.fn(),
  limit: jest.fn(),
  limitToLast: jest.fn(),
  orderBy: jest.fn(),
  startAfter: jest.fn(),
  startAt: jest.fn(),
  where: jest.fn(),
};

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const mockRequest = (body = {}, headers = {}, query = {}) => ({
  body,
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  query,
});

export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  multi: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

export const mockSendGrid = {
  send: jest.fn(),
  setApiKey: jest.fn(),
};

export const mockNOWPayments = {
  createPayment: jest.fn(),
  getPaymentStatus: jest.fn(),
};

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAnalytics = {
  getCampaignMetrics: jest.fn(),
  getUserCampaignStats: jest.fn(),
  getNichePerformance: jest.fn(),
  getTimeSeriesData: jest.fn(),
  getROIMetrics: jest.fn(),
}; 