// services/apiKeyService.ts
// Service centralisé pour la gestion sécurisée de la clé API Gemini

import { validateApiKey } from './validateApiKey';

// Correction Vite : lecture de la clé d'environnement côté client
const ENV_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
const ENV_API_PREFIX = (import.meta as any).env?.VITE_GEMINI_API_PREFIX as string | undefined;
const API_KEY_PREFIX = ENV_API_PREFIX || 'GEMINI_';
const LOCAL_STORAGE_KEY = 'encrypted_gemini_api_key';
const LOCAL_STORAGE_CRYPTO_KEY = 'gemini_api_crypto_key';

// --- Chiffrement/déchiffrement avec Web Crypto API ---

async function generateCryptoKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function exportCryptoKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

async function importCryptoKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptApiKey(apiKey: string, key: CryptoKey): Promise<{ciphertext: string, iv: string}> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(apiKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

async function decryptApiKey(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const ivArr = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArr },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

// --- Gestion de la clé API ---

async function getValidApiKey(): Promise<string | null> {
  // 1. Vérifier la variable d'environnement
  console.log('[apiKeyService] (Vérifie présence ENV_API_KEY)', ENV_API_KEY);
  if (ENV_API_KEY) {
    const valid = await validateApiKey(ENV_API_KEY);
    console.log('[apiKeyService] (Résultat validation ENV_API_KEY)', valid);
    if (valid) return ENV_API_KEY;
  }
  // 2. Vérifier localStorage
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  const storedKey = localStorage.getItem(LOCAL_STORAGE_CRYPTO_KEY);
  console.log('[apiKeyService] (Vérifie présence clé locale)', { stored, storedKey });
  if (stored && storedKey) {
    try {
      const { ciphertext, iv } = JSON.parse(stored);
      const key = await importCryptoKey(storedKey);
      const decrypted = await decryptApiKey(ciphertext, iv, key);
      // Retirer le préfixe après déchiffrement
      if (!decrypted.startsWith(API_KEY_PREFIX)) {
        console.log('[apiKeyService] (Préfixe manquant après déchiffrement)', decrypted);
        removeLocalApiKey();
        return null;
      }
      const apiKey = decrypted.slice(API_KEY_PREFIX.length);
      console.log('[clé après déchiffrement]', apiKey);
      const valid = await validateApiKey(apiKey);
      console.log('[apiKeyService] (Résultat validation clé locale)', valid);
      if (valid) return apiKey;
    } catch (e) {
      console.log('[apiKeyService] (Erreur déchiffrement clé locale)', e);
      removeLocalApiKey();
    }
  }
  return null;
}

function notifyApiKeyChanged() {
  window.dispatchEvent(new Event('apiKeyChanged'));
}

async function storeUserApiKey(apiKey: string): Promise<boolean> {
  console.log('[clé avant chiffrement]', apiKey);
  const valid = await validateApiKey(apiKey);
  if (!valid) return false;
  const key = await generateCryptoKey();
  const exportedKey = await exportCryptoKey(key);
  // Ajouter le préfixe avant chiffrement
  const apiKeyWithPrefix = API_KEY_PREFIX + apiKey;
  const { ciphertext, iv } = await encryptApiKey(apiKeyWithPrefix, key);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ciphertext, iv }));
  localStorage.setItem(LOCAL_STORAGE_CRYPTO_KEY, exportedKey);
  console.log('[clé de chiffrement (clé random) exportée]', exportedKey);
  console.log('[valeur du localStorage après chiffrement]', {
    encrypted: localStorage.getItem(LOCAL_STORAGE_KEY),
    cryptoKey: localStorage.getItem(LOCAL_STORAGE_CRYPTO_KEY)
  });
  notifyApiKeyChanged();
  return true;
}

function removeLocalApiKey() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_CRYPTO_KEY);
  notifyApiKeyChanged();
}

export const apiKeyService = {
  getValidApiKey,
  storeUserApiKey,
  removeLocalApiKey,
};
