import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { FieldPath, getFirestore, type Firestore } from "firebase-admin/firestore";

import {
  ACCOUNT_RECORD_TYPES,
  MAX_CANONICAL_ACCOUNT_RECORD_BYTES,
  compareAccountRecordIdentity,
  compareAccountRecordUtf8Bytes,
  isWellFormedUnicodeScalarString,
  type AccountRecordType,
} from "./accountData.js";
import {
  ACCOUNT_RECORD_PAGE_SIZE,
  adoptionSequenceId,
  computeAccountRecordKeyHash,
  decodePersistedAccountRecordDocument,
  validateAdoptionConflictDocument,
  validateAdoptionLocalRecordDocument,
  validateAdoptionOperation,
  validateAccountDatasetHead,
  type AccountRecordDescriptor,
  type AccountRecordPhysicalDescriptor,
  type AccountRecordSemanticCursor,
  type AdoptionConflictDocument,
  type AdoptionLocalRecordDocument,
  type AdoptionOperation,
  type AccountDatasetHead,
  type AccountDatasetStore,
  type AccountDatasetTransaction,
  type AccountRecordPageDocument,
  type PersistedAccountRecordDocument,
} from "./accountService.js";
import type { FirebaseIdTokenVerifier, VerifiedFirebaseIdToken } from "./authentication.js";

const HASH_PATTERN = /^[a-f0-9]{64}$/u;

const validatePageLimit = (limit: number): void => {
  if (!Number.isInteger(limit) || limit < 1 || limit > ACCOUNT_RECORD_PAGE_SIZE) {
    throw new Error("invalid_account_record_page_limit");
  }
};

const validateHash = (value: string): void => {
  if (!HASH_PATTERN.test(value)) throw new Error("invalid_account_record_cursor");
};

const validateSequenceId = (value: string): void => {
  try {
    if (adoptionSequenceId(Number(value)) !== value) throw new Error("invalid_adoption_sequence_id");
  } catch {
    throw new Error("invalid_adoption_sequence_id");
  }
};

const validateSemanticIdentity = (type: unknown, id: unknown): type is AccountRecordType =>
  typeof type === "string"
  && (ACCOUNT_RECORD_TYPES as readonly string[]).includes(type)
  && typeof id === "string"
  && id.length > 0
  && id.length <= 256
  && isWellFormedUnicodeScalarString(id);

const validateSemanticCursor = (cursor: AccountRecordSemanticCursor): void => {
  if (!validateSemanticIdentity(cursor.type, cursor.id)) throw new Error("invalid_account_record_cursor");
  validateHash(cursor.documentId);
  if (cursor.documentId !== computeAccountRecordKeyHash(cursor.type, cursor.id)) {
    throw new Error("invalid_account_record_cursor");
  }
};

const decodeRecordDescriptor = (value: unknown, documentId: string): AccountRecordDescriptor => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("corrupt_account_record_descriptor");
  }
  const candidate = value as Record<string, unknown>;
  const expectedKeys = candidate.revision === undefined
    ? ["canonicalByteLength", "fingerprint", "id", "type"]
    : ["canonicalByteLength", "fingerprint", "id", "revision", "type"];
  if (Object.keys(candidate).sort().join(":") !== expectedKeys.join(":")) {
    throw new Error("corrupt_account_record_descriptor");
  }
  if (
    !Number.isInteger(candidate.canonicalByteLength)
    || (candidate.canonicalByteLength as number) < 1
    || (candidate.canonicalByteLength as number) > MAX_CANONICAL_ACCOUNT_RECORD_BYTES
    || typeof candidate.fingerprint !== "string"
    || !HASH_PATTERN.test(candidate.fingerprint)
    || !validateSemanticIdentity(candidate.type, candidate.id)
    || (candidate.revision !== undefined
      && (!Number.isInteger(candidate.revision) || (candidate.revision as number) < 1))
    || !HASH_PATTERN.test(documentId)
    || documentId !== computeAccountRecordKeyHash(candidate.type, candidate.id as string)
  ) throw new Error("corrupt_account_record_descriptor");
  return {
    canonicalByteLength: candidate.canonicalByteLength as number,
    documentId,
    fingerprint: candidate.fingerprint,
    id: candidate.id as string,
    ...(candidate.revision === undefined ? {} : { revision: candidate.revision as number }),
    type: candidate.type,
  };
};

