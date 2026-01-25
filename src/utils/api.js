import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración de API
// URL de Producción (Render)
const PROD_URL = 'https://profix-backend-h56b.onrender.com/api';

// Configuración de IP dinámica (Desarrollo Local)
// Si necesitas trabajar con el backend localmente, cambia USE_LOCAL a true
const LOCAL_IP = '192.168.1.172'; // IMPORTANTE: Verifica tu IP con `ipconfig` en Windows
const USE_LOCAL = __DEV__; // Automáticamente false en Producción/APK, true en desarrollo

const API_URL = !USE_LOCAL
    ? PROD_URL
    : Platform.select({
        android: `http://${LOCAL_IP}:5000/api`,
        ios: `http://${LOCAL_IP}:5000/api`,
        web: (typeof window !== 'undefined' && window.location) ? `http://${window.location.hostname}:5000/api` : `http://${LOCAL_IP}:5000/api`,
        default: `http://${LOCAL_IP}:5000/api`
    });

console.log(`[API] Using API_URL: ${API_URL}`);

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

const fetchWithTimeout = async (url, options = {}, timeout = 12000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

export const api = {
    // --- AUTENTICACIÓN ---
    login: async (email, password) => {
        const res = await fetchWithTimeout(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error al iniciar sesión');
        }
        return res.json();
    },
    register: async (userData) => {
        const res = await fetchWithTimeout(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error en el registro');
        }
        return res.json();
    },
    googleLogin: async (googleData) => {
        const res = await fetchWithTimeout(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(googleData)
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error en Google Login');
        }
        return res.json();
    },
    getMe: async () => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/auth/me`, { headers });
        if (!res.ok) throw new Error('Error fetching profile');
        return res.json();
    },

    // --- TRABAJOS (JOBS) ---
    createJob: async (jobData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(jobData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || 'Error creando solicitud');
            } catch (e) {
                // If parsing fails or we just caught the throw above
                if (e.message && e.message !== 'Unexpected token' && !e.message.includes('JSON')) throw e;
                throw new Error(`Error del servidor: ${res.status}`);
            }
        }
        return res.json();
    },
    addJobImage: async (jobId, image) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/images`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ image })
        });
        if (!res.ok) throw new Error('Error adding image to job');
        return res.json();
    },
    updateJob: async (jobId, jobData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(jobData)
        });
        if (!res.ok) throw new Error('Error updating job');
        return res.json();
    },
    getJob: async (id) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${id}`, { headers });
        if (!res.ok) throw new Error('Error fetching job details');
        return res.json();
    },
    deleteJob: async (jobId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) {
            const errorText = await res.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `Error deleting job (${res.status})`);
            } catch (e) {
                if (e.message && e.message.includes('Error deleting job')) throw e;
                throw new Error(`Error deleting job: ${errorText} (${res.status})`);
            }
        }
        return res.json();
    },
    deleteOffer: async (jobId, offerId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/offers/${offerId}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error('Error deleting offer');
        return res.json();
    },
    updateJobInteraction: async (id, status) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${id}/interaction`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Error updating interaction status');
        return res.json();
    },
    addTimelineEvent: async (jobId, eventData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/timeline`, {
            method: 'POST',
            headers,
            body: JSON.stringify(eventData)
        });
        if (!res.ok) throw new Error('Error adding timeline event');
        return res.json();
    },
    getJobs: async (filters = {}) => {
        const headers = await getHeaders();
        // Convert filters to query string if needed
        const queryString = new URLSearchParams(filters).toString();
        const res = await fetchWithTimeout(`${API_URL}/jobs?${queryString}`, { headers });
        return res.json();
    },
    getMyJobs: async (filters = {}) => {
        const headers = await getHeaders();
        const queryString = Object.keys(filters).length ? `?${new URLSearchParams(filters).toString()}` : '';
        const res = await fetchWithTimeout(`${API_URL}/jobs/me${queryString}`, { headers });
        if (!res.ok) throw new Error('Error fetching my jobs');
        return res.json();
    },
    createOffer: async (jobId, offerData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/offers`, {
            method: 'POST',
            headers,
            body: JSON.stringify(offerData)
        });
        if (!res.ok) {
            const errorText = await res.text();
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || 'Error creating offer');
            } catch (e) {
                if (e.message && !e.message.includes('JSON')) throw e;
                throw new Error(`Error del servidor: ${res.status}`);
            }
        }
        return res.json();
    },
    updateOffer: async (jobId, offerData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/offers`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(offerData)
        });
        if (!res.ok) throw new Error('Error updating offer');
        return res.json();
    },
    assignJob: async (jobId, professionalId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/assign`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ professionalId })
        });
        if (!res.ok) throw new Error('Error assigning job');
        return res.json();
    },
    rateJob: async (jobId, rating, review) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/rate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ rating, review })
        });
        if (!res.ok) throw new Error('Error rating job');
        return res.json();
    },
    finishJob: async (jobId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/finish`, {
            method: 'PUT',
            headers
        });
        if (!res.ok) throw new Error('Error finishing job');
        return res.json();
    },

    // --- CHATS ---
    getChats: async (filters = {}) => {
        const headers = await getHeaders();
        const queryString = Object.keys(filters).length ? `?${new URLSearchParams(filters).toString()}` : '';
        const res = await fetchWithTimeout(`${API_URL}/chats${queryString}`, { headers });
        if (!res.ok) throw new Error('Error fetching chats');
        return res.json();
    },
    getChatDetails: async (chatId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/chats/${chatId}`, { headers });
        if (!res.ok) throw new Error('Error fetching chat details');
        return res.json();
    },
    createChat: async (targetUserId, jobId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/chats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ targetUserId, jobId })
        });
        if (!res.ok) throw new Error('Error creating chat');
        return res.json();
    },
    sendMessage: async (chatId, content, media = null) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/chats/${chatId}/messages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ content, media })
        });
        if (!res.ok) throw new Error('Error sending message');
        return res.json();
    },
    markChatAsRead: async (chatId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/chats/${chatId}/read`, {
            method: 'PUT',
            headers
        });
        if (!res.ok) throw new Error('Error marking chat as read');
        return res.json();
    },

    markInteractionAsRead: async (jobId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/interaction/read`, {
            method: 'PUT',
            headers
        });
        return res.json();
    },

    rejectOffer: async (jobId, proId, reason) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/offers/${proId}/reject`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ reason })
        });
        return res.json();
    },

    closeJob: async (jobId, closureData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/close`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(closureData)
        });
        if (!res.ok) throw new Error('Error al cerrar la solicitud');
        return res.json();
    },

    confirmStart: async (jobId, startedOnTime) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/start-confirm`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ startedOnTime })
        });
        return res.json();
    },

    uploadWorkPhoto: async (jobId, image) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/work-photos`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ image })
        });
        return res.json();
    },

    finishJobByStatus: async (jobId) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/finish`, {
            method: 'PUT',
            headers
        });
        return res.json();
    },

    rateMutual: async (jobId, reviewData) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/jobs/${jobId}/rate-mutual`, {
            method: 'POST',
            headers,
            body: JSON.stringify(reviewData)
        });
        return res.json();
    },

    // --- ADMIN: USUARIOS ---
    getUsers: async () => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users`);
        return res.json();
    },
    getPendingUsers: async () => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users/pending`);
        return res.json();
    },
    verifyUser: async (id) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users/verify/${id}`, { method: 'PUT' });
        return res.json();
    },
    updateUserRating: async (id, rating) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users/${id}/rating`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating })
        });
        return res.json();
    },
    adminGetUser: async (id) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users/${id}`);
        if (!res.ok) throw new Error('Error fetching user details');
        return res.json();
    },
    adminUpdateUser: async (id, data) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error updating user');
        return res.json();
    },
    adminGetChats: async () => {
        const res = await fetchWithTimeout(`${API_URL}/admin/chats`);
        if (!res.ok) throw new Error('Error fetching admin chats');
        return res.json();
    },
    adminGetChatDetails: async (id) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/chats/${id}`);
        if (!res.ok) throw new Error('Error fetching admin chat details');
        return res.json();
    },
    adminGetJobs: async () => {
        const res = await fetchWithTimeout(`${API_URL}/admin/jobs`);
        if (!res.ok) throw new Error('Error fetching admin jobs');
        return res.json();
    },
    adminGetJobDetails: async (id) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/jobs/${id}`);
        if (!res.ok) throw new Error('Error fetching admin job details');
        return res.json();
    },
    adminUpdateJob: async (id, data) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/jobs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Error updating job');
        return res.json();
    },
    adminGetChatsByJob: async (jobId) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/chats/job/${jobId}`);
        return res.json();
    },
    updateProfile: async (userData) => {
        const headers = await getHeaders();
        const bodyStr = JSON.stringify(userData);
        console.log(`[api.updateProfile] Sending PUT /profile. Payload size: ${bodyStr.length} bytes`);
        if (userData.avatar) console.log("[api.updateProfile] Avatar present in payload. Length:", userData.avatar.length);

        const res = await fetchWithTimeout(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers,
            body: bodyStr
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error("updateProfile error response:", errorText);
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || 'Error updating profile');
            } catch (e) {
                throw new Error(errorText || 'Error updating profile');
            }
        }
        return res.json();
    },
    togglePortfolioItem: async (mediaUrl, category) => {
        const headers = await getHeaders();
        const res = await fetchWithTimeout(`${API_URL}/auth/portfolio`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ mediaUrl, category })
        });
        if (!res.ok) throw new Error('Error toggling portfolio item');
        return res.json();
    },
    getProfessionalReviews: async (proId) => {
        const res = await fetchWithTimeout(`${API_URL}/professionals/${proId}/reviews`);
        if (!res.ok) throw new Error('Error fetching reviews');
        return res.json();
    },
    getClientReviews: async (clientId) => {
        const res = await fetchWithTimeout(`${API_URL}/users/${clientId}/reviews`);
        if (!res.ok) throw new Error('Error fetching client reviews');
        return res.json();
    },

    // --- ADMIN: CATEGORÍAS ---
    createCategory: async (data) => {
        try {
            const res = await fetchWithTimeout(`${API_URL}/admin/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Error ${res.status}: ${text}`);
            }
            return res.json();
        } catch (error) {
            console.error("Error createCategory:", error);
            throw error;
        }
    },
    updateCategory: async (id, data) => {
        try {
            const res = await fetchWithTimeout(`${API_URL}/admin/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            return res.json();
        } catch (error) {
            console.error("Error updateCategory:", error);
            throw error;
        }
    },
    deleteCategory: async (id) => {
        try {
            const res = await fetchWithTimeout(`${API_URL}/admin/categories/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`Error ${res.status}`);
            return res.json();
        } catch (error) {
            console.error("Error deleteCategory:", error);
            throw error;
        }
    },

    // --- ADMIN: ARTÍCULOS ---
    createArticle: async (data) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // --- ADMIN: NEGOCIOS ---
    createBusiness: async (data) => {
        const res = await fetchWithTimeout(`${API_URL}/admin/businesses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // --- PÚBLICO: DATOS APP ---
    getCategories: async () => {
        const res = await fetchWithTimeout(`${API_URL}/categories`);
        if (!res.ok) throw new Error('Error fetching categories');
        return res.json();
    },
    getArticles: async () => {
        const res = await fetchWithTimeout(`${API_URL}/articles`);
        return res.json();
    },
    getBusinesses: async () => {
        const res = await fetchWithTimeout(`${API_URL}/businesses`);
        return res.json();
    }
};