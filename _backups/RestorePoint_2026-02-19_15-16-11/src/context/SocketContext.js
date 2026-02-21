import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_URL } from '../utils/api';
import { AuthContext } from './AuthContext';

// Extract base URL from API_URL (remove /api)
const SOCKET_URL = API_URL.replace('/api', '');

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { userInfo } = useContext(AuthContext);

    useEffect(() => {
        let newSocket;
        if (userInfo) {
            console.log("Initializing Socket.io connection to:", SOCKET_URL);
            newSocket = io(SOCKET_URL, {
                transports: ['websocket'],
                jsonp: false
            });

            newSocket.on('connect', () => {
                console.log("Socket connected:", newSocket.id);
            });

            newSocket.on('connect_error', (err) => {
                console.log("Socket connection error:", err);
            });

            setSocket(newSocket);
        } else {
            if (socket) {
                console.log("Disconnecting socket (no user)");
                socket.disconnect();
                setSocket(null);
            }
        }

        return () => {
            if (newSocket) newSocket.disconnect();
        };
    }, [userInfo]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
