import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { initFirebase } from '../../core/config/firebase';
import { COLLECTIONS } from '../../core/constants/firestore-constants';
import { UserModel, userModelFromFirestore, userModelToFirestore, createDefaultUser } from '../models/user-model';
import { JobModel, jobFromFirestore, jobToFirestore } from '../models/job-model';
import { SubscriptionTier } from '../../core/enums/subscription-tier';
import { getSubscriptionConfig } from '../../core/enums/subscription-tier';
import { JobStatus } from '../models/job-model';

function getDb() {
  return getFirestore(initFirebase());
}

export const FirestoreService = {
  async createUser(uid: string, email?: string | null, displayName?: string | null, isAnonymous: boolean = false): Promise<UserModel> {
    const user = createDefaultUser(uid, email, displayName, isAnonymous);
    const db = getDb();
    await setDoc(doc(db, COLLECTIONS.USERS, uid), userModelToFirestore(user));
    return user;
  },

  async getUser(uid: string): Promise<UserModel | null> {
    const db = getDb();
    const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    if (docSnap.exists()) {
      return userModelFromFirestore(docSnap.data(), uid);
    }
    return null;
  },

  async updateUser(uid: string, data: Partial<UserModel>): Promise<void> {
    const db = getDb();
    const updateData: any = { ...data, updatedAt: new Date() };
    if (updateData.createdAt) delete updateData.createdAt;
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), updateData);
  },

  async ensureUserExists(uid: string, email?: string | null, displayName?: string | null, isAnonymous: boolean = false): Promise<UserModel> {
    const existing = await this.getUser(uid);
    if (existing) return existing;
    return this.createUser(uid, email, displayName, isAnonymous);
  },

  async useCredits(uid: string, amount: number): Promise<boolean> {
    const user = await this.getUser(uid);
    if (!user || user.creditsRemaining < amount) return false;

    const db = getDb();
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      creditsRemaining: user.creditsRemaining - amount,
      creditsUsed: user.creditsUsed + amount,
      updatedAt: new Date(),
    });
    return true;
  },

  async createJob(job: JobModel): Promise<void> {
    const db = getDb();
    await setDoc(doc(db, COLLECTIONS.JOBS, job.id), jobToFirestore(job));
  },

  async updateJob(jobId: string, data: Partial<JobModel>): Promise<void> {
    const db = getDb();
    const updateData: any = { ...data, updatedAt: new Date() };
    if (updateData.createdAt) delete updateData.createdAt;
    await updateDoc(doc(db, COLLECTIONS.JOBS, jobId), updateData);
  },

  async getJob(jobId: string): Promise<JobModel | null> {
    const db = getDb();
    const docSnap = await getDoc(doc(db, COLLECTIONS.JOBS, jobId));
    if (docSnap.exists()) {
      return jobFromFirestore(docSnap.data(), jobId);
    }
    return null;
  },

  async getUserJobs(uid: string, maxResults: number = 50): Promise<JobModel[]> {
    const db = getDb();
    const q = query(
      collection(db, COLLECTIONS.JOBS),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => jobFromFirestore(doc.data(), doc.id));
  },

  async deleteJob(jobId: string): Promise<void> {
    const db = getDb();
    await deleteDoc(doc(db, COLLECTIONS.JOBS, jobId));
  },

  async saveExtractedData(jobId: string, userId: string, data: any, fileName: string, fileIndex: number, tokensUsed: number, rawResponse: string): Promise<void> {
    const db = getDb();
    const id = `${jobId}_${fileIndex}`;
    await setDoc(doc(db, COLLECTIONS.EXTRACTED_DATA, id), {
      jobId,
      userId,
      fileName,
      fileIndex,
      data,
      rawResponse,
      tokensUsed,
      createdAt: new Date(),
    });
  },

  async getExtractedData(jobId: string): Promise<any[]> {
    const db = getDb();
    const q = query(
      collection(db, COLLECTIONS.EXTRACTED_DATA),
      where('jobId', '==', jobId),
      orderBy('fileIndex', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async deleteExtractedData(jobId: string): Promise<void> {
    const db = getDb();
    const q = query(collection(db, COLLECTIONS.EXTRACTED_DATA), where('jobId', '==', jobId));
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(docSnap.ref);
    }
  },

  async resetMonthlyCredits(uid: string): Promise<void> {
    const user = await this.getUser(uid);
    if (!user) return;

    const config = getSubscriptionConfig(user.subscriptionTier);
    const db = getDb();
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      creditsRemaining: config.monthlyCredits,
      creditsUsed: 0,
      updatedAt: new Date(),
    });
  },
};
