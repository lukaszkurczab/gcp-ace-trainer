export interface ContentHasher { sha256(value: string): Promise<string>; }
export const contentHasher: ContentHasher = {
  async sha256(value) {
    const { createHash } = require("node:crypto") as typeof import("node:crypto");
    return createHash("sha256").update(value, "utf8").digest("hex");
  },
};
