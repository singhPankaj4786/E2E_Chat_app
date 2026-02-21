Gemini said
This README provides a professional overview of your project, highlighting the sophisticated tech stack and the End-to-End Encryption (E2EE) logic you've implemented.

SecureChat: End-to-End Encrypted Messaging
SecureChat is a high-performance, real-time messaging application designed with a security-first approach. Built using React and FastAPI, it leverages WebSockets for instant communication and RSA/AES encryption to ensure that messages remain private—even from the server.

🚀 Key Features
End-to-End Encryption (E2EE): Messages are encrypted on the sender's device and decrypted only on the recipient's device.

Secure Key Vault: RSA private keys are stored in the browser's IndexedDB and unlocked only via a local password hash.

Real-Time Messaging: Instant message delivery and typing indicators powered by WebSockets.

WhatsApp-Style Interface: Automated sidebar sorting that moves active chats to the top and tracks unread message counts.

Identity Verification: A "Security Number" system (12-digit fingerprint) to verify recipient identities and detect "Man-in-the-Middle" or identity resets.

Presence Tracking: Live status indicators showing when contacts are "Active Now" or "Offline".

🛠️ Tech Stack
Frontend
React.js: Component-based UI architecture.

Tailwind CSS: Modern, responsive styling.

Web Crypto API: Native browser-based cryptographic operations.

Backend
FastAPI: High-performance Python framework for APIs and WebSockets.

PostgreSQL: Relational database for storing encrypted content and user metadata.

OAuth2 & JWT: Secure authentication and session management.

🛡️ Security Architecture
Key Generation: Upon registration or identity reset, a unique RSA-2048 key pair is generated.

Message Encryption: Each message is encrypted with a symmetric AES-256 key, which is then wrapped with the recipient's RSA public key.

Zero-Knowledge Storage: The server only stores ciphertexts; it never has access to the user's private keys or decrypted messages.
