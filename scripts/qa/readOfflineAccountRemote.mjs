import { createRequire } from "node:module";
import { createHash } from "node:crypto";

// Local smoke receipt only: fixed emulator/project, no credentials or payload output.
const [accountIdSha256, ...extra] = process.argv.slice(2);
if (extra.length || !/^[a-f0-9]{64}$/u.test(accountIdSha256 ?? "")) throw Error("arguments_rejected");
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:18081";
const require = createRequire(new URL("../../../patternly-backend/package.json", import.meta.url));
const { initializeApp, deleteApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const app = initializeApp({ projectId: "patternly-app-sandbox" }, "offline09-read");
const db = getFirestore(app);
try {
  const users = await db.collection("users").get();
  const matches = users.docs.filter((doc) => hash(doc.id) === accountIdSha256);
  if (matches.length !== 1) throw Error("account_rejected");
  const user = matches[0].ref;
  const metadata = (await user.collection("syncMetadata").doc("account").get()).data();
  const generation = metadata?.generation ?? 0;
  if (!Number.isSafeInteger(generation) || generation < 0) throw Error("metadata_rejected");
  const progress = generation === 0 ? user.collection("progress") : user.collection("progressGenerations").doc(String(generation)).collection("records");
  const [records, mutations, batches] = await Promise.all([progress.get(), user.collection("syncMutations").get(), user.collection("syncBatches").get()]);
  const receipt = {
    schema: "patternly.offline-account-remote-read.v1", project: "patternly-app-sandbox", emulator: "127.0.0.1:18081", accountIdSha256,
    accountRevision: metadata?.accountRevision ?? 0, generation,
    records: records.docs.map((doc) => {
      const data = doc.data();
      if (typeof data.targetId !== "string" || typeof data.lastMutationId !== "string" || typeof data.fingerprint !== "string" || !Number.isSafeInteger(data.version)) throw Error("record_rejected");
      return { recordType: data.recordType, recordIdSha256: hash(data.targetId), fingerprint: data.fingerprint, version: data.version, mutationIdSha256: hash(data.lastMutationId) };
    }).sort((a, b) => a.recordIdSha256.localeCompare(b.recordIdSha256)),
    mutationCount: mutations.size, batchCount: batches.size,
  };
  console.log(JSON.stringify(receipt));
} catch {
  console.error(JSON.stringify({ stage: "offline_account_remote_read", category: "read_failed" }));
  process.exitCode = 1;
} finally { await db.terminate(); await deleteApp(app); }
