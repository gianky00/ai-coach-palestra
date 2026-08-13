/**
 * Platform facade: crypto primitives (PKCE / random / digests).
 * Backend: react-native-get-random-values (global crypto) + Web Crypto subtle,
 * with a pure SHA-256 fallback when subtle is unavailable (Hermes).
 */

export enum CryptoDigestAlgorithm {
  SHA256 = 'SHA-256',
}

export enum CryptoEncoding {
  BASE64 = 'base64',
}

export type DigestAlgorithm = CryptoDigestAlgorithm | `${CryptoDigestAlgorithm}` | string;
export type DigestEncoding = CryptoEncoding | `${CryptoEncoding}` | string;

export type CryptoDigestOptions = {
  encoding?: DigestEncoding;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** Compact SHA-256 (FIPS 180-4) for environments without crypto.subtle. */
function sha256Bytes(message: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = message.length * 8;
  const withOne = message.length + 1;
  const padLen = (withOne % 64 <= 56 ? 56 : 120) - (withOne % 64);
  const totalLen = withOne + padLen + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(message);
  padded[message.length] = 0x80;
  const view = new DataView(padded.buffer);
  // SHA-256 length is 64-bit big-endian; message sizes here stay well under 2^32 bits.
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < padded.length; i += 64) {
    for (let j = 0; j < 16; j += 1) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 64; j += 1) {
      const s0 = rotr(w[j - 15]!, 7) ^ rotr(w[j - 15]!, 18) ^ (w[j - 15]! >>> 3);
      const s1 = rotr(w[j - 2]!, 17) ^ rotr(w[j - 2]!, 19) ^ (w[j - 2]! >>> 10);
      w[j] = (w[j - 16]! + s0 + w[j - 7]! + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let j = 0; j < 64; j += 1) {
      const S1 = rotr(e!, 6) ^ rotr(e!, 11) ^ rotr(e!, 25);
      const ch = (e! & f!) ^ (~e! & g!);
      const temp1 = (h! + S1 + ch + K[j]! + w[j]!) >>> 0;
      const S0 = rotr(a!, 2) ^ rotr(a!, 13) ^ rotr(a!, 22);
      const maj = (a! & b!) ^ (a! & c!) ^ (b! & c!);
      const temp2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d! + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0]! + a!) >>> 0;
    H[1] = (H[1]! + b!) >>> 0;
    H[2] = (H[2]! + c!) >>> 0;
    H[3] = (H[3]! + d!) >>> 0;
    H[4] = (H[4]! + e!) >>> 0;
    H[5] = (H[5]! + f!) >>> 0;
    H[6] = (H[6]! + g!) >>> 0;
    H[7] = (H[7]! + h!) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  for (let i = 0; i < 8; i += 1) outView.setUint32(i * 4, H[i]!, false);
  return out;
}

export async function getRandomBytesAsync(byteCount: number): Promise<Uint8Array> {
  const bytes = new Uint8Array(byteCount);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error(
      'crypto.getRandomValues non disponibile (importare react-native-get-random-values)',
    );
  }
  cryptoObj.getRandomValues(bytes);
  return bytes;
}

export async function digestStringAsync(
  algorithm: DigestAlgorithm,
  data: string,
  options?: CryptoDigestOptions,
): Promise<string> {
  if (algorithm !== CryptoDigestAlgorithm.SHA256 && algorithm !== 'SHA-256') {
    throw new Error(`Digest algorithm non supportato: ${String(algorithm)}`);
  }

  const encoding = options?.encoding ?? CryptoEncoding.BASE64;
  if (encoding !== CryptoEncoding.BASE64 && encoding !== 'base64') {
    throw new Error(`Digest encoding non supportata: ${String(encoding)}`);
  }

  const encoded = new TextEncoder().encode(data);
  const subtle = globalThis.crypto?.subtle;
  if (subtle?.digest) {
    const hash = await subtle.digest('SHA-256', encoded);
    return bytesToBase64(new Uint8Array(hash));
  }

  return bytesToBase64(sha256Bytes(encoded));
}
