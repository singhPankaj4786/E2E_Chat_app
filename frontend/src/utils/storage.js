import { get, set, del } from 'idb-keyval';

// Save the Private Key generated during signup/login
export const savePrivateKey = async (key) => {
    try {
        await set('chat_private_key', key);
    } catch (err) {
        console.error("Failed to save private key to IndexedDB", err);
    }
};

// Retrieve the key when we need to decrypt a message
// THIS IS THE ONE THE ERROR IS COMPLAINING ABOUT
export const getPrivateKey = async () => {
    return await get('chat_private_key');
};

// Clear everything on logout
export const clearUserSession = async () => {
    await del('chat_private_key');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
};