const decodePhysicalDescriptor = (value: unknown, documentId: string): AccountRecordPhysicalDescriptor => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("corrupt_account_record_physical_descriptor");
  const candidate = value as Record<string, unknown>;
  if (Object.keys(candidate).join(":") !== "canonicalByteLength"
    || !Number.isInteger(candidate.canonicalByteLength)
    || (candidate.canonicalByteLength as number) < 1
    || (candidate.canonicalByteLength as number) > MAX_CANONICAL_ACCOUNT_RECORD_BYTES
    || !HASH_PATTERN.test(documentId)) throw new Error("corrupt_account_record_physical_descriptor");
  return { canonicalByteLength: candidate.canonicalByteLength as number, documentId };
};

export class FirebaseAdminIdTokenVerifier implements FirebaseIdTokenVerifier {
  constructor(private readonly auth: Auth) {}

  async verifyIdToken(token: string, checkRevoked: boolean): Promise<VerifiedFirebaseIdToken> {
    const decoded = await this.auth.verifyIdToken(token, checkRevoked);
    return {
      aud: decoded.aud,
      auth_time: decoded.auth_time,
      email_verified: decoded.email_verified === true,
      exp: decoded.exp,
      iss: decoded.iss,
      sub: decoded.sub,
      uid: decoded.uid,
    };
  }
}

export class FirestoreAccountDatasetStore implements AccountDatasetStore {
  constructor(private readonly firestore: Firestore) {}

  private account(uid: string) {
    return this.firestore.collection("accounts").doc(uid);
  }

  private adoptionOperation(uid: string) {
    return this.account(uid).collection("adoptionOperations").doc("current");
  }

  async readAdoptionOperation(uid: string): Promise<AdoptionOperation | undefined> {
    const snapshot = await this.adoptionOperation(uid).get();
    if (!snapshot.exists) return undefined;
    const value = snapshot.data();
    validateAdoptionOperation(value);
    return value;
  }

