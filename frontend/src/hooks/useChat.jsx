import { useState, useEffect } from 'react';
import api from '../api/axios';
import { decryptMessage } from '../utils/crypto';
import { useKeyVault } from '../context/KeyContext';

const useChat = (recipient, setUnreadCounts) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId"));
    
    // Get the unlocked RSA key directly from RAM
    const { unlockedKey } = useKeyVault();

    // 1. Unified Fetch History & Decryption
    useEffect(() => {
        // Only run if we have a recipient AND the vault is unlocked
        if (!recipient || !unlockedKey) return;

        const loadHistory = async () => {
            try {
                const res = await api.get(`/chat/history/${recipient.id}`);
                const decryptedHistory = await Promise.all(res.data.map(async (msg) => {
                    try {
                        const plaintext = await decryptMessage({
                            ciphertext: msg.encrypted_content,
                            encryptedAesKey: msg.encrypted_key, 
                            iv: msg.iv
                        }, unlockedKey); // Use RAM key
                        return { ...msg, decrypted_content: plaintext };
                    } catch (e) { 
                        return { ...msg, decrypted_content: "[Decryption Error]" }; 
                    }
                }));
                setMessages(decryptedHistory);
            } catch (err) { console.error("History error:", err); }
        };
        loadHistory();
    }, [recipient, unlockedKey]); 

    // 2. WebSocket Logic with RAM Decryption
    useEffect(() => {
        if (!token || !currentUserId || !unlockedKey) return;
        const ws = new WebSocket(`ws://localhost:8000/chat/ws/${token}`);
        
        ws.onopen = () => {
            setSocket(ws);
            if (recipient && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
                setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
            }
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "typing") {
                if (data.sender_id === recipient?.id) {
                    setIsTyping(true);
                    setTimeout(() => setIsTyping(false), 3000);
                }
            } else if (data.encrypted_content) {
                if (recipient && (data.sender_id === recipient.id || data.sender_id === currentUserId)) {
                    try {
                        const plaintext = await decryptMessage({
                            ciphertext: data.encrypted_content,
                            encryptedAesKey: data.encrypted_key,
                            iv: data.iv
                        }, unlockedKey); // Use RAM key
                        
                        setMessages((prev) => [...prev, { ...data, decrypted_content: plaintext }]);
                        
                        if (data.sender_id === recipient.id) {
                            if (ws.readyState === 1) {
                                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
                            }
                            setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
                        }
                    } catch (e) { console.error("Live Decryption Error", e); }
                } else if (data.sender_id !== currentUserId) {
                    setUnreadCounts(prev => ({ ...prev, [data.sender_id]: (prev[data.sender_id] || 0) + 1 }));
                }
            }
        };
        return () => ws.close();
    }, [token, recipient, setUnreadCounts, currentUserId, unlockedKey]);

    // 3. Mark Read on Chat Switch
    useEffect(() => {
        if (recipient && socket?.readyState === 1) {
            socket.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
            setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
        }
    }, [recipient, socket, setUnreadCounts]);

    const sendMessage = (data) => { if (socket?.readyState === 1) socket.send(JSON.stringify(data)); };
    const sendTyping = () => { if (socket?.readyState === 1 && recipient) socket.send(JSON.stringify({ type: "typing", recipient_id: recipient.id })); };

    return { messages, sendMessage, sendTyping, isTyping };
};

export default useChat;