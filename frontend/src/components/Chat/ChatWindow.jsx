import React, { useState, useEffect, useRef } from "react";
import useChat from "../../hooks/useChat";
import api from "../../api/axios";
import { decryptMessage } from "../../utils/crypto";
import { getPrivateKey } from "../../utils/storage";

const ChatWindow = ({ recipient, onlineUsers }) => {
  const [newMessage, setNewMessage] = useState("");
  const {
    messages,
    setMessages,
    sendMessage,
    isConnected,
    isTyping,
    sendTyping,
  } = useChat(recipient);

  const scrollRef = useRef(null);
  const myId = parseInt(localStorage.getItem("userId"));

  // 🔐 Load & decrypt history
  useEffect(() => {
    if (!recipient?.id) return;

    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${recipient.id}`);
        const privateKey = await getPrivateKey();
        if (!privateKey) return;

        const decryptedMessages = await Promise.all(
          res.data.map(async (msg) => {
            try {
              const decryptedText = await decryptMessage(
                {
                  ciphertext: msg.encrypted_content,
                  encryptedAesKey: msg.encrypted_key,
                  iv: msg.iv,
                },
                privateKey
              );

              return { ...msg, content: decryptedText };
            } catch {
              return null;
            }
          })
        );

        setMessages(decryptedMessages.filter(Boolean));
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };

    loadHistory();
  }, [recipient]);

  // 🔄 Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 📤 Send message
  const onSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;
    await sendMessage(newMessage);
    setNewMessage("");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUserOnline = onlineUsers?.[recipient.id];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
          {recipient.username[0].toUpperCase()}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            {recipient.username}
          </h2>

          <p
            className={`text-xs font-medium ${
              isTyping
                ? "text-blue-500"
                : isUserOnline
                ? "text-green-500"
                : "text-gray-400"
            }`}
          >
            {isTyping
              ? "Typing..."
              : isUserOnline
              ? "● Online"
              : "○ Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === myId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[65%] px-3 py-2 rounded-2xl shadow-sm ${
                msg.sender_id === myId
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>

              <div className="text-[10px] mt-1 text-right opacity-60">
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={onSend} className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              sendTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
