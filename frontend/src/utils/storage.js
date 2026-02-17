import { get, set, del } from 'idb-keyval';

const getKeyName = (userId) => `locked_key_${userId}`;

async function deriveEncryptionKey(password, salt) {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
        "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export const savePrivateKey = async (userId, password, rsaPrivateKey) => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveEncryptionKey(password, salt);
    const exportedRSA = await window.crypto.subtle.exportKey("pkcs8", rsaPrivateKey);
    const encryptedRSA = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, aesKey, exportedRSA
    );
    await set(getKeyName(userId), { encryptedRSA, salt, iv });
};

export const unlockPrivateKey = async (lockedPackage, password) => {
    const { encryptedRSA, salt, iv } = lockedPackage;
    const aesKey = await deriveEncryptionKey(password, salt);
    const decryptedRSA = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv }, aesKey, encryptedRSA
    );
    return window.crypto.subtle.importKey(
        "pkcs8", decryptedRSA, 
        { name: "RSA-OAEP", hash: "SHA-256" }, 
        true, ["decrypt"]
    );
};

export const getPrivateKey = async (userId) => await get(getKeyName(userId));

// Session Helpers
export const setSessionKey = (keyBase64) => sessionStorage.setItem('active_rsa_key', keyBase64);
export const getSessionKey = () => sessionStorage.getItem('active_rsa_key');
export const clearSessionKey = () => sessionStorage.removeItem('active_rsa_key');

export const logoutUser = () => {
    localStorage.clear();
    clearSessionKey(); // Crucial for security
};