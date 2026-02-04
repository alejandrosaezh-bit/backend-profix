import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../utils/api';

const AVAILABLE_ICONS = [
    { name: 'home', lib: Feather },
    { name: 'car', lib: FontAwesome5 },
    { name: 'heart', lib: Feather },
    { name: 'monitor', lib: Feather },
    { name: 'scissors', lib: Feather },
    { name: 'calendar', lib: Feather },
    { name: 'cat', lib: FontAwesome5 },
    { name: 'briefcase', lib: Feather },
    { name: 'tool', lib: Feather },
    { name: 'truck', lib: Feather },
    { name: 'shopping-bag', lib: Feather },
    { name: 'book', lib: Feather },
    { name: 'music', lib: Feather },
    { name: 'camera', lib: Feather },
    { name: 'smile', lib: Feather },
    { name: 'map-pin', lib: Feather },
    { name: 'wifi', lib: Feather },
    { name: 'gift', lib: Feather }
];

export default function AdminScreens({ onBack }) {
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
            default: return <Dashboard setActiveTab={setActiveTab} />;
        }
    };

    return (
        <View style={styles.container}>
            {/* Custom Header for Requests vs Standard Header */}
            {activeTab === 'requests' ? (
                <View style={[styles.header, { flexDirection: 'column', alignItems: 'center', paddingTop: 40, paddingBottom: 15, height: 'auto' }]}>
                    <Text style={[styles.headerTitle, { fontSize: 18, marginBottom: 10 }]}>Solicitudes</Text>

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
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TouchableOpacity onPress={onBack} style={{ padding: 5, marginRight: 10 }}>
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Panel de Control</Text>
                    </View>
                    <View style={{ width: 30 }} />
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
                                source={{ uri: `data:image/jpeg;base64,${selectedUser.avatar}` }}
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
                        {selectedUser.profiles && Object.keys(selectedUser.profiles).map(k => (
                            <View key={k} style={{ padding: 5, backgroundColor: '#E0E7FF', borderRadius: 5 }}>
                                <Text style={{ color: '#3730A3', fontSize: 12, fontWeight: 'bold' }}>{k}</Text>
                            </View>
                        ))}
                        {(!selectedUser.profiles || Object.keys(selectedUser.profiles).length === 0) && <Text style={{ color: '#999' }}>Ninguno</Text>}
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
    const [subcats, setSubcats] = useState('');
    const [icon, setIcon] = useState('home');
    const [color, setColor] = useState('#FFF7ED');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await api.getCategories();
            setCategories(data);
        } catch (e) {
            console.log("Error loading categories", e);
        }
    };

    const handleSave = async () => {
        if (!name) return Alert.alert("Error", "El nombre es requerido");
        try {
            const subcategoriesArray = subcats.split(',').map(s => s.trim()).filter(s => s);
            const payload = { name, subcategories: subcategoriesArray, icon, color };

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
        setSubcats(cat.subcategories.join(', '));
        setIcon(cat.icon || 'home');
        setColor(cat.color || '#FFF7ED');
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Eliminar Categoría",
            "¿Estás seguro? Esto no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar", style: "destructive", onPress: async () => {
                        try {
                            await api.deleteCategory(id);
                            loadCategories();
                        } catch (e) {
                            Alert.alert("Error", "No se pudo eliminar");
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setSubcats('');
        setIcon('home');
        setColor('#FFF7ED');
    };

    return (
        <ScrollView>
            <Text style={styles.sectionTitle}>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</Text>
            <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
                <TextInput style={styles.input} placeholder="Nombre (ej. Hogar)" value={name} onChangeText={setName} />

                <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#374151' }}>Selecciona un Icono:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                    {AVAILABLE_ICONS.map((item) => (
                        <TouchableOpacity
                            key={item.name}
                            onPress={() => setIcon(item.name)}
                            style={{
                                padding: 10,
                                borderRadius: 8,
                                backgroundColor: icon === item.name ? '#DBEAFE' : '#F3F4F6',
                                borderWidth: 1,
                                borderColor: icon === item.name ? '#2563EB' : 'transparent'
                            }}
                        >
                            <item.lib name={item.name} size={24} color={icon === item.name ? '#2563EB' : '#6B7280'} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TextInput style={styles.input} placeholder="Color Hex (ej. #FFF7ED)" value={color} onChangeText={setColor} />
                <TextInput style={[styles.input, { height: 80 }]} placeholder="Subcategorías (separadas por coma)" multiline value={subcats} onChangeText={setSubcats} />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>{editingId ? 'Actualizar' : 'Crear'}</Text>
                    </TouchableOpacity>
                    {editingId && (
                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#6B7280', flex: 1 }]} onPress={resetForm}>
                            <Text style={styles.saveButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <Text style={styles.sectionTitle}>Categorías Existentes</Text>
            {categories.length === 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>No se encontraron categorías.</Text>
                    <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>Verifica que el backend esté corriendo y conectado.</Text>
                </View>
            )}
            {categories.map(cat => (
                <View key={cat._id} style={styles.card}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{cat.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{cat.subcategories.length} subcategorías</Text>
                        <Text style={{ fontSize: 10, color: '#999' }}>{cat.subcategories.join(', ')}</Text>
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
                                        <Image source={{ uri: img }} style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }} />
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
                                            <Image source={{ uri: `data:image/jpeg;base64,${pro.avatar}` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
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
            allowsEditing: true,
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
                        <Image source={{ uri: form.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
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
                        {ad.image ? <Image source={{ uri: ad.image }} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 10 }} /> : null}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', padding: 15, paddingTop: 40 },
    headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    content: { flex: 1, padding: 20 },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#E5E7EB' },

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
    saveButtonText: { color: 'white', fontWeight: 'bold' }
});