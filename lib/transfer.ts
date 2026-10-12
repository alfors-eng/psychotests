/**
 * Перенос данных между устройствами без сервера: данные шифруются в браузере паролем (PBKDF2 + AES-GCM)
 * и кладутся во фрагмент ссылки после «#». Браузер не отправляет фрагмент на сервер, поэтому сайт ничего не получает.
 * Модуль не обращается к localStorage и работает и в браузере, и в Node (тесты).
 */

const PREFIX = 'v1.';
const ITERATIONS = 600_000; // рекомендация OWASP для PBKDF2-HMAC-SHA256
const SALT = 16;
const IV = 12;
export const MIN_PASSPHRASE = 8;

export class TransferError extends Error {
  constructor(public code: 'bad-format' | 'bad-passphrase' | 'unsupported') {
    super(code);
  }
}

const toB64 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromB64 = (text: string): Uint8Array => {
  const s = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

async function run(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function deriveKey(passphrase: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new TransferError('unsupported');
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    usage,
  );
}

/** Шифрует данные и возвращает строку вида «v1.…», пригодную для вставки во фрагмент ссылки. */
export async function encryptTransfer(data: unknown, passphrase: string): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(data));
  let body: Uint8Array = raw;
  let flag = 0;
  if (typeof CompressionStream !== 'undefined') {
    body = await run(raw, new CompressionStream('deflate-raw'));
    flag = 1;
  }
  const plain = new Uint8Array(body.length + 1);
  plain[0] = flag;
  plain.set(body, 1);
  const salt = crypto.getRandomValues(new Uint8Array(SALT));
  const iv = crypto.getRandomValues(new Uint8Array(IV));
  const key = await deriveKey(passphrase, salt, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plain as BufferSource));
  const out = new Uint8Array(SALT + IV + cipher.length);
  out.set(salt, 0);
  out.set(iv, SALT);
  out.set(cipher, SALT + IV);
  return PREFIX + toB64(out);
}

/** Расшифровывает строку «v1.…». Неверный пароль или повреждённые данные — TransferError. */
export async function decryptTransfer(token: string, passphrase: string): Promise<unknown> {
  if (!token.startsWith(PREFIX)) throw new TransferError('bad-format');
  let bytes: Uint8Array;
  try {
    bytes = fromB64(token.slice(PREFIX.length));
  } catch {
    throw new TransferError('bad-format');
  }
  if (bytes.length < SALT + IV + 17) throw new TransferError('bad-format');
  const key = await deriveKey(passphrase, bytes.subarray(0, SALT), ['decrypt']);
  let plain: Uint8Array;
  try {
    plain = new Uint8Array(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(SALT, SALT + IV) as BufferSource }, key, bytes.subarray(SALT + IV) as BufferSource),
    );
  } catch {
    throw new TransferError('bad-passphrase');
  }
  try {
    const body = plain.subarray(1);
    const raw = plain[0] === 1 ? await run(body, new DecompressionStream('deflate-raw')) : body;
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new TransferError('bad-format');
  }
}

/** Достаёт токен «v1.…» из полной ссылки, из фрагмента или из самого токена. */
export function extractToken(input: string): string | null {
  const m = input.trim().match(/v1\.[A-Za-z0-9_-]+/);
  return m ? m[0] : null;
}
