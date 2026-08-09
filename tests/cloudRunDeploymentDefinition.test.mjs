import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("manual Cloud Build definition keeps the PO-031 single-build boundary", () => {
  const definition = parse(read("server/cloudbuild.yaml"));
  assert.deepEqual(definition.steps, [{
    name: "gcr.io/cloud-builders/docker@sha256:617f98016081e2978c0b44184d7b09446027b909f1078b8fdc23efc4c74c5f20",
    dir: "server",
    args: ["build", "--pull", "--tag", "${_IMAGE_URI}:${BUILD_ID}", "."],
  }]);
  assert.deepEqual(definition.images, ["${_IMAGE_URI}:${BUILD_ID}"]);
  assert.equal(definition.options.logging, "CLOUD_LOGGING_ONLY");
  assert.equal(definition.timeout, "900s");
  const serialized = JSON.stringify(definition);
  assert.doesNotMatch(serialized, /gcr\.io\/cloud-builders\/docker"|trigger|--source|GOOGLE_APPLICATION_CREDENTIALS|latest/i);
});

test("container is a clean Node 22 build and preserves the authenticated route surface", () => {
  const dockerfile = read("server/Dockerfile");
  const nodeImage = "docker.io/library/node@sha256:83fdfa2a4de32d7f8d79829ea259bd6a4821f8b2d123204ac467fbe3966450fc";
  assert.match(dockerfile, new RegExp(`FROM ${nodeImage} AS build`));
  assert.match(dockerfile, new RegExp(`FROM ${nodeImage} AS runtime`));
  assert.match(dockerfile, /RUN npm ci/);
  assert.match(dockerfile, /RUN npm run build/);
  assert.match(dockerfile, /RUN npm ci --omit=dev/);
  assert.match(dockerfile, /USER node/);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(dockerfile, /process\.kill\(1, 0\)/);
  assert.doesNotMatch(dockerfile, /FROM node:|GOOGLE_APPLICATION_CREDENTIALS|curl|wget/);
});

test("operator packet requires separated identities and a digest deployment", () => {
  const packet = read("docs/operations/cloud-run-manual-deploy.md");
  for (const identity of ["patternly-deployer", "patternly-runtime", "patternly-builder", "patternly-scheduler"]) {
    assert.match(packet, new RegExp(identity));
  }
  assert.match(packet, /@sha256:<DIGEST>/);
  assert.match(packet, /--no-invoker-iam-check/);
  assert.match(packet, /--min-instances=0/);
  assert.match(packet, /CLOUD_LOGGING_ONLY/);
  assert.match(packet, /no public,\s*unauthenticated health endpoint/i);
  assert.match(packet, /move 100% of\s*traffic to that revision/i);
  assert.match(packet, /Do not also\s*grant `roles\/run\.invoker` to `allUsers`/);
});
