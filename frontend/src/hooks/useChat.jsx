import { useEffect, useState } from 'react';


export const useChat = (token) => {
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!token) return;

        const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/chat/ws/${token}`;
        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            const incoming = JSON.parse(event.data);
            setMessages((prev) => [...prev, incoming]);
        };

        setSocket(ws);

        return () => ws.close();
    }, [token]);

    const sendMessage = (recipientId, encryptedContent) => {
        if (socket) {
            socket.send(JSON.stringify({
                recipient_id: recipientId,
                encrypted_content: encryptedContent
            }));
        }
    };

    return { messages, sendMessage };
};