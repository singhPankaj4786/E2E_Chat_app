import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPrivateKey, unlockPrivateKey, getSessionKey, setSessionKey } from '../utils/storage';

const KeyContext = createContext();

export const KeyProvider = ({ children }) => {
    const [unlockedKey, setUnlockedKey] = useState(null);
    const [isVaultLoading, setIsVaultLoading] = useState(true);
    const clearVault = () => setUnlockedKey(null);

    // Effect to recover key from session on refresh
    useEffect(() => {
        const recoverKey = async () => {
            const savedKeyBase64 = getSessionKey();
            if (savedKeyBase64) {
                try {
                    // Convert back from string to CryptoKey object
                    const binaryDer = Uint8Array.from(atob(savedKeyBase64), c => c.charCodeAt(0));
                    const recovered = await window.crypto.subtle.importKey(
                        "pkcs8", binaryDer, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]
                    );
                    setUnlockedKey(recovered);
                } catch (e) { console.error("Session recovery failed", e); }
            }
            setIsVaultLoading(false);
        };
        recoverKey();
    }, []);

    const unlockVault = async (userId, password) => {
        try {
            const lockedPackage = await getPrivateKey(userId);
            if (!lockedPackage) return false;

            const decryptedRSAKey = await unlockPrivateKey(lockedPackage, password);
            
            // Save to SessionStorage to survive refresh
            const exported = await window.crypto.subtle.exportKey("pkcs8", decryptedRSAKey);
            const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
            setSessionKey(base64Key);

            setUnlockedKey(decryptedRSAKey);
            return true;
        } catch (err) { return false; }
    };

    // frontend/src/context/KeyContext.jsx

return (
    <KeyContext.Provider value={{ 
        unlockedKey, 
        setUnlockedKey, 
        unlockVault, 
        isVaultLoading,
        clearVault // <--- ADD THIS LINE
    }}>
        {children}
    </KeyContext.Provider>
);
};

export const useKeyVault = () => useContext(KeyContext);