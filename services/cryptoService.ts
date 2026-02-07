/**
 * 密码加密和简单 Token 服务（浏览器兼容版本）
 * 使用 Web Crypto API 实现 PBKDF2-SHA256 密码哈希
 * 在非安全上下文（如 HTTP）自动回退到 crypto-js
 * 使用简化的 JWT 替代方案
 */

import type { User, JWTPayload } from '../types';
import CryptoJS from 'crypto-js';

// JWT 密钥（实际使用时应从环境变量读取）
const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天（毫秒）

// 检测 Web Crypto API 是否可用
const isWebCryptoAvailable = typeof crypto !== 'undefined' && !!crypto.subtle && !!crypto.getRandomValues;

console.log(`[CryptoService] Web Crypto API available: ${isWebCryptoAvailable}`);

/**
 * 生成随机盐值
 */
function generateSalt(): Uint8Array {
  if (isWebCryptoAvailable) {
    return crypto.getRandomValues(new Uint8Array(16));
  } else {
    // Fallback: use crypto-js lib.WordArray.random
    const randomWords = CryptoJS.lib.WordArray.random(16);
    return new Uint8Array(Buffer.from(randomWords.toString(CryptoJS.enc.Hex), 'hex'));
  }
}

/**
 * 将字节数组转换为十六进制字符串
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将十六进制字符串转换为字节数组
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// 简单的 Buffer polyfill for browser environment if needed, 
// using generic approach to convert CryptoJS WordArray to Uint8Array
function wordToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    u8[i] = byte;
  }
  return u8;
}


/**
 * 使用 PBKDF2-SHA256 哈希密码
 * @param password 明文密码
 * @returns 格式为 "salt:hash" 的字符串
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const saltHex = bytesToHex(salt);

  if (isWebCryptoAvailable) {
    const passwordBuffer = new TextEncoder().encode(password);

    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // 派生密钥
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 256 bits = 32 bytes
    );

    const hash = new Uint8Array(hashBuffer);
    return `${saltHex}:${bytesToHex(hash)}`;
  } else {
    // Fallback: use crypto-js
    // CryptoJS PBKDF2 returns a WordArray
    const derivedKey = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(saltHex), {
      keySize: 256 / 32, // keySize in 32-bit words. 256 bits = 8 words
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    });

    return `${saltHex}:${derivedKey.toString(CryptoJS.enc.Hex)}`;
  }
}

/**
 * 验证密码
 * @param password 明文密码
 * @param storedHash 存储的哈希值（格式：salt:hash）
 * @returns 是否匹配
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }

  if (isWebCryptoAvailable) {
    const salt = hexToBytes(saltHex);
    const storedHashBytes = hexToBytes(hashHex);
    const passwordBuffer = new TextEncoder().encode(password);

    // 导入密码作为密钥材料
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // 派生密钥
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const hash = new Uint8Array(hashBuffer);

    // 固定时间比较，防止时序攻击
    if (hash.length !== storedHashBytes.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash[i] ^ storedHashBytes[i];
    }

    return result === 0;
  } else {
    // Fallback: use crypto-js
    const derivedKey = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(saltHex), {
      keySize: 256 / 32,
      iterations: 100000,
      hasher: CryptoJS.algo.SHA256
    });

    const derivedHashHex = derivedKey.toString(CryptoJS.enc.Hex);
    // Simple string comparison (not constant-time, but acceptable for this fallback)
    return derivedHashHex === hashHex;
  }
}

/**
 * Base64 URL 编码（支持 Unicode）
 */
function base64UrlEncode(str: string): string {
  // 使用 TextEncoder 处理 Unicode 字符
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  return btoa(binString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL 解码（支持 Unicode）
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
}

/**
 * 使用 HMAC-SHA256 签名
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  if (isWebCryptoAvailable) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return bytesToHex(new Uint8Array(signature));
  } else {
    // Fallback: use crypto-js
    const signature = CryptoJS.HmacSHA256(message, secret);
    return signature.toString(CryptoJS.enc.Hex);
  }
}

/**
 * 生成简单 JWT Token（浏览器兼容版本）
 * @param user 用户对象
 * @returns JWT token 字符串
 */
export async function generateToken(user: User): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    displayName: user.display_name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + JWT_EXPIRY) / 1000)
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Signature logic is handled inside hmacSign
  const signatureHex = await hmacSign(message, JWT_SECRET);

  // Convert hex signature to raw bytes string for base64 encoding to match JWT spec
  const signatureBytes = hexToBytes(signatureHex);
  const signatureBinString = Array.from(signatureBytes, (byte) => String.fromCodePoint(byte)).join('');
  const encodedSignature = btoa(signatureBinString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${message}.${encodedSignature}`;
}

/**
 * 验证 JWT Token
 * @param token JWT token 字符串
 * @returns 解析后的用户信息，无效则返回 null
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    // 验证签名
    const expectedSignatureHex = await hmacSign(message, JWT_SECRET);

    // We need to compare the hex version of the actual signature
    // Decode base64url actual signature to bytes
    let base64 = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binString = atob(base64);
    const actualSignatureBytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const actualSignatureHex = bytesToHex(actualSignatureBytes);

    if (expectedSignatureHex !== actualSignatureHex) {
      return null;
    }

    // 解析 payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JWTPayload;

    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token 验证失败:', error);
    return null;
  }
}

