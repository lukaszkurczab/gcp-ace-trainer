export type Sha256State = Readonly<{
  version: 1;
  algorithm: "sha256";
  words: readonly [number, number, number, number, number, number, number, number];
  totalBytes: string;
  tailHex: string;
}>;

const INITIAL_WORDS = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19,
] as const;

const ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

const MAX_TOTAL_BYTES = 1n << 61n;
const STATE_KEYS = "algorithm:tailHex:totalBytes:version:words";
const WORD_KEYS = "0:1:2:3:4:5:6:7";

const rotateRight = (value: number, bits: number): number =>
  ((value >>> bits) | (value << (32 - bits))) >>> 0;

const compress = (words: number[], bytes: Uint8Array, offset: number): void => {
  const schedule = new Uint32Array(64);
  for (let index = 0; index < 16; index += 1) {
    const start = offset + index * 4;
    schedule[index] = (
      (bytes[start]! << 24)
      | (bytes[start + 1]! << 16)
      | (bytes[start + 2]! << 8)
      | bytes[start + 3]!
    ) >>> 0;
  }
  for (let index = 16; index < 64; index += 1) {
    const previous15 = schedule[index - 15]!;
    const previous2 = schedule[index - 2]!;
    const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ (previous15 >>> 3);
    const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ (previous2 >>> 10);
    schedule[index] = (schedule[index - 16]! + sigma0 + schedule[index - 7]! + sigma1) >>> 0;
  }

  let a = words[0]!;
  let b = words[1]!;
  let c = words[2]!;
  let d = words[3]!;
  let e = words[4]!;
  let f = words[5]!;
  let g = words[6]!;
  let h = words[7]!;
  for (let index = 0; index < 64; index += 1) {
    const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
    const choice = (e & f) ^ (~e & g);
    const temporary1 = (h + sum1 + choice + ROUND_CONSTANTS[index]! + schedule[index]!) >>> 0;
    const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
    const majority = (a & b) ^ (a & c) ^ (b & c);
    const temporary2 = (sum0 + majority) >>> 0;
    h = g;
    g = f;
    f = e;
    e = (d + temporary1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (temporary1 + temporary2) >>> 0;
  }
  words[0] = (words[0]! + a) >>> 0;
  words[1] = (words[1]! + b) >>> 0;
  words[2] = (words[2]! + c) >>> 0;
  words[3] = (words[3]! + d) >>> 0;
  words[4] = (words[4]! + e) >>> 0;
  words[5] = (words[5]! + f) >>> 0;
  words[6] = (words[6]! + g) >>> 0;
  words[7] = (words[7]! + h) >>> 0;
};

const bytesToHex = (bytes: Uint8Array): string => {
  let result = "";
  for (const byte of bytes) result += byte.toString(16).padStart(2, "0");
  return result;
};

const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateState = (value: unknown): Readonly<{
  totalBytes: bigint;
  tail: Uint8Array;
  words: number[];
}> => {
  if (!isObject(value) || Object.keys(value).sort().join(":") !== STATE_KEYS) {
    throw new Error("invalid_sha256_state");
  }
  if (
    value.version !== 1
    || value.algorithm !== "sha256"
    || !Array.isArray(value.words)
    || value.words.length !== 8
    || Object.keys(value.words).join(":") !== WORD_KEYS
    || value.words.some((word) => !Number.isInteger(word) || word < 0 || word > 0xffff_ffff)
    || typeof value.totalBytes !== "string"
    || value.totalBytes.length > 19
    || !/^(?:0|[1-9][0-9]*)$/u.test(value.totalBytes)
    || typeof value.tailHex !== "string"
    || !/^(?:[0-9a-f]{2}){0,63}$/u.test(value.tailHex)
  ) {
    throw new Error("invalid_sha256_state");
  }
  const totalBytes = BigInt(value.totalBytes);
  const tail = hexToBytes(value.tailHex);
  if (
    totalBytes >= MAX_TOTAL_BYTES
    || BigInt(tail.length) > totalBytes
    || (totalBytes - BigInt(tail.length)) % 64n !== 0n
  ) {
    throw new Error("invalid_sha256_state");
  }
  return { totalBytes, tail, words: [...value.words] };
};

export class Sha256Accumulator {
  private constructor(
    private readonly words: number[],
    private totalBytes: bigint,
    private tail: Uint8Array,
  ) {}

  static create(): Sha256Accumulator {
    return new Sha256Accumulator([...INITIAL_WORDS], 0n, new Uint8Array());
  }

  static restore(value: unknown): Sha256Accumulator {
    const state = validateState(value);
    return new Sha256Accumulator(state.words, state.totalBytes, state.tail);
  }

  update(bytes: Uint8Array): this {
    if (!(bytes instanceof Uint8Array)) throw new Error("invalid_sha256_input");
    const nextTotalBytes = this.totalBytes + BigInt(bytes.byteLength);
    if (nextTotalBytes >= MAX_TOTAL_BYTES) throw new Error("sha256_input_too_large");

    let offset = 0;
    if (this.tail.length > 0) {
      const required = 64 - this.tail.length;
      if (bytes.byteLength < required) {
        const nextTail = new Uint8Array(this.tail.length + bytes.byteLength);
        nextTail.set(this.tail);
        nextTail.set(bytes, this.tail.length);
        this.tail = nextTail;
        this.totalBytes = nextTotalBytes;
        return this;
      }
      const block = new Uint8Array(64);
      block.set(this.tail);
      block.set(bytes.subarray(0, required), this.tail.length);
      compress(this.words, block, 0);
      this.tail = new Uint8Array();
      offset = required;
    }
    while (offset + 64 <= bytes.byteLength) {
      compress(this.words, bytes, offset);
      offset += 64;
    }
    this.tail = bytes.slice(offset);
    this.totalBytes = nextTotalBytes;
    return this;
  }

  exportState(): Sha256State {
    return {
      version: 1,
      algorithm: "sha256",
      words: [
        this.words[0]!,
        this.words[1]!,
        this.words[2]!,
        this.words[3]!,
        this.words[4]!,
        this.words[5]!,
        this.words[6]!,
        this.words[7]!,
      ],
      totalBytes: this.totalBytes.toString(10),
      tailHex: bytesToHex(this.tail),
    };
  }

  digestHex(): string {
    const words = [...this.words];
    const finalByteLength = this.tail.length < 56 ? 64 : 128;
    const finalBytes = new Uint8Array(finalByteLength);
    finalBytes.set(this.tail);
    finalBytes[this.tail.length] = 0x80;
    const bitLength = this.totalBytes * 8n;
    for (let index = 0; index < 8; index += 1) {
      finalBytes[finalBytes.length - 1 - index] = Number((bitLength >> BigInt(index * 8)) & 0xffn);
    }
    for (let offset = 0; offset < finalBytes.length; offset += 64) compress(words, finalBytes, offset);
    return words.map((word) => word.toString(16).padStart(8, "0")).join("");
  }
}
