import { useState, useEffect, useCallback, useRef } from 'react';

const useChat = (recipientId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const myId = parseInt(localStorage.getItem('userId'));

    // src/hooks/useChat.jsx

useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !recipientId) return;

    const socket = new WebSocket(`ws://localhost:8000/chat/ws/${token}`);
    
    socket.onopen = () => {
        console.log("WS Connected");
        setIsConnected(true); // This changes "Connecting..." to "Online"
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Only append if it's from the person you are currently talking to
        if (data.sender_id === recipientId) {
            setMessages((prev) => [...prev, data]);
        }
    };

    socket.onclose = () => setIsConnected(false);
    socketRef.current = socket;

    return () => socket.close();
}, [recipientId]);

    const sendMessage = useCallback((payload) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(payload));
        }
    }, []);

    return { messages, setMessages, sendMessage, isConnected };
};

export default useChat;