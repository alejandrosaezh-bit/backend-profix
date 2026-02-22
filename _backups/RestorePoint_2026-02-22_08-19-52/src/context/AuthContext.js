import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { api } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const res = await api.login(email, password);
            console.log("Login success:", res);
            setUserInfo(res);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(res));
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
            setUserInfo(res);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(res));
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
            setUserInfo(res);
            setUserToken(res.token);
            await AsyncStorage.setItem('userToken', res.token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(res));
        } catch (error) {
            console.error("Google Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            console.log("[AuthContext] Checking session...");
            let token = await AsyncStorage.getItem('userToken');
            let storedUserInfo = await AsyncStorage.getItem('userInfo');

            if (token) {
                console.log("[AuthContext] Token found, restoring user...");
                setUserToken(token);
                if (storedUserInfo) {
                    setUserInfo(JSON.parse(storedUserInfo));
                }

                // Intentar obtener datos frescos del backend (con timeout implícito si el login es lento)
                // Usamos un timeout manual aquí para no bloquear la app
                const fetchPromise = api.getMe();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout profile fetch')), 15000)
                );

                try {
                    const freshUser = await Promise.race([fetchPromise, timeoutPromise]);
                    setUserInfo(freshUser);
                    console.log("[AuthContext] Profile updated from backend:", freshUser.email);
                    await AsyncStorage.setItem('userInfo', JSON.stringify(freshUser));
                } catch (apiError) {
                    console.warn("[AuthContext] Error fetching fresh profile/timeout, using local:", apiError.message);
                    if (storedUserInfo) {
                        setUserInfo(JSON.parse(storedUserInfo));
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
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
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