  async readAdoptionLocalRecordPage(
    uid: string,
    afterSequenceId: string | null,
    limit: number,
  ): Promise<readonly AdoptionLocalRecordDocument[]> {
    validatePageLimit(limit);
    if (afterSequenceId !== null) validateSequenceId(afterSequenceId);
    let query = this.adoptionOperation(uid).collection("localRecords")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (afterSequenceId !== null) query = query.startAfter(afterSequenceId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_adoption_local_record_page");
    let previous = afterSequenceId;
    return snapshot.docs.map((document) => {
      validateSequenceId(document.id);
      if (previous !== null && document.id <= previous) throw new Error("corrupt_adoption_local_record_page");
      const value = validateAdoptionLocalRecordDocument(document.data());
      if (value.sequenceId !== document.id) throw new Error("corrupt_adoption_local_record_page");
      previous = document.id;
      return value;
    });
  }

  async readAdoptionConflictPage(
    uid: string,
    afterSequenceId: string | null,
    limit: number,
  ): Promise<readonly AdoptionConflictDocument[]> {
    validatePageLimit(limit);
    if (afterSequenceId !== null) validateSequenceId(afterSequenceId);
    let query = this.adoptionOperation(uid).collection("conflicts")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (afterSequenceId !== null) query = query.startAfter(afterSequenceId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_adoption_conflict_page");
    let previous = afterSequenceId;
    return snapshot.docs.map((document) => {
      validateSequenceId(document.id);
      if (previous !== null && document.id <= previous) throw new Error("corrupt_adoption_conflict_page");
      const value = validateAdoptionConflictDocument(document.data());
      if (value.sequenceId !== document.id) throw new Error("corrupt_adoption_conflict_page");
      previous = document.id;
      return value;
    });
  }

  async readHead(uid: string): Promise<AccountDatasetHead | undefined> {
    const snapshot = await this.account(uid).get();
    if (!snapshot.exists) return undefined;
    const value = snapshot.data();
    validateAccountDatasetHead(value);
    return value;
  }

  async readRecordPage(
    uid: string,
    generationId: string,
    afterDocumentId: string | undefined,
    limit: number,
  ): Promise<readonly AccountRecordPageDocument[]> {
    validatePageLimit(limit);
    validateHash(generationId);
    if (afterDocumentId !== undefined) validateHash(afterDocumentId);
    let query = this.account(uid)
      .collection("generations").doc(generationId)
      .collection("records")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (afterDocumentId !== undefined) query = query.startAfter(afterDocumentId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_account_record_page");
    let previous = afterDocumentId;
    return snapshot.docs.map((document) => {
      validateHash(document.id);
      if (previous !== undefined && document.id <= previous) throw new Error("corrupt_account_record_page");
      const value = document.data();
      decodePersistedAccountRecordDocument(value, document.id);
      previous = document.id;
      return { documentId: document.id, value: value as PersistedAccountRecordDocument };
    });
  }

  async readRecordDescriptorPage(
    uid: string,
    generationId: string,
    after: AccountRecordSemanticCursor | null,
    limit: number,
  ): Promise<readonly AccountRecordDescriptor[]> {
    validatePageLimit(limit);
    validateHash(generationId);
    if (after !== null) validateSemanticCursor(after);
    let query = this.account(uid)
      .collection("generations").doc(generationId)
      .collection("records")
      .select("canonicalByteLength", "fingerprint", "id", "revision", "type")
      .orderBy("type", "asc")
      .orderBy("id", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (after !== null) query = query.startAfter(after.type, after.id, after.documentId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_account_record_descriptor_page");
    const descriptors = snapshot.docs.map((document) => decodeRecordDescriptor(document.data(), document.id));
    let previous: AccountRecordSemanticCursor | null = after;
    for (const descriptor of descriptors) {
      if (previous !== null && (
        compareAccountRecordIdentity(descriptor, previous)
        || compareAccountRecordUtf8Bytes(descriptor.documentId, previous.documentId)
      ) <= 0) throw new Error("corrupt_account_record_descriptor_page");
      previous = descriptor;
    }
    return descriptors;
  }

  async readRecordPhysicalDescriptorPage(
    uid: string,
    generationId: string,
    afterDocumentId: string | null,
    limit: number,
  ): Promise<readonly AccountRecordPhysicalDescriptor[]> {
    validatePageLimit(limit);
    validateHash(generationId);
    if (afterDocumentId !== null) validateHash(afterDocumentId);
    let query = this.account(uid)
      .collection("generations").doc(generationId)
      .collection("records")
      .select("canonicalByteLength")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (afterDocumentId !== null) query = query.startAfter(afterDocumentId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_account_record_physical_descriptor_page");
    let previous = afterDocumentId;
    return snapshot.docs.map((document) => {
      if (previous !== null && document.id <= previous) throw new Error("corrupt_account_record_physical_descriptor_page");
      const descriptor = decodePhysicalDescriptor(document.data(), document.id);
      previous = document.id;
      return descriptor;
    });
  }

  async readOwnedDocumentIdPage(
    uid: string,
    owner: "localRecords" | "conflicts" | Readonly<{ generationId: string }>,
    afterDocumentId: string | null,
    limit: number,
  ): Promise<readonly string[]> {
    validatePageLimit(limit);
    const sequenceOwned = typeof owner === "string";
    if (sequenceOwned) {
      if (afterDocumentId !== null) validateSequenceId(afterDocumentId);
    } else {
      validateHash(owner.generationId);
      if (afterDocumentId !== null) validateHash(afterDocumentId);
    }
    const collection = sequenceOwned
      ? this.adoptionOperation(uid).collection(owner)
      : this.account(uid).collection("generations").doc(owner.generationId).collection("records");
    let query = collection.select().orderBy(FieldPath.documentId(), "asc").limit(limit);
    if (afterDocumentId !== null) query = query.startAfter(afterDocumentId);
    const snapshot = await query.get();
    if (snapshot.docs.length > limit) throw new Error("corrupt_owned_document_id_page");
    let previous = afterDocumentId;
    return snapshot.docs.map((document) => {
      if (sequenceOwned) validateSequenceId(document.id);
      else validateHash(document.id);
      if (previous !== null && document.id <= previous) throw new Error("corrupt_owned_document_id_page");
      previous = document.id;
      return document.id;
    });
  }

  async runTransaction<T>(uid: string, operation: (transaction: AccountDatasetTransaction) => Promise<T>): Promise<T> {
    const account = this.account(uid);
    const adoptionOperation = this.adoptionOperation(uid);
    const adoptionLocalRecordReference = (sequenceId: string) => {
      validateSequenceId(sequenceId);
      return adoptionOperation.collection("localRecords").doc(sequenceId);
    };
    const adoptionConflictReference = (sequenceId: string) => {
      validateSequenceId(sequenceId);
      return adoptionOperation.collection("conflicts").doc(sequenceId);
    };
    const recordReference = (generationId: string, documentId: string) => account
      .collection("generations").doc(generationId)
      .collection("records").doc(documentId);
    return this.firestore.runTransaction(async (firestoreTransaction) => {
      return operation({
        deleteAdoptionConflict: (sequenceId) => {
          firestoreTransaction.delete(adoptionConflictReference(sequenceId));
        },
        deleteAdoptionLocalRecord: (sequenceId) => {
          firestoreTransaction.delete(adoptionLocalRecordReference(sequenceId));
        },
        deleteRecord: (generationId, documentId) => {
          validateHash(generationId);
          validateHash(documentId);
          firestoreTransaction.delete(recordReference(generationId, documentId));
        },
        putAdoptionConflict: (value) => {
          const validated = validateAdoptionConflictDocument(value);
          firestoreTransaction.set(adoptionConflictReference(validated.sequenceId), validated);
        },
        putAdoptionLocalRecord: (value) => {
          const validated = validateAdoptionLocalRecordDocument(value);
          firestoreTransaction.set(adoptionLocalRecordReference(validated.sequenceId), {
            ...validated,
            record: {
              ...validated.record,
              canonicalBytes: Buffer.from(validated.record.canonicalBytes),
            },
          });
        },
        putRecord: (generationId, documentId, value) => {
          validateHash(generationId);
          validateHash(documentId);
          decodePersistedAccountRecordDocument(value, documentId);
          firestoreTransaction.set(recordReference(generationId, documentId), {
            ...value,
            canonicalBytes: Buffer.from(value.canonicalBytes),
          });
        },
        readAdoptionConflict: async (sequenceId) => {
          const snapshot = await firestoreTransaction.get(adoptionConflictReference(sequenceId));
          if (!snapshot.exists) return undefined;
          const value = validateAdoptionConflictDocument(snapshot.data());
          if (value.sequenceId !== sequenceId) throw new Error("corrupt_adoption_conflict");
          return value;
        },
        readAdoptionLocalRecord: async (sequenceId) => {
          const snapshot = await firestoreTransaction.get(adoptionLocalRecordReference(sequenceId));
          if (!snapshot.exists) return undefined;
          const value = validateAdoptionLocalRecordDocument(snapshot.data());
          if (value.sequenceId !== sequenceId) throw new Error("corrupt_adoption_local_record");
          return value;
        },
        readAdoptionOperation: async () => {
          const snapshot = await firestoreTransaction.get(adoptionOperation);
          if (!snapshot.exists) return undefined;
          const value = snapshot.data();
          validateAdoptionOperation(value);
          return value;
        },
        readHead: async () => {
          const snapshot = await firestoreTransaction.get(account);
          if (!snapshot.exists) return undefined;
          const value = snapshot.data();
          validateAccountDatasetHead(value);
          return value;
        },
        readRecord: async (generationId, documentId): Promise<PersistedAccountRecordDocument | undefined> => {
          validateHash(generationId);
          validateHash(documentId);
          const snapshot = await firestoreTransaction.get(recordReference(generationId, documentId));
          if (!snapshot.exists) return undefined;
          const value = snapshot.data();
          decodePersistedAccountRecordDocument(value, documentId);
          return value as PersistedAccountRecordDocument;
        },
        readRecordExists: async (generationId, documentId): Promise<boolean> => {
          validateHash(generationId);
          validateHash(documentId);
          return (await firestoreTransaction.get(recordReference(generationId, documentId))).exists;
        },
        writeAdoptionOperation: (value) => {
          validateAdoptionOperation(value);
          firestoreTransaction.set(adoptionOperation, value);
        },
        writeHead: (value) => {
          validateAccountDatasetHead(value);
          firestoreTransaction.set(account, value);
        },
      });
    });
  }
}

export type DeletionProof = Readonly<{
  completedAt: string;
  irreversibleAccountIdHash: string;
  requestId: string;
  requestedAt: string;
  resultCode: "account_deleted";
}>;

export class FirebaseAccountDeletionAdapter {
  constructor(
    private readonly firestore: Firestore,
    private readonly auth: Auth,
  ) {}

  async revokeSessions(uid: string): Promise<void> {
    try {
      await this.auth.revokeRefreshTokens(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    }
  }

  async deleteRemoteData(uid: string): Promise<void> {
    const account = this.firestore.collection("accounts").doc(uid);
    await this.firestore.recursiveDelete(account);
    const [accountSnapshot, subcollections] = await Promise.all([account.get(), account.listCollections()]);
    if (accountSnapshot.exists || subcollections.length > 0) throw new Error("remote_account_deletion_not_verified");
  }

  async deleteIdentity(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
    }
  }

  async readDeletionProof(requestId: string): Promise<DeletionProof | undefined> {
    const snapshot = await this.firestore.collection("accountDeletionProofs").doc(requestId).get();
    if (!snapshot.exists) return undefined;
    const proof = snapshot.data();
    if (!isDeletionProof(proof)) throw new Error("deletion_proof_collision");
    return proof;
  }

  async recordDeletionProof(proof: DeletionProof): Promise<void> {
    const reference = this.firestore.collection("accountDeletionProofs").doc(proof.requestId);
    await this.firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) {
        const existingProof = existing.data();
        if (!isDeletionProof(existingProof) || !sameDeletionProof(existingProof, proof)) throw new Error("deletion_proof_collision");
        return;
      }
      transaction.create(reference, proof);
    });
  }

  async cleanupExpiredProofs(expiryIso: string, cursor: Readonly<{ completedAt: string; documentId: string }> | undefined, limit: number): Promise<Readonly<{
    deleted: number;
    cursor?: Readonly<{ completedAt: string; documentId: string }>;
  }>> {
    let query = this.firestore.collection("accountDeletionProofs")
      .where("completedAt", "<=", expiryIso)
      .orderBy("completedAt", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(limit);
    if (cursor) query = query.startAfter(cursor.completedAt, cursor.documentId);
    const snapshot = await query.get();
    if (snapshot.empty) return { deleted: 0 };
    const batch = this.firestore.batch();
    for (const document of snapshot.docs) batch.delete(document.ref);
    await batch.commit();
    const last = snapshot.docs.at(-1)!;
    return { deleted: snapshot.size, cursor: { completedAt: String(last.get("completedAt")), documentId: last.id } };
  }

  async hasExpiredProof(expiryIso: string): Promise<boolean> {
    const snapshot = await this.firestore.collection("accountDeletionProofs")
      .where("completedAt", "<=", expiryIso)
      .limit(1)
      .get();
    return !snapshot.empty;
  }
}

const isDeletionProof = (value: unknown): value is DeletionProof => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Partial<DeletionProof>;
  return Object.keys(value).length === 5
    && typeof candidate.completedAt === "string"
    && typeof candidate.irreversibleAccountIdHash === "string"
    && typeof candidate.requestId === "string"
    && typeof candidate.requestedAt === "string"
    && candidate.resultCode === "account_deleted";
};

const sameDeletionProof = (left: DeletionProof, right: DeletionProof): boolean =>
  left.completedAt === right.completedAt
  && left.irreversibleAccountIdHash === right.irreversibleAccountIdHash
  && left.requestId === right.requestId
  && left.requestedAt === right.requestedAt
  && left.resultCode === right.resultCode;

export type FirebaseAdminAccountRuntime = Readonly<{
  store: FirestoreAccountDatasetStore;
  verifier: FirebaseAdminIdTokenVerifier;
}>;

export type FirebaseAdminInitializationDependencies = Readonly<{
  getApps: () => readonly App[];
  getAuth: (app: App) => Auth;
  getFirestore: (app: App) => Firestore;
  initializeApp: (options: Readonly<{ projectId: string }>) => App;
}>;

const firebaseAdminInitializationDependencies: FirebaseAdminInitializationDependencies = {
  getApps,
  getAuth,
  getFirestore,
  initializeApp,
};

export const initializeFirebaseAdminAccountRuntime = (
  projectId: string,
  dependencies: FirebaseAdminInitializationDependencies = firebaseAdminInitializationDependencies,
): FirebaseAdminAccountRuntime => {
  if (dependencies.getApps().length !== 0) throw new Error("firebase_admin_app_already_initialized");
  const app = dependencies.initializeApp({ projectId });
  return {
    store: new FirestoreAccountDatasetStore(dependencies.getFirestore(app)),
    verifier: new FirebaseAdminIdTokenVerifier(dependencies.getAuth(app)),
  };
};
