import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';
import { ICON_CATEGORIES, ALL_ICONS_FLAT, DynamicAppIcon, getIconData } from '../constants/icons';
import { Image as ExpoImage } from 'expo-image';



const IconPickerModal = ({ visible, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <Modal visible={visible} transparent={false} animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'android' ? 35 : 50 }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B' }}>Seleccionar Ícono</Text>
                        <Text style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Elige un ícono de la biblioteca</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={{ padding: 8, backgroundColor: '#FEE2E2', borderRadius: 20 }}>
                        <Feather name="x" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1' }}>
                        <Feather name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
                        <TextInput
                            style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#1E293B' }}
                            placeholder="Buscar ícono por nombre..."
                            placeholderTextColor="#94A3B8"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchTerm.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchTerm('')} style={{ padding: 4 }}>
                                <Feather name="x-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Icons Grid */}
                <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                    {Object.entries(ICON_CATEGORIES).map(([category, icons]) => {
                        const filteredIcons = icons.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
                        if (filteredIcons.length === 0) return null;

                        return (
                            <View key={category} style={{ marginBottom: 24, marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{ width: 4, height: 18, backgroundColor: '#EA580C', borderRadius: 2, marginRight: 8 }} />
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>
                                        {category}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>({filteredIcons.length})</Text>
                                </View>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                                    {filteredIcons.map((icon, idx) => {
                                        const IconLib = icon.lib;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={{
                                                    width: 52,
                                                    height: 52,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: '#F8FAFC',
                                                    borderRadius: 12,
                                                    borderWidth: 1.5,
                                                    borderColor: '#E2E8F0'
                                                }}
                                                activeOpacity={0.7}
                                                onPress={() => { onSelect(icon.name, icon.lib); onClose(); }}
                                            >
                                                <IconLib name={icon.name} size={24} color="#334155" />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                    <View style={{ height: 60 }} />
                </ScrollView>
            </View>
        </Modal>
    );
};

// Legacy support for existing code referencing AVAILABLE_ICONS
const AVAILABLE_ICONS = ALL_ICONS_FLAT.slice(0, 40);

export default function AdminScreens({ onBack, onLogout }) {
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, categories, articles, businesses

    // Global State for Requests Filter (Lifted State)
    const [categories, setCategories] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [requestFilter, setRequestFilter] = useState('Todas'); // 'Todas' or Category Name

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [catsData, jobsData] = await Promise.all([
                api.getCategories(),
                api.adminGetJobs()
            ]);
            setCategories(catsData);
            setJobs(jobsData);
        } catch (e) {
            console.log("Error loading admin data", e);
        }
    };

    // Derived Categories for Filter (Only those with active jobs)
    const activeJobCategories = categories.filter(c =>
        jobs.some(j => {
            const jCat = j.category?.name || j.category;
            return jCat === c.name;
        })
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <UsersManager />;
            case 'requests': return <RequestsManager jobs={jobs} categories={categories} filter={requestFilter} onRefresh={loadData} />;
            case 'categories': return <CategoriesManager />;
            case 'articles': return <ArticlesManager />;
            case 'businesses': return <BusinessesManager categories={categories} />;
            case 'messages': return <MessagesManager />;
            case 'iacondo': return <IacondoManager />;
            default: return <Dashboard setActiveTab={setActiveTab} />;
        }
    };

    return (
        <View style={styles.container}>
            {/* Custom Header for Requests vs Standard Header */}
            {activeTab === 'requests' ? (
                <View style={[styles.header, { flexDirection: 'column', alignItems: 'center', paddingTop: 40, paddingBottom: 15, height: 'auto' }]}>
                    <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15 }}>
                        <TouchableOpacity onPress={onBack} style={{ width: 40 }}>
                            <Feather name="arrow-left" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { fontSize: 18 }]}>Solicitudes</Text>
                        <TouchableOpacity onPress={onLogout} style={{ width: 40, alignItems: 'flex-end' }}>
                            <Feather name="log-out" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Dynamic Filter (Stacked) */}
                    <View style={{ height: 35 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8,
                                    backgroundColor: requestFilter === 'Todas' ? 'white' : 'rgba(255,255,255,0.2)'
                                }}
                                onPress={() => setRequestFilter('Todas')}
                            >
                                <Text style={{ color: requestFilter === 'Todas' ? '#1E293B' : 'white', fontSize: 12, fontWeight: 'bold' }}>Todas</Text>
                            </TouchableOpacity>
                            {activeJobCategories.map(c => (
                                <TouchableOpacity
                                    key={c._id}
                                    style={{
                                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8,
                                        backgroundColor: requestFilter === c.name ? 'white' : 'rgba(255,255,255,0.2)'
                                    }}
                                    onPress={() => setRequestFilter(c.name)}
                                >
                                    <Text style={{ color: requestFilter === c.name ? '#1E293B' : 'white', fontSize: 12, fontWeight: 'bold' }}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            ) : (
                <View style={[styles.header, { justifyContent: 'space-between', paddingHorizontal: 20 }]}>
                    <TouchableOpacity onPress={activeTab !== 'dashboard' ? () => setActiveTab('dashboard') : onBack} style={{ width: 30 }}>
                        <Feather name="arrow-left" size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {activeTab === 'iacondo' ? 'Integración IACONDO' : 'Panel de Control'}
                    </Text>
                    <TouchableOpacity onPress={onLogout}>
                        <Feather name="log-out" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.content}>
                {renderContent()}
            </View>
            {/* Bottom Nav for Admin */}
            <View style={styles.bottomNav}>
                <TabButton icon="grid" label="Inicio" active={activeTab === 'dashboard'} onPress={() => setActiveTab('dashboard')} />
                <TabButton icon="users" label="Usuarios" active={activeTab === 'users'} onPress={() => setActiveTab('users')} />
                <TabButton icon="message-circle" label="Solicitudes" active={activeTab === 'requests'} onPress={() => setActiveTab('requests')} />
                <TabButton icon="layers" label="Cats" active={activeTab === 'categories'} onPress={() => setActiveTab('categories')} />
                {/* Ocultamos Blog/Negocios para hacer espacio, o usamos scroll horizontal si son muchos */}
                <TabButton icon="briefcase" label="Negocios" active={activeTab === 'businesses'} onPress={() => setActiveTab('businesses')} />
            </View>
        </View>
    );
}

const TabButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', opacity: active ? 1 : 0.5 }}>
        <Feather name={icon} size={24} color={active ? '#2563EB' : '#6B7280'} />
        <Text style={{ fontSize: 10, color: active ? '#2563EB' : '#6B7280', marginTop: 2 }}>{label}</Text>
    </TouchableOpacity>
);

// --- SUB-COMPONENTES ---

const Dashboard = ({ setActiveTab }) => {
    const [stats, setStats] = useState({ pending: 0, totalUsers: 0 });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const users = await api.getUsers();
            const pending = users.filter(u => u.role === 'professional' && !u.isVerified).length;
            setStats({
                totalUsers: users.length,
                pending: pending
            });
        } catch (e) {
            console.log("Error loading dashboard stats", e);
        }
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.statNumber}>{stats.pending}</Text>
                    <Text style={styles.statLabel}>Verificaciones Pendientes</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={styles.statNumber}>{stats.totalUsers}</Text>
                    <Text style={styles.statLabel}>Usuarios Totales</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('articles')}>
                <Feather name="plus-circle" size={20} color="white" />
                <Text style={styles.actionText}>Publicar Artículo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EA580C' }]} onPress={() => setActiveTab('businesses')}>
                <Feather name="briefcase" size={20} color="white" />
                <Text style={styles.actionText}>Nuevo Anunciante</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#7C3AED' }]} onPress={() => setActiveTab('messages')}>
                <Feather name="message-square" size={20} color="white" />
                <Text style={styles.actionText}>Mensajes Rotativos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#0284C7' }]} onPress={() => setActiveTab('iacondo')}>
                <MaterialCommunityIcons name="home-city" size={20} color="white" />
                <Text style={styles.actionText}>Integración IACONDO</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const UsersManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); // Para ver detalles
    const [isEditing, setIsEditing] = useState(false);
    const [showInactive, setShowInactive] = useState(false); // New Filter State

    // Edit Form State
    const [editData, setEditData] = useState({});
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(u => {
        if (showInactive) return true; // Show everything
        return u.isActive !== false; // Hide inactive unless toggled
    });

    const handleVerify = async (id) => {
        try {
            await api.verifyUser(id);
            Alert.alert("Éxito", "Usuario verificado correctamente");
            loadUsers();
        } catch (e) {
            Alert.alert("Error", "No se pudo verificar al usuario");
        }
    };

    const selectUser = async (user) => {
        try {
            // Cargar datos frescos
            const fullUser = await api.adminGetUser(user._id);
            setSelectedUser(fullUser);
            setEditData({
                name: fullUser.name,
                email: fullUser.email,
                cedula: fullUser.cedula,
                role: fullUser.role,
                phone: fullUser.phone,
                isVerified: fullUser.isVerified
            });
            setNewPassword('');
            setIsEditing(false);
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar detalles del usuario");
        }
    };

    const handleUpdateUser = async () => {
        try {
            const payload = { ...editData };
            if (newPassword) payload.password = newPassword;

            await api.adminUpdateUser(selectedUser._id, payload);
            Alert.alert("Éxito", "Usuario actualizado correctamente");

            // Recargar
            selectUser(selectedUser); // Recargar detalles frescos
            loadUsers(); // Recargar lista
            setIsEditing(false);
        } catch (e) {
            Alert.alert("Error", "No se pudo actualizar el usuario");
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#2563EB" />;

    // Vista de Detalles / Edición
    if (selectedUser) {
        return (
            <ScrollView>
                <TouchableOpacity onPress={() => setSelectedUser(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                    <Feather name="arrow-left" size={20} color="#2563EB" />
                    <Text style={{ color: '#2563EB', marginLeft: 10 }}>Volver a la lista</Text>
                </TouchableOpacity>

                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 12 }}>

                    {/* HEADER: STATUS + EDIT */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <Text style={styles.sectionTitle}>{isEditing ? 'Editar Usuario' : 'Detalles de Usuario'}</Text>
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ padding: 10 }}>
                            <Feather name={isEditing ? "x" : "edit-2"} size={20} color={isEditing ? "#EF4444" : "#2563EB"} />
                        </TouchableOpacity>
                    </View>

                    {/* STATUS BANNER */}
                    {!selectedUser.isActive && (
                        <View style={{ backgroundColor: '#FECACA', padding: 10, borderRadius: 8, marginBottom: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>USUARIO DESACTIVADO</Text>
                            <Text style={{ color: '#DC2626', fontSize: 12 }}>Este usuario no puede iniciar sesión.</Text>
                        </View>
                    )}

                    {/* AVATAR */}
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        {selectedUser.avatar ? (
                            <Image
                                source={{ uri: selectedUser.avatar }}
                                style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#cbd5e1' }}
                            />
                        ) : (
                            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' }}>
                                <Feather name="user" size={40} color="#64748b" />
                            </View>
                        )}
                    </View>

                    {/* FORMULARIO EDITABLE */}
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={[styles.input, !isEditing && { backgroundColor: '#F3F4F6' }]}
                        value={isEditing ? editData.name : selectedUser.name}
                        editable={isEditing}
                        onChangeText={t => setEditData({ ...editData, name: t })}
                    />

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, !isEditing && { backgroundColor: '#F3F4F6' }]}
                        value={isEditing ? editData.email : selectedUser.email}
                        editable={isEditing}
                        onChangeText={t => setEditData({ ...editData, email: t })}
                    />

                    <Text style={styles.label}>Cédula (RUT/DNI) - ADMIN</Text>
                    <TextInput
                        style={[styles.input, !isEditing && { backgroundColor: '#F3F4F6' }]}
                        value={isEditing ? editData.cedula : selectedUser.cedula}
                        editable={isEditing}
                        onChangeText={t => setEditData({ ...editData, cedula: t })}
                        placeholder="Sin Cédula"
                    />

                    <Text style={styles.label}>Teléfono</Text>
                    <TextInput
                        style={[styles.input, !isEditing && { backgroundColor: '#F3F4F6' }]}
                        value={isEditing ? editData.phone : selectedUser.phone}
                        editable={isEditing}
                        onChangeText={t => setEditData({ ...editData, phone: t })}
                    />

                    <Text style={styles.label}>Rol</Text>
                    {isEditing ? (
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                            {['client', 'admin'].map(r => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setEditData({ ...editData, role: r })}
                                    style={{
                                        padding: 10,
                                        backgroundColor: editData.role === r ? '#DBEAFE' : '#F3F4F6',
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: editData.role === r ? '#2563EB' : 'transparent',
                                        flex: 1,
                                        alignItems: 'center'
                                    }}
                                >
                                    <Text style={{ color: editData.role === r ? '#2563EB' : '#666', fontWeight: 'bold' }}>
                                        {r === 'client' ? 'USUARIO' : 'ADMIN'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ) : (
                        <TextInput
                            style={[styles.input, { backgroundColor: '#F3F4F6' }]}
                            value={selectedUser.role === 'client' || selectedUser.role === 'professional' ? 'USUARIO' : 'ADMIN'}
                            editable={false}
                        />
                    )}

                    {isEditing && (
                        <View style={{ marginTop: 20, padding: 15, backgroundColor: '#FFF7ED', borderRadius: 10, borderWidth: 1, borderColor: '#FDBA74' }}>
                            <Text style={[styles.label, { color: '#C2410C' }]}>Cambiar Contraseña (Opcional)</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[styles.input, { marginBottom: 0, flex: 1 }]}
                                    placeholder="Nueva contraseña"
                                    secureTextEntry={!showPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10 }}>
                                    <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#C2410C" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 10, color: '#C2410C', marginTop: 5 }}>Deja en blanco para no cambiar.</Text>
                        </View>
                    )}

                    {isEditing && (
                        <TouchableOpacity style={[styles.saveButton, { marginTop: 20 }]} onPress={handleUpdateUser}>
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    )}

                    {/* DANGER ZONE: ACTIVAR / DESACTIVAR */}
                    <View style={{ marginTop: 30, borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20 }}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: selectedUser.isActive ? '#EF4444' : '#10B981' }]}
                            onPress={() => {
                                Alert.alert(
                                    selectedUser.isActive ? "Desactivar Usuario" : "Activar Usuario",
                                    selectedUser.isActive ? "¿Estás seguro? El usuario no podrá iniciar sesión pero sus datos se mantendrán." : "¿Reactivar acceso a este usuario?",
                                    [
                                        { text: "Cancelar", style: "cancel" },
                                        {
                                            text: "Confirmar", onPress: async () => {
                                                try {
                                                    const res = await api.adminToggleUserActive(selectedUser._id);
                                                    Alert.alert("Éxito", res.message);
                                                    // Actualizar local
                                                    setSelectedUser({ ...selectedUser, isActive: res.isActive });
                                                    loadUsers();
                                                } catch (e) {
                                                    Alert.alert("Error", e.message);
                                                }
                                            }
                                        }
                                    ]
                                )
                            }}
                        >
                            <Text style={styles.saveButtonText}>{selectedUser.isActive ? 'DESACTIVAR USUARIO' : 'REACTIVAR USUARIO'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* DATA ADICIONAL (READ ONLY) */}
                <View style={{ marginTop: 20, padding: 20, backgroundColor: 'white', borderRadius: 12 }}>
                    <Text style={styles.sectionTitle}>Datos Técnicos</Text>
                    <Text style={{ color: '#666' }}>ID: {selectedUser._id}</Text>
                    <Text style={{ color: '#666' }}>Estado: {selectedUser.isActive ? 'Activo' : 'Inactivo'}</Text>
                    <Text style={{ color: '#666' }}>Registro: {selectedUser.createdAt}</Text>
                    <Text style={{ color: '#666' }}>Rating: {selectedUser.rating}</Text>
                    <Text style={{ color: '#666' }}>Reviews: {selectedUser.reviewsCount}</Text>

                    <Text style={[styles.label, { marginTop: 15 }]}>Perfiles Activos:</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                        {/* Mostrar perfiles solo si existen */}
                        {selectedUser.profiles && Object.keys(selectedUser.profiles).length > 0 ? (
                            Object.keys(selectedUser.profiles).map(k => (
                                <View key={k} style={{ padding: 5, backgroundColor: '#E0E7FF', borderRadius: 5 }}>
                                    <Text style={{ color: '#3730A3', fontSize: 12, fontWeight: 'bold' }}>{k}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: '#999' }}>Ninguno</Text>
                        )}
                    </View>
                </View>
                <View style={{ height: 50 }} />
            </ScrollView>
        );
    }

    // Lista de Usuarios
    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>

            {/* SEARCH & FILTERS */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 }}>
                <TouchableOpacity
                    onPress={() => setShowInactive(!showInactive)}
                    style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: showInactive ? '#FCA5A5' : '#E5E7EB',
                        padding: 8, borderRadius: 20
                    }}
                >
                    <Feather name={showInactive ? "eye" : "eye-off"} size={14} color={showInactive ? "#991B1B" : "#4B5563"} />
                    <Text style={{ fontSize: 12, marginLeft: 5, color: showInactive ? "#991B1B" : "#4B5563" }}>
                        {showInactive ? "Ocultar Inactivos" : "Ver Inactivos"}
                    </Text>
                </TouchableOpacity>
            </View>

            {filteredUsers.map(u => (
                <TouchableOpacity key={u._id} style={[styles.card, !u.isActive && { opacity: 0.6, backgroundColor: '#FEF2F2' }]} onPress={() => selectUser(u)}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, !u.isActive && { color: '#991B1B' }]}>
                            {u.name}
                            {!u.isActive && <Text style={{ fontSize: 10, color: 'red', fontWeight: 'bold' }}> [INACTIVO]</Text>}
                            <Text style={{ fontSize: 12, color: '#666' }}> ({u.role === 'admin' ? 'Admin' : 'Usuario'})</Text>
                        </Text>
                        <Text style={styles.cardSubtitle}>{u.email}</Text>
                        <Text style={{ fontSize: 10, color: u.isVerified ? 'green' : 'orange' }}>
                            {u.isVerified ? 'Verificado' : 'Pendiente Verificación'}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={24} color="#ccc" />
                </TouchableOpacity>
            ))}
            {users.length === 0 && <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay usuarios registrados.</Text>}
        </ScrollView>
    );
};

