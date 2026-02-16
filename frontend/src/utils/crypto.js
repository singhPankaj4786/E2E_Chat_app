// src/utils/crypto.js

// ---------- Safe Base64 Helpers ----------

// ArrayBuffer -> Base64
const ab2b64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Base64 -> ArrayBuffer
const b642ab = (base64) => {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// ---------- RSA Key Generation ----------

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

    const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
    );

    const publicKeyString = ab2b64(publicKeyBuffer);

    return {
        publicKeyString,
        privateKey: keyPair.privateKey,
    };
};

// ---------- Hybrid Encryption ----------

export const encryptForRecipient = async (text, recipientPublicKeyBase64) => {
    try {
        // 1️⃣ Import recipient's RSA public key
        const publicKey = await window.crypto.subtle.importKey(
            "spki",
            b642ab(recipientPublicKeyBase64),
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            false,
            ["encrypt"]
        );

        // 2️⃣ Generate random AES-256-GCM key
        const aesKey = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true, // must be extractable so we can encrypt it via RSA
            ["encrypt", "decrypt"]
        );

        // 3️⃣ Generate random IV (12 bytes recommended for GCM)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // 4️⃣ Encrypt message with AES-GCM
        const encodedText = new TextEncoder().encode(text);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            aesKey,
            encodedText
        );

        // 5️⃣ Export AES key (raw) so we can encrypt it
        const exportedAesKey = await window.crypto.subtle.exportKey(
            "raw",
            aesKey
        );

        // 6️⃣ Encrypt AES key using recipient's RSA public key
        const encryptedAesKey = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            publicKey,
            exportedAesKey
        );

        return {
            ciphertext: ab2b64(ciphertext),
            encryptedAesKey: ab2b64(encryptedAesKey),
            iv: ab2b64(iv),
        };
    } catch (err) {
        console.error("Encryption error:", err);
        throw err;
    }
};

// ---------- Decryption ----------

export const decryptMessage = async (encryptedPackage, privateKey) => {
    try {
        const { ciphertext, encryptedAesKey, iv } = encryptedPackage;

        // 1️⃣ Decrypt AES key using our private RSA key
        const decryptedAesKeyBuffer = await window.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            privateKey,
            b642ab(encryptedAesKey)
        );

        // 2️⃣ Import decrypted AES key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            decryptedAesKeyBuffer,
            {
                name: "AES-GCM",
            },
            false,
            ["decrypt"]
        );

        // 3️⃣ Decrypt message
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: b642ab(iv),
            },
            aesKey,
            b642ab(ciphertext)
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        console.error("Decryption failed (possible tampering or wrong key):", err);
        throw err;
    }
};
export const encryptForBoth = async (
    text,
    recipientPublicKeyBase64,
    senderPublicKeyBase64
) => {
    try {
        // 1️⃣ Import recipient public key
        const recipientPublicKey = await window.crypto.subtle.importKey(
            "spki",
            b642ab(recipientPublicKeyBase64),
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );

        // 2️⃣ Import sender public key
        const senderPublicKey = await window.crypto.subtle.importKey(
            "spki",
            b642ab(senderPublicKeyBase64),
            { name: "RSA-OAEP", hash: "SHA-256" },
            false,
            ["encrypt"]
        );

        // 3️⃣ Generate AES-256-GCM key
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encodedText = new TextEncoder().encode(text);

        const ciphertext = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            aesKey,
            encodedText
        );

        // 4️⃣ Export AES key
        const exportedAesKey = await window.crypto.subtle.exportKey(
            "raw",
            aesKey
        );

        // 5️⃣ Encrypt AES key separately
        const encryptedKeyForRecipient =
            await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                recipientPublicKey,
                exportedAesKey
            );

        const encryptedKeyForSender =
            await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                senderPublicKey,
                exportedAesKey
            );

        return {
            ciphertext: ab2b64(ciphertext),
            iv: ab2b64(iv),
            encrypted_key_for_recipient: ab2b64(encryptedKeyForRecipient),
            encrypted_key_for_sender: ab2b64(encryptedKeyForSender),
        };
    } catch (err) {
        console.error("Dual encryption error:", err);
        throw err;
    }
};
