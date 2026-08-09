const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decodes only canonical RFC 4648 base64; package verification fails closed for all other input. */
export function decodePackageBase64(value: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(value)) {
    throw new Error("Invalid base64.");
  }

  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  // RFC 4648 requires unused pad bits to be zero. Without this check several
  // spellings decode to the same bytes and package checksums cease to identify
  // a single textual envelope representation.
  if ((padding === 2 && (BASE64.indexOf(value[value.length - 3]!) & 0x0f) !== 0)
    || (padding === 1 && (BASE64.indexOf(value[value.length - 2]!) & 0x03) !== 0)) {
    throw new Error("Invalid base64.");
  }
  const bytes = new Uint8Array((value.length / 4) * 3 - padding);
  let output = 0;
  for (let index = 0; index < value.length; index += 4) {
    const encoded = (BASE64.indexOf(value[index]!) << 18)
      | (BASE64.indexOf(value[index + 1]!) << 12)
      | ((value[index + 2] === "=" ? 0 : BASE64.indexOf(value[index + 2]!)) << 6)
      | (value[index + 3] === "=" ? 0 : BASE64.indexOf(value[index + 3]!));
    if (output < bytes.length) bytes[output++] = encoded >> 16;
    if (output < bytes.length) bytes[output++] = (encoded >> 8) & 0xff;
    if (output < bytes.length) bytes[output++] = encoded & 0xff;
  }
  return bytes;
}

/** Rejects malformed UTF-8 instead of silently replacing invalid bytes in verified payloads. */
export function decodePackageUtf8(value: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(value);
}

export function bytesToHex(value: Uint8Array): string {
  let result = "";
  for (const byte of value) result += byte.toString(16).padStart(2, "0");
  return result;
}