// ... Rest of file (CategoriesManager, etc) ...

const CategoriesManager = () => {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('home');
    const [color, setColor] = useState('#FFF7ED');

    // Subcategories State: Array of objects { name, icon, titlePlaceholder, descriptionPlaceholder }
    const [subcats, setSubcats] = useState([]);

    // Subcategory Editor State
    const [showSubModal, setShowSubModal] = useState(false);
    const [editingSubIndex, setEditingSubIndex] = useState(null);
    const [subForm, setSubForm] = useState({ name: '', icon: 'circle', titlePlaceholder: '', descriptionPlaceholder: '', isUrgent: false, emergencyIcon: '' });

    // Icon Picker State
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [pickingFor, setPickingFor] = useState('category'); // 'category' or 'subcategory'

    const handleIconPicked = (iconName, lib) => {
        if (pickingFor === 'category') {
            setIcon(iconName);
        } else {
            setSubForm({ ...subForm, icon: iconName });
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            // Normalize subcategories if they are strings (legacy)
            const normalized = data.map(c => ({
                ...c,
                subcategories: c.subcategories.map(s => typeof s === 'string' ? { name: s } : s)
            }));
            setCategories(normalized);
        } catch (e) {
            console.log("Error loading categories", e);
        }
    };

    const handleSave = async () => {
        if (!name) return Alert.alert("Error", "El nombre es requerido");
        try {
            const payload = { name, subcategories: subcats, icon, color };

            if (editingId) {
                await api.updateCategory(editingId, payload);
                Alert.alert("Éxito", "Categoría actualizada");
            } else {
                await api.createCategory(payload);
                Alert.alert("Éxito", "Categoría creada");
            }

            resetForm();
            loadCategories();
        } catch (e) {
            console.log("Error en handleSave:", e);
            Alert.alert("Error", "No se pudo guardar la categoría: " + e.message);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat._id);
        setName(cat.name);
        setSubcats(cat.subcategories); // Array of objects
        setIcon(cat.icon || 'home');
        setColor(cat.color || '#FFF7ED');
    };

    const handleDelete = async (id) => {
        Alert.alert("Eliminar Categoría", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar", style: "destructive", onPress: async () => {
                    try { await api.deleteCategory(id); loadCategories(); } catch (e) { Alert.alert("Error", "Falló eliminación"); }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setSubcats([]);
        setIcon('home');
        setColor('#FFF7ED');
    };

    // --- Subcategory Logic ---
    const openSubModal = (index = null) => {
        setEditingSubIndex(index);
        if (index !== null) {
            setSubForm({
                ...subcats[index],
                icon: subcats[index].icon || icon,
                isUrgent: !!subcats[index].isUrgent,
                emergencyIcon: subcats[index].emergencyIcon || ''
            }); // Inherit parent icon if missing
        } else {
            setSubForm({ name: '', icon: icon, titlePlaceholder: '', descriptionPlaceholder: '', isUrgent: false, emergencyIcon: '' });
        }
        setShowSubModal(true);
    };

    const pickEmergencyIcon = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [1, 1],
            quality: 0.5,
            base64: true
        });

        if (!result.canceled) {
            setSubForm(prev => ({ ...prev, emergencyIcon: `data:image/jpeg;base64,${result.assets[0].base64}` }));
        }
    };

    const saveSubcategory = () => {
        if (!subForm.name) return Alert.alert("Falta Nombre", "La subcategoría debe tener nombre");

        let newSubcats = [...subcats];
        if (editingSubIndex !== null) {
            newSubcats[editingSubIndex] = subForm;
        } else {
            newSubcats.push(subForm);
        }
        setSubcats(newSubcats);
        setShowSubModal(false);
    };

    const removeSubcategory = (index) => {
        const newSubcats = [...subcats];
        newSubcats.splice(index, 1);
        setSubcats(newSubcats);
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
            <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
                <Text style={styles.label}>Nombre Categoría</Text>
                <TextInput style={styles.input} placeholder="Nombre (ej. Hogar)" value={name} onChangeText={setName} />

                <Text style={styles.label}>Icono:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <View style={{ width: 50, height: 50, borderRadius: 10, backgroundColor: color, alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                        <DynamicAppIcon name={icon} size={28} color="#374151" />
                    </View>
                    <TouchableOpacity
                        style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 }}
                        onPress={() => { setPickingFor('category'); setShowIconPicker(true); }}
                    >
                        <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Cambiar Icono</Text>
                    </TouchableOpacity>
                </View>

                <TextInput style={styles.input} placeholder="Color Hex (ej. #FFF7ED)" value={color} onChangeText={setColor} />

                {/* Subcategories Section */}
                <Text style={[styles.sectionTitle, { fontSize: 16, marginTop: 15 }]}>Subcategorías ({subcats.length})</Text>
                {subcats.map((sub, idx) => {
                    return (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 5 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                                <Feather name="corner-down-right" size={16} color="#CBD5E1" style={{ marginRight: 5 }} />
                                <DynamicAppIcon name={sub.icon} size={20} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: 'bold', color: '#334155', fontSize: 14 }}>{sub.name}</Text>
                                    {sub.isUrgent && (
                                        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                                            <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: 'bold' }}>URGENTE</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Feather name="image" size={10} color="#64748B" style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 10, color: '#475569' }}>{sub.icon || 'Por defecto'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: sub.titlePlaceholder ? '#F0FDF4' : '#FEF2F2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexShrink: 1 }}>
                                        <Feather name="type" size={10} color={sub.titlePlaceholder ? '#16A34A' : '#EF4444'} style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 10, color: sub.titlePlaceholder ? '#15803D' : '#DC2626' }} numberOfLines={1}>
                                            {sub.titlePlaceholder ? `Tít: ${sub.titlePlaceholder}` : '⚠️ Sin ejemplo título'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: sub.descriptionPlaceholder ? '#F8FAFC' : '#FEF2F2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}>
                                    <Feather name={sub.descriptionPlaceholder ? "align-left" : "alert-circle"} size={10} color={sub.descriptionPlaceholder ? '#64748B' : '#EF4444'} style={{ marginRight: 4 }} />
                                    <Text style={{ fontSize: 10, color: sub.descriptionPlaceholder ? '#475569' : '#DC2626', flex: 1 }} numberOfLines={1}>
                                        {sub.descriptionPlaceholder ? `Desc: ${sub.descriptionPlaceholder}` : '⚠️ Sin ejemplo descripción'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => openSubModal(idx)} style={{ marginRight: 10 }}>
                                <Feather name="edit-2" size={16} color="#2563EB" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeSubcategory(idx)}>
                                <Feather name="trash-2" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F1F5F9', marginTop: 10 }]} onPress={() => openSubModal(null)}>
                    <Feather name="plus" size={16} color="#334155" />
                    <Text style={{ color: '#334155', marginLeft: 5, fontWeight: 'bold' }}>Agregar Subcategoría</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                    <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>{editingId ? 'Actualizar Categoría' : 'Crear Categoría'}</Text>
                    </TouchableOpacity>
                    {editingId && (
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#6B7280', flex: 1 }]} onPress={resetForm}>
                            <Text style={styles.saveButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Subcategory Modal (Inline simplified) */}
            <Modal visible={showSubModal} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingSubIndex !== null ? 'Editar Subcategoría' : 'Nueva Subcategoría'}</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.label}>Nombre</Text>
                            <TextInput style={styles.input} placeholder="Ej. Plomería" value={subForm.name} onChangeText={t => setSubForm({ ...subForm, name: t })} />

                            <Text style={styles.label}>Icono</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                                    <DynamicAppIcon name={subForm.icon} size={24} color="#374151" />
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                                    onPress={() => { setPickingFor('subcategory'); setShowIconPicker(true); }}
                                >
                                    <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 12 }}>Seleccionar Icono</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Ejemplo para Título (Placeholder)</Text>
                            <TextInput style={styles.input} placeholder="Ej. Fuga en el lavamanos..." value={subForm.titlePlaceholder} onChangeText={t => setSubForm({ ...subForm, titlePlaceholder: t })} />

                            <Text style={styles.label}>Ejemplo para Descripción (Placeholder)</Text>
                            <TextInput style={styles.input} placeholder="Ej. Necesito un plomero urgente para..." value={subForm.descriptionPlaceholder} onChangeText={t => setSubForm({ ...subForm, descriptionPlaceholder: t })} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginTop: 10 }}>
                                <View>
                                    <Text style={{ fontWeight: 'bold', color: '#1E293B' }}>Acceso Directo Urgente</Text>
                                    <Text style={{ fontSize: 11, color: '#64748B' }}>Mostrar en botones rápidos de la Home</Text>
                                </View>
                                <Switch
                                    value={subForm.isUrgent}
                                    onValueChange={(val) => setSubForm({ ...subForm, isUrgent: val })}
                                    trackColor={{ false: '#CBD5E1', true: '#FED7D7' }}
                                    thumbColor={subForm.isUrgent ? '#EF4444' : '#94A3B8'}
                                />
                            </View>

                            {subForm.isUrgent && (
                                <View style={{ marginTop: 15, padding: 12, backgroundColor: '#FFF5F5', borderRadius: 12, borderWeight: 1, borderColor: '#FED7D7' }}>
                                    <Text style={[styles.label, { marginBottom: 10 }]}>Icono de Emergencia Personalizado</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {subForm.emergencyIcon ? (
                                            <ExpoImage source={{ uri: subForm.emergencyIcon }} style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: 'white' }} />
                                        ) : (
                                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginRight: 15 }}>
                                                <Feather name="image" size={24} color="#EF4444" />
                                            </View>
                                        )}
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#EF4444', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8 }}
                                            onPress={pickEmergencyIcon}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Subir Logotipo</Text>
                                        </TouchableOpacity>
                                        {subForm.emergencyIcon ? (
                                            <TouchableOpacity onPress={() => setSubForm({ ...subForm, emergencyIcon: '' })} style={{ marginLeft: 15 }}>
                                                <Feather name="trash-2" size={20} color="#666" />
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                    <Text style={{ fontSize: 10, color: '#666', marginTop: 8 }}>Este logo se mostrará en el banner de Urgencias 24/7 en la Home.</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={saveSubcategory}>
                                <Text style={styles.saveButtonText}>Guardar Subcategoría</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { flex: 1, backgroundColor: '#94A3B8' }]} onPress={() => setShowSubModal(false)}>
                                <Text style={styles.saveButtonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <IconPickerModal
                visible={showIconPicker}
                onClose={() => setShowIconPicker(false)}
                onSelect={handleIconPicked}
            />

            <Text style={styles.sectionTitle}>Categorías Existentes</Text>
            {categories.map(cat => (
                <View key={cat._id} style={styles.card}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{cat.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{cat.subcategories.length} subcategorías</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => handleEdit(cat)} style={{ padding: 5 }}>
                            <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(cat._id)} style={{ padding: 5 }}>
                            <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>X</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const ArticlesManager = () => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Hogar'); // Default

    const handlePublish = async () => {
        if (!title || !content) return Alert.alert("Error", "Título y contenido requeridos");
        try {
            await api.createArticle({ title, content, category, image: 'https://placehold.co/300' });
            Alert.alert("Éxito", "Artículo publicado");
            setTitle('');
            setContent('');
        } catch (e) {
            Alert.alert("Error", "No se pudo publicar el artículo");
        }
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>Nuevo Artículo de Blog</Text>
            <TextInput style={styles.input} placeholder="Título del Artículo" value={title} onChangeText={setTitle} />
            <TextInput style={[styles.input, { height: 150 }]} placeholder="Contenido del artículo..." multiline value={content} onChangeText={setContent} />
            <TouchableOpacity style={styles.saveButton} onPress={handlePublish}>
                <Text style={styles.saveButtonText}>Publicar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const RequestsManager = ({ jobs, categories, filter, onRefresh }) => {
    // Props consumed directly. Jobs loaded in parent.
    const [selectedJob, setSelectedJob] = useState(null);
    const [jobChats, setJobChats] = useState([]);

    // Edit State
    const [isEditingJob, setIsEditingJob] = useState(false);
    const [editCat, setEditCat] = useState(null);
    const [editSub, setEditSub] = useState('');
    const [editLocation, setEditLocation] = useState('');

    const openJob = async (job) => {
        setSelectedJob(job);
        setIsEditingJob(false);
        try {
            // Cargar DETALLES COMPLETOS del trabajo (incluyendo contexto per-pro)
            const fullDetails = await api.adminGetJobDetails(job._id);
            // fullDetails = { job: {...}, professionalContexts: [...] }
            setSelectedJob(fullDetails.job);
            setJobChats(fullDetails.professionalContexts); // Reusing this state to store contexts. Ideally rename to 'jobContexts'
        } catch (e) {
            console.log("Error loading job details", e);
            Alert.alert("Error", "No se pudieron cargar los detalles completos");
        }
    };

    const startEditJob = () => {
        const catName = selectedJob.category?.name || selectedJob.category;
        const foundCat = categories.find(c => c.name === catName);
        setEditCat(foundCat || categories[0]);
        setEditSub(selectedJob.subcategory || '');
        setEditLocation(selectedJob.location || '');
        setIsEditingJob(true);
    };

    const handleSaveJob = async () => {
        try {
            if (!editCat) return;
            const payload = {
                category: editCat._id,
                subcategory: editSub,
                location: editLocation
            };
            await api.adminUpdateJob(selectedJob._id, payload);
            Alert.alert("Éxito", "Solicitud actualizada");

            const updatedJob = { ...selectedJob, category: editCat, subcategory: editSub, location: editLocation };
            setSelectedJob(updatedJob);
            // Refresh parent data to update filter
            onRefresh();
            setIsEditingJob(false);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo actualizar");
        }
    };



    // VISTA DETALLE SOLICITUD (JOB)
    if (selectedJob) {
        // jobChats state is now used to store 'professionalContexts' array from backend
        // Data strcuture per item: { professional, calculatedStatus, hasChat, metrics, offer, ... }

        return (
            <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => setSelectedJob(null)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                    <Feather name="arrow-left" size={20} color="#2563EB" />
                    <Text style={{ color: '#2563EB', marginLeft: 10 }}>Volver a Lista</Text>
                </TouchableOpacity>

                <ScrollView style={{ flex: 1 }}>
                    {/* INFO PRINCIPAL */}
                    <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>{selectedJob.title}</Text>
                        <Text style={{ color: '#666', marginBottom: 5 }}>{selectedJob.description}</Text>
                        <Text style={{ fontSize: 12, color: '#4B5563' }}>Cliente: <Text style={{ fontWeight: 'bold' }}>{selectedJob.client?.name}</Text></Text>
                        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>ID Cliente: {selectedJob.client?._id || selectedJob.client}</Text>

                        {/* IMAGENES */}
                        <Text style={{ fontSize: 13, fontWeight: 'bold', marginTop: 10, color: '#374151' }}>Imágenes de la Solicitud</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
                            {selectedJob.images && selectedJob.images.length > 0 ? (
                                selectedJob.images.map((img, idx) => (
                                    <View key={idx} style={{ marginRight: 10 }}>
                                        <ExpoImage source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }} />
                                    </View>
                                ))
                            ) : (
                                <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>El cliente no ha subido imágenes.</Text>
                            )}
                        </ScrollView>
                    </View>

                    {/* ESTADOS DEL SISTEMA (DEBUG/ADMIN VIEW) */}
                    <View style={{ marginBottom: 15, padding: 10, backgroundColor: '#EFF6FF', borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE' }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1E40AF', marginBottom: 8 }}>Estados del Sistema:</Text>

                        {/* 1. CLIENT STATUS (Calculated - THE ONLY TRUTH FOR CLIENT) */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>Estado para el Cliente:</Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#059669' }}>
                                {selectedJob.calculatedClientStatus || 'NUEVA'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: '#6B7280' }}>Estado Interno BD:</Text>
                            <Text style={{ fontSize: 11, color: '#374151' }}>{selectedJob.status}</Text>
                        </View>
                    </View>

                    {/* CONTEXTO PROFESIONALES (NEW VIEW) */}
                    <Text style={styles.sectionTitle}>Interacción de Profesionales</Text>

                    {(!jobChats || jobChats.length === 0) && (
                        <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>Ningún profesional ha interactuado aún.</Text>
                    )}

                    {jobChats && jobChats.map((ctx, idx) => {
                        const pro = ctx.professional;
                        const statusColor = ctx.calculatedStatus === 'NUEVA' ? '#3B82F6' :
                            ctx.calculatedStatus === 'CONTACTADA' ? '#8B5CF6' :
                                ctx.calculatedStatus === 'PRESUPUESTADA' ? '#F59E0B' :
                                    ctx.calculatedStatus === 'ACEPTADO' ? '#10B981' : '#6B7280';

                        return (
                            <View key={idx} style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: statusColor }}>
                                {/* HEADER: PRO + STATUS */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {pro.avatar ? (
                                            <ExpoImage source={{ uri: `data:image/jpeg;base64,${pro.avatar}` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                        ) : (
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                                                <Feather name="user" size={20} color="#9CA3AF" />
                                            </View>
                                        )}
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{pro.name}</Text>
                                            <Text style={{ fontSize: 11, color: '#6B7280' }}>{pro.email}</Text>
                                        </View>
                                    </View>
                                    <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                                        <Text style={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}>{ctx.calculatedStatus}</Text>
                                    </View>
                                </View>

                                {/* METRICS & INTERACTIONS */}
                                <View style={{ marginTop: 15, flexDirection: 'row', gap: 15 }}>
                                    {/* CHAT INDICATOR */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: ctx.hasChat ? 1 : 0.3 }}>
                                        <Feather name="message-circle" size={16} color="#2563EB" />
                                        <Text style={{ fontSize: 12, marginLeft: 5, color: '#374151' }}>
                                            {ctx.metrics?.messagesCount || 0} msgs
                                        </Text>
                                    </View>

                                    {/* OFFER INDICATOR */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', opacity: ctx.offer ? 1 : 0.3 }}>
                                        <Feather name="dollar-sign" size={16} color="#10B981" />
                                        <Text style={{ fontSize: 12, marginLeft: 2, color: '#374151' }}>
                                            {ctx.offer ? `$${ctx.offer.amount}` : 'Sin Oferta'}
                                        </Text>
                                    </View>

                                    {/* RATING INDICATOR */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Feather name="star" size={16} color="#F59E0B" />
                                        <Text style={{ fontSize: 12, marginLeft: 5, color: '#374151' }}>
                                            {pro.rating || 'N/A'}
                                        </Text>
                                    </View>
                                </View>

                                {/* OFFER DETAIL IF EXISTS */}
                                {ctx.offer && (
                                    <View style={{ marginTop: 10, padding: 8, backgroundColor: '#F0FDF4', borderRadius: 8 }}>
                                        <Text style={{ fontSize: 11, color: '#166534', fontWeight: 'bold' }}>Detalle Oferta:</Text>
                                        <Text style={{ fontSize: 11, color: '#166534' }}>{ctx.offer.description || 'Sin descripción'}</Text>
                                    </View>
                                )}

                                {/* LAST MSG PREVIEW */}
                                {ctx.hasChat && ctx.metrics?.lastMessage && (
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={{ fontSize: 10, color: '#9CA3AF' }}>
                                            Último msg: "{ctx.metrics.lastMessage.content?.substring(0, 30)}..."
                                        </Text>
                                    </View>
                                )}
                            </View>
                        );
                    })}


                    <View style={{ height: 20 }} />

                    {/* LOCATION & DATE (BOTTOM) */}
                    {
                        isEditingJob ? (
                            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="map-pin" size={14} color="#6B7280" />
                                <TextInput
                                    value={editLocation}
                                    onChangeText={setEditLocation}
                                    style={[styles.input, { flex: 1, marginLeft: 5, marginBottom: 0, height: 35, paddingVertical: 5 }]}
                                    placeholder="Ubicación"
                                />
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                                <Feather name="map-pin" size={12} color="#666" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 12, color: '#999' }}>{selectedJob.location || 'Sin ubicación'}</Text>
                            </View>
                        )
                    }
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 5 }}>Fecha: {new Date(selectedJob.createdAt).toLocaleDateString()}</Text>

                    {/* CLASIFICACION EDITABLE */}
                    <View style={{ marginTop: 15, borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1F2937' }}>Clasificación</Text>
                            <TouchableOpacity onPress={() => isEditingJob ? setIsEditingJob(false) : startEditJob()}>
                                <Text style={{ color: '#2563EB', fontSize: 12, fontWeight: 'bold' }}>{isEditingJob ? 'Cancelar' : 'Editar'}</Text>
                            </TouchableOpacity>
                        </View>

                        {isEditingJob ? (
                            <View style={{ marginTop: 10 }}>
                                <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 5 }}>Categoría:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                    {categories.map(c => (
                                        <TouchableOpacity
                                            key={c._id}
                                            style={{
                                                padding: 8, borderRadius: 8, marginRight: 8,
                                                backgroundColor: editCat?._id === c._id ? '#DBEAFE' : '#F3F4F6',
                                                borderWidth: 1, borderColor: editCat?._id === c._id ? '#2563EB' : 'transparent'
                                            }}
                                            onPress={() => { setEditCat(c); setEditSub(''); }}
                                        >
                                            <Text style={{ color: editCat?._id === c._id ? '#1E3A8A' : '#4B5563', fontSize: 12 }}>{c.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={{ fontSize: 10, color: '#6B7280', marginBottom: 5 }}>Subcategoría:</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                    {editCat?.subcategories?.map(sub => (
                                        <TouchableOpacity
                                            key={sub}
                                            style={{
                                                padding: 8, borderRadius: 8,
                                                backgroundColor: editSub === sub ? '#DCFCE7' : '#F3F4F6',
                                                borderWidth: 1, borderColor: editSub === sub ? '#16A34A' : 'transparent'
                                            }}
                                            onPress={() => setEditSub(sub)}
                                        >
                                            <Text style={{ color: editSub === sub ? '#14532D' : '#4B5563', fontSize: 12 }}>{sub}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {(!editCat?.subcategories || editCat.subcategories.length === 0) && <Text style={{ fontSize: 11, color: '#999' }}>Sin subcategorías</Text>}
                                </View>

                                <TouchableOpacity style={[styles.saveButton, { marginTop: 15, padding: 10 }]} onPress={handleSaveJob}>
                                    <Text style={styles.saveButtonText}>Guardar Clasificación</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={{ fontSize: 15, color: '#2563EB', marginTop: 5 }}>
                                {selectedJob.category?.name || selectedJob.category} {selectedJob.subcategory ? `> ${selectedJob.subcategory}` : ''}
                            </Text>
                        )}
                    </View>

                    {/* PRESUPUESTOS (OFFERS) */}
                    <Text style={styles.sectionTitle}>Presupuestos ({selectedJob.offers?.length || 0})</Text>
                    {
                        selectedJob.offers && selectedJob.offers.length > 0 ? (
                            selectedJob.offers.map((offer, idx) => (
                                <View key={idx} style={{ backgroundColor: '#FFF7ED', padding: 10, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#F97316' }}>
                                    <Text style={{ fontWeight: 'bold', color: '#C2410C' }}>${offer.amount} - {offer.proId?.name || 'Pro'}</Text>
                                    <Text style={{ fontSize: 12, color: '#4B5563' }}>{offer.description}</Text>
                                    <Text style={{ fontSize: 10, color: offer.status === 'accepted' ? 'green' : 'orange', alignSelf: 'flex-end' }}>
                                        {offer.status.toUpperCase()}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={{ color: '#999', marginBottom: 15, fontStyle: 'italic' }}>No hay presupuestos enviados.</Text>
                        )
                    }

                    {/* CONVERSACIONES (CHATS) */}
                    <Text style={styles.sectionTitle}>Conversaciones</Text>
                    {
                        jobChats.filter(ctx => ctx.chat).length > 0 ? (
                            jobChats.filter(ctx => ctx.chat).map((ctx, idx) => {
                                const chat = ctx.chat;
                                return (
                                    <View key={idx} style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 }}>
                                        <Text style={{ fontWeight: 'bold', color: '#2563EB', marginBottom: 5 }}>
                                            Chat con {ctx.professional?.name || chat.participants?.find(p => p.role === 'professional')?.name || 'Profesional'}
                                        </Text>
                                        <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, maxHeight: 200 }}>
                                            {(chat.messages || []).map((msg, mIdx) => (
                                                <Text key={mIdx} style={{ fontSize: 11, marginBottom: 3 }}>
                                                    <Text style={{ fontWeight: 'bold' }}>{msg.sender?.name || 'Usuario'}: </Text>
                                                    {msg.content || (msg.media ? '[Imagen]' : '')}
                                                </Text>
                                            ))}
                                            {(!chat.messages || chat.messages.length === 0) && <Text style={{ fontSize: 10, color: '#999' }}>Chat iniciado, sin mensajes.</Text>}
                                        </View>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={{ color: '#999', marginBottom: 15, fontStyle: 'italic' }}>No hay chats iniciados para esta solicitud.</Text>
                        )
                    }
                    {/* DANGER ZONE */}
                    <View style={{ marginTop: 30, marginBottom: 50, borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 20 }}>
                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' }]}
                            onPress={() => {
                                if (Platform.OS === 'web') {
                                    if (window.confirm("Eliminar Solicitud\n\n¿Estás seguro? Esta acción eliminará permanentemente la solicitud, sus ofertas y chats asociados. No se puede deshacer.")) {
                                        (async () => {
                                            try {
                                                await api.deleteJob(selectedJob._id);
                                                window.alert("Eliminado: La solicitud ha sido eliminada.");
                                                setSelectedJob(null);
                                                onRefresh();
                                            } catch (e) {
                                                window.alert("Error: No se pudo eliminar: " + e.message);
                                            }
                                        })();
                                    }
                                } else {
                                    Alert.alert(
                                        "Eliminar Solicitud",
                                        "¿Estás seguro? Esta acción eliminará permanentemente la solicitud, sus ofertas y chats asociados. No se puede deshacer.",
                                        [
                                            { text: "Cancelar", style: "cancel" },
                                            {
                                                text: "Eliminar Definitivamente", style: 'destructive', onPress: async () => {
                                                    try {
                                                        await api.deleteJob(selectedJob._id);
                                                        Alert.alert("Eliminado", "La solicitud ha sido eliminada.");
                                                        setSelectedJob(null);
                                                        onRefresh();
                                                    } catch (e) {
                                                        Alert.alert("Error", "No se pudo eliminar: " + e.message);
                                                    }
                                                }
                                            }
                                        ]
                                    );
                                }
                            }}
                        >
                            <Text style={[styles.saveButtonText, { color: '#DC2626' }]}>ELIMINAR SOLICITUD</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView >
            </View >
        );
    }


    const filteredJobs = jobs.filter(j => {
        if (filter === 'Todas') return true;
        const catName = j.category?.name || j.category || '';
        return catName === filter;
    });

    return (
        <ScrollView>
            {/* Header Filter Removed (Moved to App Header) */}

            {filteredJobs.map(job => (
                <TouchableOpacity key={job._id} style={styles.card} onPress={() => openJob(job)}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{job.title}</Text>
                        <Text style={styles.cardSubtitle}>{job.client?.name || 'Cliente Desconocido'}</Text>
                        <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: 'bold', marginTop: 2 }}>
                            {job.category?.name || job.category} {job.subcategory ? `> ${job.subcategory}` : ''}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            <Feather name="map-pin" size={10} color="#666" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 11, color: '#666' }}>{job.location}</Text>
                        </View>
                        <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                            {job.offers?.length} ofertas • {new Date(job.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: job.status === 'active' ? 'green' : 'gray' }}>
                            {job.status.toUpperCase()}
                        </Text>
                        <Feather name="chevron-right" size={20} color="#ccc" style={{ marginTop: 5 }} />
                    </View>
                </TouchableOpacity>
            ))}
            {filteredJobs.length === 0 && <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay solicitudes.</Text>}
        </ScrollView>
    );
};

const BusinessesManager = () => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        category: '',
        subcategory: '',
        address: '',
        phone: '',
        whatsapp: '',
        rating: '5.0',
        image: '',
        promo: ''
    });

    const [existingAds, setExistingAds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    // Helper to get subcategories of selected category
    const availableSubcategories = categories.find(c => c.name === form.category)?.subcategories || [];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [adsData, catsData] = await Promise.all([
                api.getBusinesses(),
                api.getCategories()
            ]);
            setExistingAds(adsData);
            setCategories(catsData);
        } catch (e) {
            console.log("Error loading business data", e);
        }
    };

    const handleEdit = (ad) => {
        setEditingId(ad._id);
        setForm({
            name: ad.name || '',
            description: ad.description || '',
            category: ad.category || '',
            subcategory: ad.subcategory || '',
            address: ad.address || '',
            phone: ad.phone || '',
            whatsapp: ad.whatsapp || '',
            rating: ad.rating ? String(ad.rating) : '',
            image: ad.image || '',
            promo: ad.promo || ''
        });
    };

    const handleDelete = (id) => {
        Alert.alert("Eliminar Anuncio", "¿Estás seguro?", [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar", style: "destructive", onPress: async () => {
                    try {
                        await api.deleteBusiness(id);
                        loadData();
                    } catch (e) {
                        Alert.alert("Error", "No se pudo eliminar");
                    }
                }
            }
        ]);
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            name: '', description: '', category: '', subcategory: '', address: '', phone: '', whatsapp: '', rating: '5.0', image: '', promo: ''
        });
    };

    // Helper to get subcategories of selected category

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [16, 9],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setForm({ ...form, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
        }
    };

    const handleSave = async () => {
        if (!form.name || !form.category) return Alert.alert("Error", "Nombre y Categoría son obligatorios");

        setLoading(true);
        try {
            if (editingId) {
                await api.updateBusiness(editingId, { ...form, isPromoted: true });
                Alert.alert("Éxito", "Anuncio actualizado correctamente");
            } else {
                await api.createBusiness({ ...form, isPromoted: true });
                Alert.alert("Éxito", "Anuncio creado correctamente");
            }
            resetForm();
            loadData();
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar el anuncio: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>{editingId ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}</Text>

            <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
                <Text style={styles.label}>Información Básica</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Título del Negocio (Ej. Ferretería EPA)"
                    value={form.name}
                    onChangeText={t => setForm({ ...form, name: t })}
                />

                <Text style={styles.label}>Ubicación del Anuncio (Target)</Text>

                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 5 }}>Categoría:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {categories.map(c => (
                        <TouchableOpacity
                            key={c._id}
                            style={{
                                paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                                backgroundColor: form.category === c.name ? '#DBEAFE' : '#F3F4F6',
                                borderWidth: 1, borderColor: form.category === c.name ? '#2563EB' : '#E5E7EB'
                            }}
                            onPress={() => setForm({ ...form, category: c.name, subcategory: '' })}
                        >
                            <Text style={{ color: form.category === c.name ? '#1E40AF' : '#4B5563', fontWeight: 'bold' }}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {form.category ? (
                    <>
                        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 5 }}>Subcategoría (Opcional):</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                            <TouchableOpacity
                                style={{
                                    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                                    backgroundColor: form.subcategory === '' ? '#DCFCE7' : '#F3F4F6',
                                    borderWidth: 1, borderColor: form.subcategory === '' ? '#16A34A' : '#E5E7EB'
                                }}
                                onPress={() => setForm({ ...form, subcategory: '' })}
                            >
                                <Text style={{ color: form.subcategory === '' ? '#14532D' : '#4B5563', fontStyle: 'italic' }}>Toda la Categoría</Text>
                            </TouchableOpacity>
                            {availableSubcategories.map(sub => (
                                <TouchableOpacity
                                    key={sub}
                                    style={{
                                        paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10,
                                        backgroundColor: form.subcategory === sub ? '#DCFCE7' : '#F3F4F6',
                                        borderWidth: 1, borderColor: form.subcategory === sub ? '#16A34A' : '#E5E7EB'
                                    }}
                                    onPress={() => setForm({ ...form, subcategory: sub })}
                                >
                                    <Text style={{ color: form.subcategory === sub ? '#14532D' : '#4B5563' }}>{sub}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                ) : null}

                <TextInput
                    style={styles.input}
                    placeholder="Texto Promocional (Ej. 10% Descuento)"
                    value={form.promo}
                    onChangeText={t => setForm({ ...form, promo: t })}
                />

                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Descripción detallada..."
                    multiline
                    value={form.description}
                    onChangeText={t => setForm({ ...form, description: t })}
                />

                <Text style={styles.label}>Contacto</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Dirección Física"
                    value={form.address}
                    onChangeText={t => setForm({ ...form, address: t })}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Teléfono"
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={t => setForm({ ...form, phone: t })}
                    />
                    <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="WhatsApp"
                        keyboardType="phone-pad"
                        value={form.whatsapp}
                        onChangeText={t => setForm({ ...form, whatsapp: t })}
                    />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                    <Text style={{ fontWeight: 'bold', color: '#374151' }}>Valoración Inicial:</Text>
                    <TextInput
                        style={[styles.input, { width: 80, marginBottom: 0, textAlign: 'center' }]}
                        placeholder="5.0"
                        keyboardType="numeric"
                        value={form.rating}
                        onChangeText={t => setForm({ ...form, rating: t })}
                    />
                </View>

                <Text style={styles.label}>Imagen del Anuncio</Text>
                <TouchableOpacity onPress={pickImage} style={{ alignItems: 'center', justifyContent: 'center', height: 150, backgroundColor: '#F3F4F6', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20, overflow: 'hidden' }}>
                    {form.image ? (
                        <ExpoImage source={{ uri: form.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <Feather name="image" size={30} color="#9CA3AF" />
                            <Text style={{ color: '#6B7280', marginTop: 5 }}>Toca para subir imagen</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.saveButton, loading && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{editingId ? 'Actualizar Anuncio' : 'Publicar Anuncio'}</Text>}
                </TouchableOpacity>

                {editingId && (
                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#9CA3AF', marginTop: 10 }]} onPress={resetForm}>
                        <Text style={styles.saveButtonText}>Cancelar Edición</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.sectionTitle}>Anuncios Activos</Text>
            {existingAds.length === 0 && <Text style={{ textAlign: 'center', color: '#999', marginBottom: 20 }}>No hay anuncios creados.</Text>}

            {existingAds.map(ad => (
                <View key={ad._id} style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {ad.image ? <ExpoImage source={{ uri: ad.image }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} /> : null}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{ad.name}</Text>
                            <Text style={styles.cardSubtitle}>{ad.category} {ad.subcategory ? `> ${ad.subcategory}` : ''}</Text>
                            <Text style={{ fontSize: 10, color: '#6B7280' }}>Rating: {ad.rating || 'N/A'} • WA: {ad.whatsapp || 'No'}</Text>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        <TouchableOpacity onPress={() => handleEdit(ad)}>
                            <Feather name="edit-2" size={20} color="#2563EB" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(ad._id)}>
                            <Feather name="trash-2" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const MessagesManager = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ title: '', subtitle: '', buttonText: '' });

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            const data = await api.getAppMessages();
            setMessages(data);
        } catch (e) {
            Alert.alert("Error", "No se cargaron los mensajes");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (msg) => {
        setEditingId(msg._id);
        setForm({ title: msg.title, subtitle: msg.subtitle, buttonText: msg.buttonText });
    };

    const handleSave = async () => {
        if (!form.title || !form.subtitle || !form.buttonText) return Alert.alert("Error", "Todos los campos son obligatorios");

        try {
            await api.updateAppMessage(editingId, form);
            Alert.alert("Éxito", "Mensaje actualizado");
            setEditingId(null);
            loadMessages();
        } catch (e) {
            Alert.alert("Error", "No se pudo actualizar");
        }
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>Mensajes de Inicio</Text>
            <Text style={{ marginBottom: 15, color: '#666' }}>Estos mensajes rotan cada vez que el usuario abre la app (Home).</Text>

            {loading && <ActivityIndicator size="large" color="#2563EB" />}

            {messages.map((msg, index) => (
                <View key={msg._id || index} style={styles.card}>
                    {editingId === msg._id ? (
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Título</Text>
                            <TextInput
                                style={[styles.input, { marginBottom: 10 }]}
                                value={form.title}
                                onChangeText={t => setForm({ ...form, title: t })}
                            />

                            <Text style={styles.label}>Subtítulo</Text>
                            <TextInput
                                style={[styles.input, { marginBottom: 10, height: 60 }]}
                                multiline
                                value={form.subtitle}
                                onChangeText={t => setForm({ ...form, subtitle: t })}
                            />

                            <Text style={styles.label}>Texto Botón</Text>
                            <TextInput
                                style={[styles.input, { marginBottom: 15 }]}
                                value={form.buttonText}
                                onChangeText={t => setForm({ ...form, buttonText: t })}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { flex: 1 }]}>
                                    <Text style={styles.saveButtonText}>Guardar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.saveButton, { flex: 1, backgroundColor: '#9CA3AF' }]}>
                                    <Text style={styles.saveButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1E293B', marginBottom: 4, flex: 1 }}>{msg.title}</Text>
                                <TouchableOpacity onPress={() => handleEdit(msg)} style={{ padding: 5 }}>
                                    <Feather name="edit-2" size={20} color="#2563EB" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ color: '#4B5563', marginBottom: 8 }}>{msg.subtitle}</Text>
                            <View style={{ alignSelf: 'flex-start', backgroundColor: '#EA580C', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{msg.buttonText}</Text>
                            </View>
                        </View>
                    )}
                </View>
            ))}
            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const IacondoManager = () => {
    const [config, setConfig] = useState({
        apiUrl: 'https://condopro-api.onrender.com/api/integrations/v1',
        apiKey: '',
        condoSubdomain: 'semeruco',
        webhookUrl: 'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status',
        isActive: true,
        hasApiKey: false
    });
    const [stats, setStats] = useState({ quotesSent: 0, quotesApproved: 0, quotesRejected: 0 });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [sendingSample, setSendingSample] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [statusBanner, setStatusBanner] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configRes, historyRes] = await Promise.all([
                api.getIacondoConfig().catch(e => ({ success: false })),
                api.getIacondoHistory().catch(e => ({ success: false }))
            ]);

            if (configRes && configRes.config) {
                setConfig({
                    apiUrl: configRes.config.apiUrl || 'https://condopro-api.onrender.com/api/integrations/v1',
                    apiKey: configRes.config.apiKey || '',
                    condoSubdomain: configRes.config.condoSubdomain || 'semeruco',
                    webhookUrl: configRes.config.webhookUrl || 'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status',
                    isActive: configRes.config.isActive ?? true,
                    hasApiKey: configRes.config.hasApiKey
                });
                if (configRes.config.stats) setStats(configRes.config.stats);
            }

            if (historyRes && historyRes.history) {
                setHistory(historyRes.history);
                if (historyRes.stats) setStats(historyRes.stats);
            }
        } catch (e) {
            console.log("Error cargando configuración de IACONDO:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config.apiUrl) {
            return Alert.alert("Error", "La URL de la API de IACONDO es obligatoria");
        }
        if (!config.condoSubdomain) {
            return Alert.alert("Error", "El subdominio del condominio es obligatorio (ej: semeruco)");
        }

        setSaving(true);
        setStatusBanner(null);
        try {
            await api.updateIacondoConfig(config);
            setStatusBanner({ type: 'success', text: 'Configuración guardada exitosamente en la base de datos' });
            Alert.alert("Éxito", "Configuración de IACONDO guardada correctamente");
            loadData();
        } catch (e) {
            setStatusBanner({ type: 'error', text: e.message || 'Error guardando configuración' });
            Alert.alert("Error", e.message || "No se pudo guardar la configuración");
        } finally {
            setSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setStatusBanner(null);
        try {
            const res = await api.testIacondoConnection({
                apiUrl: config.apiUrl,
                apiKey: config.apiKey,
                condoSubdomain: config.condoSubdomain,
                webhookUrl: config.webhookUrl
            });

            if (res.success) {
                setStatusBanner({ type: 'success', text: res.message || 'Conexión exitosa con IACONDO' });
                Alert.alert("Conexión Exitosa", res.message || "Se conectó correctamente a la API de IACONDO con las credenciales registradas.");
            } else {
                setStatusBanner({ type: 'error', text: res.message || 'Fallo de autenticación o conexión' });
                Alert.alert("Error de Conexión", res.message || "No se pudo autenticar con IACONDO.");
            }
        } catch (e) {
            setStatusBanner({ type: 'error', text: e.message });
            Alert.alert("Error", e.message || "Error al probar conexión");
        } finally {
            setTesting(false);
        }
    };

    const handleSendSampleQuote = async () => {
        setSendingSample(true);
        setStatusBanner(null);
        try {
            const samplePayload = {
                condoSubdomain: config.condoSubdomain || 'semeruco',
                sourceApp: 'ProfesionalCercano',
                serviceCategory: 'Plomería / Bombas de Agua',
                jobTitle: 'Reparación de Bomba Principal Hidroneumático',
                jobDescription: 'Sustitución de sello mecánico y rodamientos de motor de 5HP',
                urgency: 'ALTA',
                professional: {
                    name: 'HidroServicios La Castellana C.A.',
                    legalId: 'J-31456789-0',
                    phone: '0414-9876543',
                    email: 'contacto@hidroservicios.com',
                    rating: 4.9
                },
                quote: {
                    quoteNumber: `PC-${Date.now().toString().slice(-6)}`,
                    amount: 350.00,
                    currency: 'USD',
                    laborCost: 200.00,
                    materialsCost: 150.00,
                    pdfUrl: 'https://storage.profesionalcercano.com/cotizaciones/PC-0891.pdf',
                    photos: [
                        'https://storage.profesionalcercano.com/evidencias/foto1.jpg'
                    ],
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                webhookUrl: config.webhookUrl
            };

            const res = await api.sendQuoteToIacondo(samplePayload);
            setStatusBanner({ type: 'success', text: `Cotización ${res.quoteNumber || ''} exportada a IACONDO correctamente` });
            Alert.alert("Cotización Exportada", `Se envió la cotización ${res.quoteNumber} a IACONDO mediante POST /maintenance-quotes.`);
            loadData();
        } catch (e) {
            setStatusBanner({ type: 'error', text: e.message || 'Error al exportar cotización' });
            Alert.alert("Error de Exportación", e.message || "No se pudo exportar la cotización de prueba");
        } finally {
            setSendingSample(false);
        }
    };

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Header info */}
            <View style={{ backgroundColor: '#0284C7', padding: 18, borderRadius: 14, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MaterialCommunityIcons name="home-city" size={26} color="white" style={{ marginRight: 10 }} />
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Integración IACONDO</Text>
                </View>
                <Text style={{ color: '#E0F2FE', fontSize: 13, lineHeight: 18 }}>
                    Envía cotizaciones, presupuestos de reparaciones y fichas de profesionales directamente a la plataforma de gestión de condominios.
                </Text>
            </View>

            {/* Status Banner */}
            {statusBanner && (
                <View style={{
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                    backgroundColor: statusBanner.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                    borderWidth: 1,
                    borderColor: statusBanner.type === 'success' ? '#86EFAC' : '#FCA5A5',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <Feather
                        name={statusBanner.type === 'success' ? 'check-circle' : 'alert-circle'}
                        size={18}
                        color={statusBanner.type === 'success' ? '#16A34A' : '#DC2626'}
                        style={{ marginRight: 8 }}
                    />
                    <Text style={{
                        flex: 1,
                        color: statusBanner.type === 'success' ? '#166534' : '#991B1B',
                        fontSize: 13,
                        fontWeight: '500'
                    }}>
                        {statusBanner.text}
                    </Text>
                </View>
            )}

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.statNumber, { color: '#0369A1' }]}>{stats.quotesSent || 0}</Text>
                    <Text style={styles.statLabel}>Cotizaciones Enviadas</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.statNumber, { color: '#15803D' }]}>{stats.quotesApproved || 0}</Text>
                    <Text style={styles.statLabel}>Aprobadas</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.statNumber, { color: '#B91C1C' }]}>{stats.quotesRejected || 0}</Text>
                    <Text style={styles.statLabel}>Rechazadas</Text>
                </View>
            </View>

            {/* Parámetros de Configuración */}
            <View style={{ backgroundColor: 'white', padding: 18, borderRadius: 14, marginBottom: 16, elevation: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 14 }}>
                    Parámetros de Conexión
                </Text>

                {/* Subdominio */}
                <Text style={styles.label}>Subdominio del Condominio (CONDO_SUBDOMAIN)</Text>
                <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    value={config.condoSubdomain}
                    onChangeText={t => setConfig({ ...config, condoSubdomain: t })}
                    placeholder="ej: semeruco"
                    autoCapitalize="none"
                />

                {/* API Key */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.label}>API Key de IACONDO (x-api-key)</Text>
                    <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                        <Text style={{ color: '#0284C7', fontSize: 12, fontWeight: 'bold' }}>
                            {showApiKey ? 'Ocultar' : 'Ver Clave'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    value={config.apiKey}
                    onChangeText={t => setConfig({ ...config, apiKey: t })}
                    placeholder="Clave otorgada por el condominio..."
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                />

                {/* API URL */}
                <Text style={styles.label}>URL Base de la API (IACONDO_API_URL)</Text>
                <TextInput
                    style={[styles.input, { marginBottom: 12 }]}
                    value={config.apiUrl}
                    onChangeText={t => setConfig({ ...config, apiUrl: t })}
                    placeholder="https://condopro-api.onrender.com/api/integrations/v1"
                    autoCapitalize="none"
                />

                {/* Webhook URL */}
                <Text style={styles.label}>URL del Webhook de Retorno (webhookUrl)</Text>
                <TextInput
                    style={[styles.input, { marginBottom: 14 }]}
                    value={config.webhookUrl}
                    onChangeText={t => setConfig({ ...config, webhookUrl: t })}
                    placeholder="https://.../api/webhooks/iacondo-status"
                    autoCapitalize="none"
                />

                {/* Toggle Activo */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 18 }}>
                    <View>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>Integración Activa</Text>
                        <Text style={{ fontSize: 12, color: '#64748B' }}>Habilitar exportación de cotizaciones</Text>
                    </View>
                    <Switch
                        value={config.isActive}
                        onValueChange={v => setConfig({ ...config, isActive: v })}
                        trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                        thumbColor={config.isActive ? '#0284C7' : '#9CA3AF'}
                    />
                </View>

                {/* Botón Guardar */}
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={[styles.saveButton, { backgroundColor: '#0284C7', marginBottom: 10 }]}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather name="save" size={18} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Botones de Prueba */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        onPress={handleTestConnection}
                        disabled={testing}
                        style={{
                            flex: 1,
                            backgroundColor: '#10B981',
                            padding: 12,
                            borderRadius: 10,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        {testing ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Feather name="activity" size={16} color="white" style={{ marginRight: 6 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Probar Conexión</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSendSampleQuote}
                        disabled={sendingSample}
                        style={{
                            flex: 1,
                            backgroundColor: '#6366F1',
                            padding: 12,
                            borderRadius: 10,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center'
                        }}
                    >
                        {sendingSample ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Feather name="send" size={16} color="white" style={{ marginRight: 6 }} />
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>Enviar Cotización</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Historial de Envíos */}
            <View style={{ backgroundColor: 'white', padding: 18, borderRadius: 14, marginBottom: 30, elevation: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E293B' }}>
                        Historial de Sincronización
                    </Text>
                    <TouchableOpacity onPress={loadData}>
                        <Feather name="refresh-cw" size={16} color="#0284C7" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color="#0284C7" style={{ marginVertical: 15 }} />
                ) : history.length === 0 ? (
                    <Text style={{ color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15 }}>
                        No hay registros de sincronización aún.
                    </Text>
                ) : (
                    history.slice(0, 10).map((item, index) => {
                        const isSuccess = item.status === 'sent' || item.status === 'approved';
                        const isApproved = item.status === 'approved';
                        const isRejected = item.status === 'rejected';

                        return (
                            <View
                                key={index}
                                style={{
                                    borderBottomWidth: index === history.length - 1 ? 0 : 1,
                                    borderBottomColor: '#F1F5F9',
                                    paddingVertical: 10
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#1E293B' }}>
                                        {item.quoteNumber || 'Cotización'}
                                    </Text>
                                    <View style={{
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                        backgroundColor: isApproved ? '#DCFCE7' : (isRejected ? '#FEE2E2' : (isSuccess ? '#E0F2FE' : '#FEF3C7'))
                                    }}>
                                        <Text style={{
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            color: isApproved ? '#166534' : (isRejected ? '#991B1B' : (isSuccess ? '#0369A1' : '#92400E'))
                                        }}>
                                            {(item.status || 'SENT').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={{ color: '#4B5563', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                    {item.jobTitle || 'Mantenimiento en condominio'}
                                </Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F172A' }}>
                                        {item.amount ? `${item.currency || 'USD'} $${Number(item.amount).toFixed(2)}` : ''}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                                        {item.sentAt ? new Date(item.sentAt).toLocaleDateString() : 'Reciente'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: 15, paddingTop: 40 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 10,
        paddingBottom: Platform.OS === 'android' ? 35 : 25,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: Platform.OS === 'android' ? 80 : 70
    },

    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1F2937' },
    statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statCard: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
    statLabel: { fontSize: 12, color: '#4B5563', textAlign: 'center' },

    label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 5 },

    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', padding: 15, borderRadius: 10, marginBottom: 10 },
    actionText: { color: 'white', fontWeight: 'bold', marginLeft: 10 },

    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
    cardTitle: { fontWeight: 'bold', fontSize: 16 },
    cardSubtitle: { color: '#6B7280', fontSize: 12 },
    verifyButton: { backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },

    input: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB' },
    saveButton: { backgroundColor: '#2563EB', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveButtonText: { color: 'white', fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        padding: 20,
        elevation: 10,
        maxHeight: '90%'
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1E293B', textAlign: 'center' }
});