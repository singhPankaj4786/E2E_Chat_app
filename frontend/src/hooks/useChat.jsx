import { useState, useEffect } from 'react';
import api from '../api/axios';
import { decryptMessage } from '../utils/crypto';
import { useKeyVault } from '../context/KeyContext';

const useChat = (recipient, setUnreadCounts, onSecurityAlert, bumpUserToTop) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId"));
    const { unlockedKey } = useKeyVault();

    // 1. Fetch History & Decrypt
    useEffect(() => {
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
                        }, unlockedKey);
                        return { ...msg, decrypted_content: plaintext };
                    } catch (e) { return { ...msg, decrypted_content: "[Decryption Error]" }; }
                }));
                setMessages(decryptedHistory);
            } catch (err) { console.error("History error:", err); }
        };
        loadHistory();
    }, [recipient?.id, unlockedKey]);

    // 2. Clear Unread Counts on Recipient Change (Immediate UI Update)
    useEffect(() => {
        if (recipient?.id) {
            // Clear local state immediately for snappy UI
            setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
            
            // Send WebSocket signal if socket is alive
            if (socket?.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
            }
        }
    }, [recipient?.id, socket, setUnreadCounts]);

    // 3. WebSocket Logic
    useEffect(() => {
        if (!token || !currentUserId || !unlockedKey) return;
        let wsBase = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
        
        // If the app is on HTTPS, we MUST use WSS
        if (window.location.protocol === 'https:' && wsBase.startsWith('ws:')) {
            wsBase = wsBase.replace('ws:', 'wss:');
        }

        const ws = new WebSocket(`${wsBase}/chat/ws/${token}`);
        ws.onopen = () => {
            setSocket(ws);
            if (recipient?.id) {
                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
            }
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "identity_change") {
                onSecurityAlert(data.user_id, data.new_public_key);
                return;
            }

            if (data.type === "typing" && data.sender_id === recipient?.id) {
                setIsTyping(true);
                setTimeout(() => setIsTyping(false), 3000);
            } 
            else if (data.encrypted_content) {
                // Update Sidebar Position
                if (bumpUserToTop) {
                    const affectedId = data.sender_id === currentUserId ? data.recipient_id : data.sender_id;
                    bumpUserToTop(affectedId);
                }

                // If message is for/from current active chat
                if (recipient && (data.sender_id === recipient.id || data.sender_id === currentUserId)) {
                    try {
                        const plaintext = await decryptMessage({
                            ciphertext: data.encrypted_content,
                            encryptedAesKey: data.encrypted_key,
                            iv: data.iv
                        }, unlockedKey);
                        setMessages((prev) => [...prev, { ...data, decrypted_content: plaintext }]);
                        
                        // If it's an incoming message in the active window, clear count
                        if (data.sender_id === recipient.id) {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: "mark_read", sender_id: recipient.id }));
                            }
                            setUnreadCounts(prev => ({ ...prev, [recipient.id]: 0 }));
                        }
                    } catch (e) { console.error("Live Decryption Error", e); }
                } else if (data.sender_id !== currentUserId) {
                    // Update unread badge for other users
                    setUnreadCounts(prev => ({ ...prev, [data.sender_id]: (prev[data.sender_id] || 0) + 1 }));
                }
            }
        };

        return () => ws.close();
    }, [token, recipient?.id, currentUserId, unlockedKey, onSecurityAlert, bumpUserToTop, setUnreadCounts]);

    const sendMessage = (data) => { 
        if (socket?.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
            if (bumpUserToTop && recipient) bumpUserToTop(recipient.id);
        } 
    };

    const sendTyping = () => { 
        if (socket?.readyState === WebSocket.OPEN && recipient) {
            socket.send(JSON.stringify({ type: "typing", recipient_id: recipient.id })); 
        }
    };

    return { messages, sendMessage, sendTyping, isTyping };
};

export default useChat;