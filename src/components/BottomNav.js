import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles/globalStyles';

export default function BottomNav({
    view,
    userMode,
    isLoggedIn,
    counts,
    setView,
    loadRequests,
    setShowAuth,
    markAllProInteractionsAsRead
}) {
    const insets = useSafeAreaInsets();
    
    if (view === 'admin') return null;

    return (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 15) }]}>
            <TouchableOpacity style={styles.navItem} onPress={() => {
                if (view === 'home' && isLoggedIn) loadRequests();
                if (userMode === 'pro') markAllProInteractionsAsRead();
                setView('home');
            }}>
                {userMode === 'client' ? (
                    <Feather name="search" size={24} color={view === 'home' ? '#EA580C' : '#ccc'} />
                ) : (
                    <View>
                        <Feather name="home" size={24} color={view === 'home' ? '#2563EB' : '#ccc'} />
                        {counts.pro.updates > 0 && (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{counts.pro.updates}</Text>
                            </View>
                        )}
                    </View>
                )}
                <Text style={{ fontSize: 10, color: '#666' }}>
                    {userMode === 'client' ? 'Buscar' : 'Ofertas'}
                </Text>
            </TouchableOpacity>

            {userMode === 'client' && (
                <TouchableOpacity style={styles.navItem} onPress={() => {
                    if (!isLoggedIn) setShowAuth(true);
                    else {
                        if (view === 'my-requests' || view === 'request-detail-client') loadRequests();
                        setView('my-requests');
                    }
                }}>
                    <View>
                        <FontAwesome5 name="clipboard-list" size={24} color={view === 'my-requests' || view === 'request-detail-client' ? '#EA580C' : '#ccc'} />
                        {counts.client.updates > 0 && (
                            <View style={styles.badgeContainer}>
                                <Text style={styles.badgeText}>{counts.client.updates}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={{ fontSize: 10, color: '#666' }}>Solicitudes</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.navItem} onPress={() => {
                if (!isLoggedIn) setShowAuth(true);
                else {
                    if (view === 'chat-list' || view === 'chat-detail') loadRequests();
                    setView('chat-list');
                }
            }}>
                <View>
                    <Feather name="message-square" size={24} color={view === 'chat-list' || view === 'chat-detail' ? (userMode === 'client' ? '#EA580C' : '#2563EB') : '#ccc'} />
                    {(userMode === 'client' ? counts.client.chats : counts.pro.chats) > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{userMode === 'client' ? counts.client.chats : counts.pro.chats}</Text>
                        </View>
                    )}
                </View>
                <Text style={{ fontSize: 10, color: '#666' }}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => { if (!isLoggedIn) setShowAuth(true); else setView('profile'); }}>
                <Feather name="user" size={24} color={view === 'profile' ? (userMode === 'client' ? '#EA580C' : '#2563EB') : '#ccc'} />
                <Text style={{ fontSize: 10, color: '#666' }}>Perfil</Text>
            </TouchableOpacity>
        </View>
    );
}
