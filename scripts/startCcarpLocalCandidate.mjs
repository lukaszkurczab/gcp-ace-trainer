import { runLocalProfile } from "./runLocalProfile.mjs";
import { syncCanonicalContent } from "./syncBundledContentRelease.mjs";
import { pathToFileURL } from "node:url";
import path from "node:path";

/** Explicit local, unpublished CONTENT candidate; ordinary launch guards stay unchanged. */
export async function startCcarpLocalCandidate() {
  return runLocalProfile(["smoke", "start", "--port", "8083"], {
    prepareCurrentContent: async () => {
      const prepared = await syncCanonicalContent({ mode: "candidate" });
      if (!prepared.currentIdentity || prepared.currentIdentity.sourceTree !== "dirty") throw new Error("Local candidate provenance is unavailable.");
      console.info(`LOCAL_UNPUBLISHED_CANDIDATE=${prepared.currentIdentity.sourceInputFingerprint}`);
    },
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  startCcarpLocalCandidate().then(({ code }) => process.exitCode = code).catch(() => {
    process.stderr.write("CCAR-P local candidate could not start. Check source validation, local API/Auth and Metro availability.\n");
    process.exitCode = 1;
  });
}
