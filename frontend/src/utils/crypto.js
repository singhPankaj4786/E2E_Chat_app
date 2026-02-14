// src/utils/crypto.js

// Helper to convert ArrayBuffer to Base64 String
const ab2str = (buf) => window.btoa(String.fromCharCode(...new Uint8Array(buf)));

// Helper to convert Base64 String to ArrayBuffer
const str2ab = (str) => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyString = ab2str(publicKeyBuffer);

    return { publicKeyString, privateKey: keyPair.privateKey };
};

export const encryptForRecipient = async (text, recipientPublicKeyPEM) => {
    try {
        // 1. Import Recipient's Public Key
        const binaryDerString = window.atob(recipientPublicKeyPEM);
        const binaryDer = str2ab(binaryDerString);
        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            binaryDer,
            { name: "RSA-OAEP", hash: "SHA-256" },
            true,
            ["encrypt"]
        );

        // 2. Generate temporary AES key for this message
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt"]
        );

        // 3. Encrypt the Message with AES
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedText = new TextEncoder().encode(text);
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encodedText
        );

        // 4. Encrypt the AES key with Recipient's RSA Public Key
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );

        return {
            ciphertext: ab2str(ciphertext),
            iv: ab2str(iv),
            encryptedAesKey: ab2str(encryptedAesKey)
        };
    } catch (err) {
        console.error("Encryption Logic Error:", err);
        throw err;
    }
};

export const decryptMessage = async (encryptedPackage, privateKey) => {
    try {
        const { ciphertext, iv, encryptedAesKey } = encryptedPackage;

        // 1. Decrypt the AES Key using our Private Key
        const aesKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            str2ab(window.atob(encryptedAesKey))
        );

        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyBuffer,
            "AES-GCM",
            "AES-GCM",
            ["decrypt"]
        );

        // 2. Decrypt the message
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: str2ab(window.atob(iv)) },
            aesKey,
            str2ab(window.atob(ciphertext))
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        console.error("Decryption Logic Error:", err);
        throw err;
    }
};