import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { clearSession, getSession, saveSession } from '../utils/session';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const saveUserInfo = async (data) => {
        setUserInfo(data);
        await saveSession(data);
    };

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await api.login(email, password);
            console.log("Login success:", res);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await saveUserInfo(res);
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (name, email, password, phone, cedula, role = 'client') => {
        setIsLoading(true);
        try {
            const res = await api.register({ name, email, password, phone, cedula, role });
            console.log("Register success:", res);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await saveUserInfo(res);
        } catch (error) {
            console.error("Register error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = async (googleUser) => {
        setIsLoading(true);
        try {
            const res = await api.googleLogin(googleUser);
            console.log("Google Login success:", res.email);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await saveUserInfo(res);
        } catch (error) {
            console.error("Google Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await AsyncStorage.removeItem('userToken');
            await clearSession();
            console.log("[AuthContext] Session cleared successfully.");
        } catch (error) {
            console.error("[AuthContext] Error during logout storage cleanup:", error);
        } finally {
            setUserToken(null);
            setUserInfo(null);
            setIsLoading(false);
        }
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            console.log("[AuthContext] Checking session...");
            let token = await AsyncStorage.getItem('userToken');

            if (token) {
                console.log("[AuthContext] Token found, restoring user...");
                setUserToken(token);

                let storedUserInfo = await getSession();
                if (storedUserInfo) {
                    setUserInfo(storedUserInfo);
                }

                // Intentar obtener datos frescos del backend (con timeout implícito si el login es lento)
                // Usamos un timeout manual aquí para no bloquear la app
                const fetchPromise = api.getMe();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout profile fetch')), 15000)
                );

                try {
                    const freshUser = await Promise.race([fetchPromise, timeoutPromise]);
                    console.log("[AuthContext] Profile updated from backend:", freshUser.email);
                    await saveUserInfo(freshUser);
                } catch (apiError) {
                    console.log("[AuthContext] Error fetching fresh profile/timeout, using local:", apiError.message);
                    if (apiError.message === 'Unauthorized') {
                        console.log("[AuthContext] Token is invalid, logging out automatically...");
                        setUserToken(null);
                        setUserInfo(null);
                        await AsyncStorage.removeItem('userToken');
                        await clearSession();
                    }
                }
            } else {
                console.log("[AuthContext] No session found.");
                setUserToken(null);
                setUserInfo(null);
            }
        } catch (error) {
            console.error("[AuthContext] isLoggedIn overall error:", error);
        } finally {
            console.log("[AuthContext] isLoggedIn finished, setting isLoading to false.");
            setIsLoading(false);
        }
    };

    const updateUser = async (user) => {
        setUserInfo(user);
        await saveSession(user);
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, register, googleLogin, logout, updateUser, isLoading, userToken, userInfo }}>
            {children}
        </AuthContext.Provider>
    );
};
