import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { decryptMessage } from '../utils/crypto';
import { getPrivateKey } from '../utils/storage';

const useChat = (recipient, setUnreadCounts) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId"));

    // 1. Fetch History
    useEffect(() => {
        if (!recipient) return;
        const loadHistory = async () => {
            try {
                const privKey = await getPrivateKey();
                const res = await api.get(`/chat/history/${recipient.id}`);
                const decryptedHistory = await Promise.all(res.data.map(async (msg) => {
                    try {
                        const plaintext = await decryptMessage({
                            ciphertext: msg.encrypted_content,
                            encryptedAesKey: msg.encrypted_key, 
                            iv: msg.iv
                        }, privKey);
                        return { ...msg, decrypted_content: plaintext };
                    } catch (e) { return { ...msg, decrypted_content: "[Decryption Error]" }; }
                }));
                setMessages(decryptedHistory);
            } catch (err) { console.error("History error:", err); }
        };
        loadHistory();
    }, [recipient]);

    // 2. WebSocket Logic
    useEffect(() => {
        if (!token) return;
        const ws = new WebSocket(`ws://localhost:8000/chat/ws/${token}`);
        
        ws.onopen = () => {
            setSocket(ws);
            if (recipient && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
                // Immediately clear count locally when socket opens for this recipient
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
                        const privKey = await getPrivateKey();
                        const plaintext = await decryptMessage({
                            ciphertext: data.encrypted_content,
                            encryptedAesKey: data.encrypted_key,
                            iv: data.iv
                        }, privKey);
                        
                        setMessages((prev) => [...prev, { ...data, decrypted_content: plaintext }]);
                        
                        // If we received a message in the active chat, mark as read
                        if (data.sender_id === recipient.id) {
                            if (ws.readyState === 1) {
                                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
                            }
                            // Also ensure the local count stays at 0 for the active chat
                            setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
                        }
                    } catch (e) { console.error("Live Decryption Error", e); }
                } else if (data.sender_id !== currentUserId) {
                    // Update count only for background chats
                    setUnreadCounts(prev => ({ ...prev, [data.sender_id]: (prev[data.sender_id] || 0) + 1 }));
                }
            }
        };
        return () => ws.close();
    }, [token, recipient, setUnreadCounts, currentUserId]);

    // 3. Clear unread locally when switching chats
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