import { useEffect, useState } from "react";

const usePresence = () => {
    const [onlineUsers, setOnlineUsers] = useState({});
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) return;

        const socket = new WebSocket(`ws://localhost:8000/presence/ws/${token}`);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "initial_state") {
                const initial = {};
                data.online_users.forEach(id => {
                    initial[id] = true;
                });
                setOnlineUsers(initial);
            }

            if (data.type === "status_change") {
                setOnlineUsers(prev => ({
                    ...prev,
                    [data.user_id]: data.status === "online"
                }));
            }
        };

        return () => {
            socket.close();
        };

    }, [token]);

    return onlineUsers;
};

export default usePresence;
