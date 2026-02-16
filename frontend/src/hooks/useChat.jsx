import { useState, useEffect, useRef, useCallback } from "react";
import { encryptForBoth, decryptMessage } from "../utils/crypto";
import { getPrivateKey } from "../utils/storage";

const useChat = (recipient) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    const myId = parseInt(localStorage.getItem("userId"));

    useEffect(() => {
        if (!recipient?.id) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = new WebSocket(
            `ws://localhost:8000/chat/ws/${token}`
        );

        socketRef.current = socket;

        socket.onopen = () => {
            setIsConnected(true);
        };

        socket.onclose = () => {
            setIsConnected(false);
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            // Only process messages relevant to this chat
            if (
                data.sender_id === recipient.id ||
                data.sender_id === myId
            ) {
                try {
                    const privateKey = await getPrivateKey();

                    const decrypted = await decryptMessage(
                        {
                            ciphertext: data.encrypted_content,
                            encryptedAesKey: data.encrypted_key,
                            iv: data.iv,
                        },
                        privateKey
                    );

                    setMessages((prev) => [
                        ...prev,
                        {
                            ...data,
                            content: decrypted,
                        },
                    ]);
                } catch (err) {
                    console.error("Decryption failed:", err);
                }
            }
        };

        return () => {
            socket.close();
        };
    }, [recipient]);

    const sendMessage = useCallback(
    async (text) => {
        if (!socketRef.current) return;
        if (socketRef.current.readyState !== WebSocket.OPEN) return;

        try {
            const senderPublicKey = localStorage.getItem("public_key");

            if (!senderPublicKey) {
                console.error("Sender public key missing");
                return;
            }

            const encryptedPackage = await encryptForBoth(
                text,
                recipient.public_key,
                senderPublicKey
            );

            socketRef.current.send(
                JSON.stringify({
                    recipient_id: recipient.id,
                    ciphertext: encryptedPackage.ciphertext,
                    encrypted_key_for_recipient:
                        encryptedPackage.encrypted_key_for_recipient,
                    encrypted_key_for_sender:
                        encryptedPackage.encrypted_key_for_sender,
                    iv: encryptedPackage.iv,
                })
            );
        } catch (err) {
            console.error("Encryption failed:", err);
        }
    },
    [recipient]
);


    return {
        messages,
        setMessages,
        sendMessage,
        isConnected,
    };
};

export default useChat;
