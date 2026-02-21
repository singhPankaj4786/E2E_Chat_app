import React, { useState, useEffect } from "react";
import { verifyContact } from "../../utils/storage";

const VerificationModal = ({ recipient, onVerified, onClose }) => {
    const [recipientNumber, setRecipientNumber] = useState("...");
    const [myNumber, setMyNumber] = useState("...");
    
    const myId = localStorage.getItem("userId");
    const myPublicKey = localStorage.getItem("public_key");

    // Simple Fingerprint Generator
    const getFingerprint = (key) => {
        if (!key) return "000000-000000";
        const sum = key.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return `${String(sum).padStart(6, '0')}-${String(sum % 1000).padStart(6, '0')}`;
    };

    useEffect(() => {
        // Calculate both fingerprints at once
        setRecipientNumber(getFingerprint(recipient.public_key));
        setMyNumber(getFingerprint(myPublicKey));
    }, [recipient, myPublicKey]);

    const handleVerify = async () => {
        await verifyContact(myId, recipient.id, recipient.public_key);
        onVerified();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Identity Verification</h3>
                <p className="text-sm text-gray-500 mb-8 text-center">
                    Compare these numbers with <b>{recipient.username}</b> to ensure your connection is secure.
                </p>
                
                {/* Recipient's Number (The primary one you are verifying) */}
                <div className="mb-6">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 block px-1">
                        {recipient.username}'s Security No.
                    </label>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
                        <span className="text-2xl font-mono font-black tracking-widest text-blue-700">
                            {recipientNumber}
                        </span>
                    </div>
                </div>

                {/* Your Own Number (For them to verify you) */}
                <div className="mb-10 opacity-70">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2 block px-1">
                        My Security No.
                    </label>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                        <span className="text-lg font-mono font-bold tracking-widest text-gray-600">
                            {myNumber}
                        </span>
                    </div>
                </div>

                <button 
                    onClick={handleVerify} 
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 mb-3 active:scale-95"
                >
                    Verify & Pin Contact
                </button>
                <button 
                    onClick={onClose} 
                    className="w-full text-gray-400 font-bold py-2 hover:text-gray-600 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default VerificationModal;