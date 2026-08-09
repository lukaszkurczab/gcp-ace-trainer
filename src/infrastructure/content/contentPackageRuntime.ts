import { createHash } from "node:crypto";
import { gunzipSync } from "fflate";

import type { ContentPackageRuntime } from "../../content/contracts";
import { decodePackageBase64, decodePackageUtf8 } from "./contentPackageRuntime.shared";

/** Node-only verification adapter. Native builds resolve contentPackageRuntime.native.ts instead. */
export const contentPackageRuntime: ContentPackageRuntime = Object.freeze({
  async sha256Utf8(value) {
    return createHash("sha256").update(value, "utf8").digest("hex");
  },
  async sha256Bytes(value) {
    return createHash("sha256").update(value).digest("hex");
  },
  decodeBase64: decodePackageBase64,
  async gunzip(value) {
    return gunzipSync(value);
  },
  decodeUtf8: decodePackageUtf8,
});
