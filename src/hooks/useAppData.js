import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useSocket } from '../context/SocketContext';
import { api } from '../utils/api';
import { areIdsEqual } from '../utils/helpers';
import { registerForPushNotificationsAsync } from '../utils/push';
import { getChats, getRequests, setChats, setRequests } from '../utils/requests';

export function useAppData({ isLoggedIn, currentUser, userMode, view }) {
    const { socket } = useSocket();

    const [allRequests, setAllRequests] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [counts, setCounts] = useState({ client: { chats: 0, updates: 0 }, pro: { chats: 0, updates: 0 } });

    // --- FUNCTION: RESTORE CACHE AHEAD OF NETWORK ---
    useEffect(() => {
        const restoreCache = async () => {
            try {
                const cached = await getRequests();
                if (cached && cached.length > 0) {
                    setAllRequests(prev => prev.length === 0 ? cached : prev);
                }

                const cachedChats = await getChats();
                if (cachedChats && cachedChats.length > 0) {
                    setAllChats(prev => prev.length === 0 ? cachedChats : prev);
                }
            } catch (e) {
                console.warn("[useAppData] Error restoring offline cache:", e);
            }
        };
        restoreCache();
    }, []);

    // --- FUNCTION: LOAD CHATS ---
    const loadChats = useCallback(async (explicitMode = null) => {
        if (!isLoggedIn) return;
        try {
            const targetMode = explicitMode || userMode;
            const chats = await api.getChats({ role: targetMode });
            if (Array.isArray(chats)) {
                setAllChats(chats);
                setChats(chats).catch(e => console.warn('Failed to cache chats', e));
            }
        } catch (e) {
            console.warn("[useAppData] Error loading chats:", e);
        }
    }, [isLoggedIn, userMode]);

    // --- FUNCTION: LOAD REQUESTS ---
    const loadRequests = useCallback(async (explicitMode = null) => {
        try {
            const targetMode = explicitMode || userMode;
            const currentUserId = currentUser?._id || currentUser?.id;

            let jobs = [];
            if (targetMode === 'pro') {
                let marketJobs = [];
                let myJobs = [];

                try {
                    const fetchMarket = api.getJobs();
                    const fetchMy = isLoggedIn ? api.getMyJobs({ role: 'pro' }) : Promise.resolve([]);

                    const [marketResult, myResult] = await Promise.allSettled([fetchMarket, fetchMy]);

                    if (marketResult.status === 'fulfilled') marketJobs = marketResult.value || [];
                    else console.warn("[loadRequests] Failed to fetch market jobs:", marketResult.reason);

                    if (myResult.status === 'fulfilled') myJobs = myResult.value || [];
                    else console.warn("[loadRequests] Failed to fetch my pro jobs:", myResult.reason);
                } catch (err) {
                    console.warn("[loadRequests] Parallel fetch failed:", err);
                }

                const myJobsTagged = myJobs.map(j => {
                    const cVal = j.client;
                    const cId = (cVal && typeof cVal === 'object') ? cVal._id : cVal;
                    const isCreator = areIdsEqual(cId, currentUserId);
                    return { ...j, _isMyClientJob: isCreator };
                });

                const jobMap = new Map();
                marketJobs.forEach(j => jobMap.set(j._id, j));
                myJobsTagged.forEach(j => jobMap.set(j._id, j));

                jobs = Array.from(jobMap.values());
            } else {
                const allData = isLoggedIn ? await api.getMyJobs({ role: 'client' }) : await api.getJobs();
                if (isLoggedIn && currentUser && allData.length > 0) {
                    jobs = allData;
                    console.log(`[useAppData] Loaded from API (Client). Job 0 status: ${jobs[0].calculatedClientStatus}, title: ${jobs[0].title}`);
                } else {
                    jobs = allData;
                }
            }

            const mappedJobs = jobs.map(job => {
                let catObj = { name: 'General' };
                if (job.category && typeof job.category === 'object') {
                    catObj = {
                        _id: job.category._id,
                        name: job.category.name,
                        color: job.category.color,
                        icon: job.category.icon
                    };
                } else if (typeof job.category === 'string') {
                    catObj = { name: job.category };
                }

                return {
                    id: job._id,
                    _id: job._id,
                    title: job.title,
                    description: job.description,
                    category: catObj,
                    subcategory: typeof job.subcategory === 'object' ? job.subcategory.name : job.subcategory,
                    location: job.location,
                    status: (job.status === 'active' || job.status === 'open') ? 'Abierto' :
                        (job.status === 'rated' || job.status === 'VALORACIÓN') ? 'TERMINADO' :
                            (job.status === 'completed' ? 'Culminada' :
                                (job.status === 'canceled' ? 'Cerrada' :
                                    (job.status === 'in_progress' ? 'En Ejecución' : job.status))),
                    budget: job.budget,
                    images: job.images,
                    createdAt: job.createdAt,
                    clientName: job.client?.name || 'Usuario',
                    clientEmail: job.client?.email,
                    clientAvatar: job.client?.avatar,
                    clientId: job.client?._id || job.clientId || job.client,
                    professional: job.professional,
                    trackingStatus: job.trackingStatus || 'none',
                    workStartedOnTime: job.workStartedOnTime,
                    workPhotos: job.workPhotos || [],
                    clientFinished: job.clientFinished,
                    proFinished: job.proFinished,
                    clientRated: job.clientRated || false,
                    proRated: job.proRated || false,
                    proInteractionStatus: job.proInteractionStatus || 'new',
                    proInteractionHasUnread: job.proInteractionHasUnread || false,
                    isVirtual: job.isVirtual,
                    _isMyClientJob: job._isMyClientJob || false,
                    projectHistory: job.projectHistory || [],
                    clientManagement: job.clientManagement || {},
                    conversations: job.conversations || [],
                    _myOfferStatus: currentUserId ? job.offers?.find(o => {
                        const pId = o.proId?._id || o.proId;
                        return areIdsEqual(pId, currentUserId);
                    })?.status : undefined,
                    offers: job.offers?.map(o => ({
                        ...o,
                        proId: o.proId?._id || o.proId,
                        proName: o.proId?.name || 'Profesional',
                        proImage: o.proId?.avatar,
                        proRating: o.proId?.rating || 5.0,
                        proReviewsCount: o.proId?.reviewsCount || 0
                    })) || [],
                    calculatedClientStatus: job.calculatedClientStatus,
                    calculatedProStatus: job.calculatedProStatus
                };
            });

            if (mappedJobs.length > 0) {
                console.log(`[useAppData] mappedJobs Job 0 status: ${mappedJobs[0].calculatedClientStatus}, title: ${mappedJobs[0].title}`);
            }

            mappedJobs.sort((a, b) => {
                const isClosedA = a.status === 'Culminada' || a.status === 'Cerrada' || a.status === 'TERMINADO';
                const isClosedB = b.status === 'Culminada' || b.status === 'Cerrada' || b.status === 'TERMINADO';

                if (isClosedA !== isClosedB) {
                    return isClosedA ? 1 : -1;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            const stripHeavyData = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(stripHeavyData);

                const newObj = { ...obj };
                ['images', 'workPhotos', 'gallery', 'projectHistory', 'clientManagement'].forEach(key => {
                    if (key in newObj) {
                        if (key === 'images' || key === 'workPhotos' || key === 'gallery' || key === 'projectHistory') {
                            newObj[key] = [];
                        } else {
                            newObj[key] = null;
                        }
                    }
                });

                ['client', 'professional', 'proId', 'offers'].forEach(key => {
                    if (newObj[key]) newObj[key] = stripHeavyData(newObj[key]);
                });

                return newObj;
            };

            const lightweightJobs = stripHeavyData(mappedJobs);

            try {
                await setRequests(lightweightJobs);
            } catch (err) {
                console.warn("[useAppData] Failed to save lightweight jobs", err);
            }

            setAllRequests(mappedJobs);
            return mappedJobs;
        } catch (e) {
            console.warn('Error cargando solicitudes desde API:', e);
            return [];
        }
    }, [isLoggedIn, currentUser, userMode]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadRequests(), loadChats()]);
        setRefreshing(false);
    }, [loadRequests, loadChats]);

    // --- EFECTOS DE CARGA (Initial & Polling) ---
    const lastLoadedViewRef = useRef(null);

    useEffect(() => {
        if (!isLoggedIn) return;

        const isMainView = ['home', 'my-requests', 'chat-list', 'professional-profile', 'admin'].includes(view);
        const shouldLoadData = isMainView && (lastLoadedViewRef.current !== view);

        if (shouldLoadData) {
            const initLoad = async () => {
                lastLoadedViewRef.current = view;
                setRefreshing(true);
                try {
                    await Promise.all([loadRequests(), loadChats()]);
                } catch (e) {
                    console.warn("Init load error:", e);
                } finally {
                    setRefreshing(false);
                }
            };
            initLoad();
        }

        let interval;
        const isFetchingRef = { current: false };

        if (isLoggedIn) {
            interval = setInterval(async () => {
                const isFormActive = ['create-request', 'service-form'].includes(view);
                if (!refreshing && !isFormActive && isMainView && !isFetchingRef.current) {
                    isFetchingRef.current = true;
                    try {
                        await Promise.all([loadRequests(), loadChats()]);
                    } catch (e) {
                        console.warn("[Polling] Refresh error:", e);
                    } finally {
                        isFetchingRef.current = false;
                    }
                }
            }, 45000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isLoggedIn, userMode, view, refreshing, loadRequests, loadChats]);

    // --- NOTIFICATIONS & SOCKET SETUP ---
    useEffect(() => {
        const setupNotifications = async () => {
            if (isLoggedIn && currentUser?._id) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    setTimeout(async () => {
                        try {
                            await api.updateProfile({ pushToken: token });
                            console.log("Push Token synced with backend.");
                        } catch (e) {
                            console.log("Error syncing push token:", e.message);
                        }
                    }, 1000);
                }

                if (socket) {
                    socket.emit('join_user_dates', currentUser._id);

                    socket.off('notification');
                    socket.on('notification', (data) => {
                        console.log("Socket Notification:", data);
                        if (Platform.OS !== 'web') {
                            Notifications.scheduleNotificationAsync({
                                content: {
                                    title: data.title,
                                    body: data.body,
                                    data: { jobId: data.jobId },
                                    sound: 'default'
                                },
                                trigger: null,
                            });
                        }

                        setCounts(prev => {
                            const isClient = userMode === 'client';
                            const type = isClient ? 'client' : 'pro';
                            return { ...prev, [type]: { ...prev[type], updates: prev[type].updates + 1 } };
                        });
                    });
                }
            }
        };

        setupNotifications();

        let bgSubscription;
        if (Platform.OS !== 'web') {
            bgSubscription = Notifications.addNotificationResponseReceivedListener(response => {
                const data = response.notification.request.content.data;
                if (data?.jobId) {
                    console.log("Notification tapped, navigating to job:", data.jobId);
                }
            });
        }

        return () => {
            if (socket) socket.off('notification');
            if (bgSubscription) bgSubscription.remove();
        };
    }, [isLoggedIn, currentUser, socket, userMode]);

    return {
        allRequests,
        setAllRequests,
        allChats,
        setAllChats,
        refreshing,
        setRefreshing,
        counts,
        setCounts,
        loadRequests,
        loadChats,
        onRefresh
    };
}
