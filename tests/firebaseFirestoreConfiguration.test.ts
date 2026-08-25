import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");

const CANONICAL_DENY_ALL_RULES = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

test("Firebase configuration exposes the deny-all rules and the one semantic account-record index", () => {
  assert.deepEqual(JSON.parse(read(".firebaserc")), {
    projects: {
      sandbox: "patternly-app-sandbox",
      production: "patternly-app-production",
    },
  });
  const firebaseConfig = JSON.parse(read("firebase.json")) as {
    auth?: { providers?: { emailPassword?: boolean; googleSignIn?: { oAuthBrandDisplayName?: string; supportEmail?: string } } };
    firestore?: { indexes?: string; rules?: string };
  };
  assert.deepEqual(firebaseConfig.firestore, {
    indexes: "firestore.indexes.json",
    rules: "firestore.rules",
  });
  assert.deepEqual(firebaseConfig.auth, {
    providers: {
      emailPassword: true,
      googleSignIn: {
        oAuthBrandDisplayName: "Patternly",
        supportEmail: "lukasz.kurczab@gmail.com",
      },
    },
  });
  assert.deepEqual(JSON.parse(read("firestore.indexes.json")), {
    indexes: [{
      collectionGroup: "records",
      queryScope: "COLLECTION",
      fields: [
        { fieldPath: "type", order: "ASCENDING" },
        { fieldPath: "id", order: "ASCENDING" },
      ],
    }],
    fieldOverrides: [
      { collectionGroup: "contentReports", fieldPath: "expiresAt", ttl: true },
      { collectionGroup: "rateLimitBuckets", fieldPath: "expiresAt", ttl: true },
    ],
  });
  assert.equal(read("firestore.rules"), CANONICAL_DENY_ALL_RULES);
});
