import {
    ArrowLeft,
    Briefcase,
    Camera,
    Car,
    Cat,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    ClipboardList,
    CreditCard,
    Crosshair,
    Crown,
    Edit2,
    Globe,
    Hammer,
    Home,
    ImagePlus,
    List,
    Lock,
    Mail,
    MapPin,
    MessageSquare,
    Music,
    PlayCircle,
    ScanFace,
    Scissors,
    Send,
    Shield,
    Star,
    Stethoscope,
    Store,
    User,
    UserCheck,
    Wifi,
    X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// --- DATOS DE PRUEBA (MOCK DATA) ---

const DETAILED_CATEGORIES = {
  "Hogar": ["Aire Acondicionado", "Albañilería", "Arquitectura", "Carpintería", "Cerrajería", "Control de Plagas", "Decoración", "Electricidad", "Gasfitería / Plomería", "Herrería", "Jardinería", "Limpieza", "Mudanzas", "Pintura", "Piscinas", "Reformas", "Seguridad", "Tapicería"],
  "Automotriz": ["Mecánica General", "Aire Acondicionado / Climatización", "Lavado a Domicilio", "Cambio de Aceite", "Grúa / Remolque", "Electricidad Automotriz", "Cerrajería de Autos", "Cauchos / Llantas", "Polarizados"],
  "Salud y Bienestar": ["Fisioterapia", "Enfermería", "Cuidado de Ancianos", "Psicología", "Podología", "Entrenador Personal", "Masajes Terapéuticos", "Nutrición"],
  "Legal y Trámites": ["Abogado Civil", "Abogado Penal", "Gestoría Administrativa", "Contador / Impuestos", "Notaría Express", "Trámites Vehiculares"],
  "Tecnología": ["Computación", "Celulares y Tablets", "Redes y WiFi", "Cámaras de Seguridad", "Domótica", "Soporte Remoto"],
  "Mascotas": ["Veterinario", "Paseador", "Peluquería Canina", "Adiestramiento", "Guardería / Hotel"],
  "Belleza": ["Peluquería", "Barbería", "Manicure / Pedicure", "Maquillaje", "Depilación"],
  "Eventos": ["Fotografía", "DJ / Música", "Catering", "Decoración", "Animación", "Mesoneros"]
};

const CATEGORIES_DISPLAY = [
  { id: 'hogar', name: 'Hogar', fullName: "Hogar", icon: Hammer, color: '#FFF7ED', iconColor: '#EA580C' },
  { id: 'auto', name: 'Autos', fullName: "Automotriz", icon: Car, color: '#EFF6FF', iconColor: '#2563EB' },
  { id: 'salud', name: 'Salud', fullName: "Salud y Bienestar", icon: Stethoscope, color: '#F0FDF4', iconColor: '#16A34A' },
  { id: 'legal', name: 'Legal', fullName: "Legal y Trámites", icon: Briefcase, color: '#F8FAFC', iconColor: '#475569' },
  { id: 'tech', name: 'Tech', fullName: "Tecnología", icon: Wifi, color: '#FAF5FF', iconColor: '#9333EA' },
  { id: 'pets', name: 'Mascotas', fullName: "Mascotas", icon: Cat, color: '#FEFCE8', iconColor: '#CA8A04' },
  { id: 'beauty', name: 'Belleza', fullName: "Belleza", icon: Scissors, color: '#FDF2F8', iconColor: '#DB2777' },
  { id: 'events', name: 'Eventos', fullName: "Eventos", icon: Music, color: '#FEF2F2', iconColor: '#DC2626' },
];

const PROFESSIONALS = [
  {
    id: 1,
    name: "Carlos Méndez",
    category: "Hogar",
    subcategory: "Aire Acondicionado",
    role: "Técnico Certificado HVAC",
    rating: 4.9,
    reviews: 124,
    verified: true,
    priceRange: "$$",
    image: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=150&h=150",
    description: "Especialista en climatización con 10 años de experiencia. Trabajo con todas las marcas.",
    location_zone: "Caracas, Baruta",
    languages: ["Español", "Inglés Técnico"],
    paymentMethods: ["Efectivo", "Zelle", "Pago Móvil"],
    warranty: "3 Meses de garantía",
    certifications: ["Certificado Daikin", "Licencia Seguridad"],
    coverImage: "https://images.unsplash.com/photo-1621905476059-5f34604809f6?auto=format&fit=crop&q=80&w=800",
    about: "Técnico certificado con más de 10 años de experiencia en sistemas de climatización. Me especializo en reparaciones complejas y mantenimiento preventivo.",
    stats: { jobsCompleted: 124, responseTime: "1 hora", repeatHires: "95%" },
    portfolio: [
        { id: 101, before: "https://images.unsplash.com/photo-1621905476059-5f34604809f6?w=200", after: "https://images.unsplash.com/photo-1581094794329-cd11965d1169?w=200", desc: "Mantenimiento Split 12BTU" }
    ],
    reviewsList: [
        { id: 1, user: "Roberto P.", rating: 5, date: "Hace 2 días", text: "Llegó puntual y resolvió el problema." },
    ]
  },
  {
    id: 2,
    name: "Dra. Ana Ruiz",
    category: "Salud y Bienestar",
    subcategory: "Fisioterapia",
    role: "Fisioterapeuta",
    rating: 5.0,
    reviews: 89,
    verified: true,
    priceRange: "$$$",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150",
    description: "Especialista en rehabilitación deportiva y post-operatoria.",
    location_zone: "Caracas, Chacao",
    languages: ["Español"],
    paymentMethods: ["Zelle", "Efectivo"],
    warranty: "Seguimiento post-sesión",
    certifications: ["Colegio de Fisioterapeutas"],
    coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800",
    about: "Fisioterapeuta con enfoque en recuperación deportiva.",
    stats: { jobsCompleted: 89, responseTime: "2 horas", repeatHires: "98%" },
    portfolio: [],
    reviewsList: []
  }
];

const TESTIMONIALS = [
    { id: 1, user: "Camilo Acosta", text: "Me ha salvado en varias ocasiones. Encuentro todo tipo de servicios.", stars: 5 },
    { id: 2, user: "Lucia Esperanza", text: "Encontré un cerrajero en 5 minutos. Muy segura y fácil de usar.", stars: 5 },
    { id: 3, user: "Mariano Rios", text: "Tuve un montón de presupuestos al instante.", stars: 4 }
];

const BLOG_POSTS = [
    { id: 1, title: "5 señales de alerta en tu instalación eléctrica", image: "https://images.unsplash.com/photo-1621905476059-5f34604809f6?w=200", category: "Hogar" },
    { id: 2, title: "¿Cómo preparar tu auto para un viaje largo?", image: "https://images.unsplash.com/photo-1486262715619-01b8c247a327?w=200", category: "Automotriz" }
];

const CLIENT_PROFILE_DATA = {
    name: "María G.",
    joinDate: "Oct 2023",
    location: "Caracas, Baruta",
    rating: 4.9,
    jobsPosted: 12,
    image: "https://i.pravatar.cc/150?img=5",
    badges: ["Pago Verificado", "Cliente Frecuente"],
    reviews: [ { id: 1, pro: "Carlos M.", rating: 5, comment: "Excelente cliente." } ]
};

const MY_REQUESTS_DATA = [
    { id: 201, title: "Instalación de Ventilador", status: "Finalizado", date: "Hoy, 10:30 AM", color: "#FAF5FF", textColor: "#9333EA", actionRequired: true, proName: "Carlos Méndez" },
    { id: 202, title: "Consulta Legal Express", status: "En Proceso", date: "Ayer", color: "#EFF6FF", textColor: "#2563EB", actionRequired: false, proName: "Bufete Martínez" }
];

const INCOMING_LEADS_DATA = [
  { id: 101, client: "María González", title: "Reparación de filtración urgente", category: "Plomería", location: "Caracas, Baruta, El Cafetal", distance: "A 2.5 km", description: "Tengo una filtración fuerte debajo del fregadero de la cocina. Necesito reparación hoy mismo.", time: "Hace 10 min" },
  { id: 102, client: "Roberto Perez", title: "Mantenimiento Preventivo A/A", category: "Aire Acondicionado", location: "Caracas, Chacao", distance: "A 5.0 km", description: "Requiero limpieza de dos unidades split.", time: "Hace 45 min" }
];

const FEATURED_JOBS = [
    { id: 1, title: "Remodelación Cocina", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300", rating: 5.0, category: "Hogar" },
    { id: 2, title: "Instalación Red Oficina", image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=300", rating: 4.9, category: "Tecnología" },
    { id: 3, title: "Restauración Pintura", image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300", rating: 4.8, category: "Automotriz" }
];

const FEATURED_BUSINESSES = {
    "Automotriz": [{ id: 1, name: "AutoRepuestos 24/7", promo: "10% Desc. en Baterías", image: "https://images.unsplash.com/photo-1486262715619-01b8c247a327?w=300" }],
    "Hogar": [{ id: 2, name: "Ferretería La Llave", promo: "Pinturas al mayor", image: "https://images.unsplash.com/photo-1513467656343-48472d2b4713?w=300" }]
};

// --- COMPONENTES AUXILIARES ---

const ZoneMap = ({ locationText, isApprox = true, editable = false, onEdit }) => (
    <View style={styles.zoneMapContainer}>
        <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Map_of_Caracas.png/640px-Map_of_Caracas.png' }} style={styles.mapImage} />
        <View style={[styles.mapOverlay, { opacity: 0.4 }]} />
        <View style={styles.mapPinContainer}>
            <View style={[styles.mapCircle, { borderColor: isApprox ? '#3B82F6' : '#EF4444', backgroundColor: isApprox ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                <View style={[styles.mapDot, { backgroundColor: isApprox ? '#2563EB' : '#DC2626' }]} />
            </View>
        </View>
        <View style={styles.mapLabel}>
             <MapPin size={12} color="#6B7280" style={{marginRight: 4}} />
             <Text style={styles.mapLabelText} numberOfLines={1}>{locationText || "Zona no definida"}</Text>
        </View>
        {editable && <TouchableOpacity style={styles.mapEditBtn} onPress={onEdit}><Edit2 size={14} color="#2563EB" /></TouchableOpacity>}
    </View>
);

const Header = ({ userMode, toggleMode, isLoggedIn, onLoginPress, currentUser }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <View style={[styles.logoIcon, { backgroundColor: userMode === 'client' ? '#F97316' : '#2563EB' }]}>
        {userMode === 'client' ? <Hammer color="white" size={18} /> : <Briefcase color="white" size={18} />}
      </View>
      <Text style={styles.logoText}>ProFix</Text>
    </View>
    <View style={styles.headerRight}>
      {isLoggedIn ? (
        <TouchableOpacity style={styles.modeButton} onPress={toggleMode}>
          <Text style={styles.modeButtonText}>
            {userMode === 'client' ? 'Modo Cliente' : 'Soy Pro'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.loginButtonHeader} onPress={onLoginPress}>
          <Text style={styles.loginButtonHeaderText}>Entrar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.profileButton}>
         {isLoggedIn && currentUser?.image ? (
             <Image source={{uri: currentUser.image}} style={{width:24, height:24, borderRadius:12}} />
         ) : (
             <User color="#4B5563" size={24} />
         )}
      </TouchableOpacity>
    </View>
  </View>
);

const BottomNav = ({ view, setView, userMode }) => (
    <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setView('home')}>
            <Home size={24} color={view === 'home' ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view === 'home' && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Inicio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setView(userMode==='client' ? 'my-requests' : 'home')}>
            {userMode === 'client' ? <List size={24} color={view === 'my-requests' ? '#EA580C' : '#9CA3AF'} /> : <ClipboardList size={24} color={view === 'home' ? '#2563EB' : '#9CA3AF'} />}
            <Text style={[styles.navText, (view === 'my-requests' || (view === 'home' && userMode === 'pro')) && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Pedidos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setView('chat-list')}>
            <MessageSquare size={24} color={view === 'chat-list' ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view === 'chat-list' && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setView(userMode === 'client' ? 'client-profile' : 'pro-profile-edit')}>
            <User size={24} color={view.includes('profile') ? (userMode==='client'?'#EA580C':'#2563EB') : '#9CA3AF'} />
            <Text style={[styles.navText, view.includes('profile') && {color: userMode==='client'?'#EA580C':'#2563EB'}]}>Perfil</Text>
        </TouchableOpacity>
    </View>
);

const AuthModal = ({ visible, onClose, onLogin }) => {
  const [role, setRole] = useState('client');
  const [step, setStep] = useState('login'); 

  const handleRegister = () => {
      if (role === 'pro') setStep('pro-onboarding');
      else onLogin({ role: 'client', name: 'Nuevo Cliente', image: 'https://i.pravatar.cc/150?img=12' });
  };

  const handleProFinish = () => {
      onLogin({ role: 'pro', name: 'Nuevo Profesional', image: 'https://i.pravatar.cc/150?img=68' });
  };

  if (step === 'pro-onboarding') {
      return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}><X size={24} color="#9CA3AF" /></TouchableOpacity>
                    <View style={styles.authHeader}>
                        <Text style={styles.authTitle}>Verificación Profesional</Text>
                        <Text style={styles.authSubtitle}>Para garantizar la seguridad, necesitamos validar tu identidad.</Text>
                    </View>
                    
                    <View style={styles.idVerificationContainer}>
                        <TouchableOpacity style={styles.idButton}>
                            <CreditCard size={32} color="#2563EB" />
                            <Text style={styles.idButtonText}>Escanear Cédula</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.idButton}>
                            <View>
                                <UserCheck size={32} color="#2563EB" />
                                <View style={styles.scanIconBadge}><ScanFace size={12} color="white" /></View>
                            </View>
                            <Text style={styles.idButtonText}>Selfie con Cédula</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <Text style={styles.verificationNote}>
                        * Sostén tu documento al lado de tu rostro. La imagen debe ser clara y legible.
                    </Text>

                    <TouchableOpacity style={styles.mainAuthButton} onPress={handleProFinish}>
                        <Text style={styles.mainAuthButtonText}>Enviar y Finalizar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      );
  }
  
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <View style={styles.authHeader}>
            <View style={styles.authIconContainer}><User size={32} color="#EA580C" /></View>
            <Text style={styles.authTitle}>Bienvenido a ProFix</Text>
            <Text style={styles.authSubtitle}>Accede a tu cuenta para continuar</Text>
          </View>
          <View style={styles.roleSwitchContainer}>
            <TouchableOpacity style={[styles.roleButton, role === 'client' && styles.roleButtonActive]} onPress={() => setRole('client')}>
              <Text style={[styles.roleButtonText, role === 'client' && styles.roleButtonTextActive]}>Soy Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.roleButton, role === 'pro' && styles.roleButtonActivePro]} onPress={() => setRole('pro')}>
              <Text style={[styles.roleButtonText, role === 'pro' && styles.roleButtonTextActive]}>Soy Profesional</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.authInputWrapper}>
              <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput placeholder="Correo electrónico" style={styles.input} keyboardType="email-address" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <View style={styles.authInputWrapper}>
              <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput placeholder="Contraseña" style={styles.input} secureTextEntry />
            </View>
          </View>
          <TouchableOpacity style={styles.mainAuthButton} onPress={handleRegister}>
            <Text style={styles.mainAuthButtonText}>{step === 'login' ? 'Iniciar Sesión' : 'Continuar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(step === 'login' ? 'register' : 'login')}>
              <Text style={styles.switchAuthText}>{step === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const ClientProfileView = ({ onBack }) => (
    <View style={{flex: 1, backgroundColor: '#F9FAFB'}}>
        <View style={{height: 120, backgroundColor: '#F97316'}}>
            <TouchableOpacity onPress={onBack} style={{position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20}}>
                <ArrowLeft color="white" size={20} />
            </TouchableOpacity>
        </View>
        <View style={{paddingHorizontal: 20, marginTop: -60}}>
            <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5}}>
                <Image source={{uri: CLIENT_PROFILE_DATA.image}} style={{width: 100, height: 100, borderRadius: 50, marginTop: -50, borderWidth: 4, borderColor: 'white'}} />
                <Text style={{fontSize: 22, fontWeight: 'bold', marginTop: 10}}>{CLIENT_PROFILE_DATA.name}</Text>
                <Text style={{color: '#6B7280'}}>Cliente desde {CLIENT_PROFILE_DATA.joinDate}</Text>
                
                <View style={{flexDirection: 'row', marginTop: 10, flexWrap: 'wrap', justifyContent: 'center'}}>
                    {CLIENT_PROFILE_DATA.badges.map((b,i) => (
                        <View key={i} style={{backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, margin: 2, flexDirection: 'row', alignItems: 'center'}}>
                            <CheckCircle size={12} color="#16A34A" style={{marginRight:4}} />
                            <Text style={{color: '#166534', fontSize: 10, fontWeight: 'bold'}}>{b}</Text>
                        </View>
                    ))}
                </View>

                <View style={{flexDirection: 'row', marginTop: 15, width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15}}>
                    <View style={{alignItems: 'center'}}><Text style={{fontSize: 18, fontWeight: 'bold'}}>{CLIENT_PROFILE_DATA.jobsPosted}</Text><Text style={{fontSize: 10, color: '#6B7280'}}>PEDIDOS</Text></View>
                    <View style={{alignItems: 'center'}}><Text style={{fontSize: 18, fontWeight: 'bold'}}>{CLIENT_PROFILE_DATA.rating}</Text><Text style={{fontSize: 10, color: '#6B7280'}}>RATING</Text></View>
                </View>
            </View>

            <View style={{marginTop: 20}}>
                <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#1F2937'}}>Opiniones de Profesionales</Text>
                {CLIENT_PROFILE_DATA.reviews.map((r, i) => (
                    <View key={i} style={{backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB'}}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                            <Text style={{fontWeight: 'bold', color: '#1F2937'}}>{r.pro}</Text>
                            <View style={{flexDirection: 'row'}}>{[...Array(r.rating)].map((_,k)=><Star key={k} size={12} color="#FBBF24" fill="#FBBF24" />)}</View>
                        </View>
                        <Text style={{fontSize: 12, color: '#4B5563', fontStyle: 'italic'}}>"{r.comment}"</Text>
                    </View>
                ))}
            </View>
        </View>
    </View>
);

const ProProfileEditView = ({ currentUser, onBack }) => {
    const pro = currentUser || PROFESSIONALS[0];
    const displayPro = { ...PROFESSIONALS[0], ...pro, stats: pro.stats || PROFESSIONALS[0].stats, reviewsList: pro.reviewsList || PROFESSIONALS[0].reviewsList };

    return (
        <ScrollView style={{flex: 1, backgroundColor: '#F9FAFB'}}>
            <View style={{height: 180, backgroundColor: '#1F2937'}}>
                <Image source={{uri: displayPro.coverImage || PROFESSIONALS[0].coverImage}} style={{width: '100%', height: '100%', opacity: 0.6}} />
                <View style={{position:'absolute', inset:0, alignItems:'center', justifyContent:'center'}}>
                    <TouchableOpacity style={{backgroundColor:'rgba(255,255,255,0.2)', flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.5)'}}>
                        <Camera size={14} color="white" style={{marginRight:6}} />
                        <Text style={{color:'white', fontSize:12, fontWeight:'bold'}}>Editar Portada</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={onBack} style={{position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20}}>
                    <ArrowLeft color="white" size={20} />
                </TouchableOpacity>
            </View>

            <View style={{paddingHorizontal: 20, marginTop: -60, paddingBottom: 40}}>
                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <View style={{marginTop: -50}}>
                            <Image source={{uri: displayPro.image}} style={{width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'white'}} />
                            {displayPro.verified && <View style={{position:'absolute', bottom:0, right:0, backgroundColor:'#2563EB', borderRadius:12, padding:2, borderWidth:2, borderColor:'white'}}><CheckCircle size={14} color="white" /></View>}
                        </View>
                        <TouchableOpacity><Edit2 size={18} color="#2563EB" /></TouchableOpacity>
                    </View>
                    
                    <View style={{marginTop: 10}}>
                        <Text style={{fontSize: 22, fontWeight: 'bold', color: '#1F2937'}}>{displayPro.name}</Text>
                        <Text style={{color: '#2563EB', fontWeight: '600', marginBottom: 4}}>{displayPro.role}</Text>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <MapPin size={14} color="#9CA3AF" style={{marginRight:4}} />
                            <Text style={{color: '#6B7280', fontSize: 12}}>{displayPro.location_zone}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6'}}>
                        <View style={{flex:1, alignItems: 'center'}}>
                            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#1F2937'}}>{displayPro.stats.jobsCompleted}</Text>
                            <Text style={{fontSize: 10, color: '#6B7280', fontWeight:'bold'}}>TRABAJOS</Text>
                        </View>
                        <View style={{width:1, height:'100%', backgroundColor:'#E5E7EB'}} />
                        <View style={{flex:1, alignItems: 'center'}}>
                            <View style={{flexDirection:'row', alignItems:'center'}}>
                                <Text style={{fontSize: 18, fontWeight: 'bold', color: '#1F2937'}}>{displayPro.rating}</Text>
                                <Star size={14} color="#FBBF24" fill="#FBBF24" style={{marginLeft:4}} />
                            </View>
                            <Text style={{fontSize: 10, color: '#6B7280', fontWeight:'bold'}}>VALORACIÓN</Text>
                        </View>
                        <View style={{width:1, height:'100%', backgroundColor:'#E5E7EB'}} />
                        <View style={{flex:1, alignItems: 'center'}}>
                            <Text style={{fontSize: 18, fontWeight: 'bold', color: '#1F2937'}}>{displayPro.stats.repeatHires}</Text>
                            <Text style={{fontSize: 10, color: '#6B7280', fontWeight:'bold'}}>REPETICIÓN</Text>
                        </View>
                    </View>
                </View>

                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937'}}>Sobre mí</Text>
                        <TouchableOpacity><Edit2 size={16} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <Text style={{color: '#4B5563', lineHeight: 20, fontSize: 14}}>{displayPro.about || displayPro.description}</Text>
                </View>

                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 15}}>Detalles Profesionales</Text>
                    
                    <View style={{flexDirection:'row', marginBottom: 15}}>
                        <Globe size={20} color="#9CA3AF" style={{marginRight: 12}} />
                        <View>
                            <Text style={{fontSize: 10, color:'#9CA3AF', fontWeight:'bold', marginBottom:2}}>IDIOMAS</Text>
                            <View style={{flexDirection:'row', flexWrap:'wrap', gap:6}}>
                                {displayPro.languages.map((l, i) => <View key={i} style={{backgroundColor:'#F3F4F6', paddingHorizontal:8, paddingVertical:2, borderRadius:6}}><Text style={{fontSize:12, color:'#4B5563'}}>{l}</Text></View>)}
                            </View>
                        </View>
                    </View>

                    <View style={{flexDirection:'row', marginBottom: 15}}>
                        <CreditCard size={20} color="#9CA3AF" style={{marginRight: 12}} />
                        <View>
                            <Text style={{fontSize: 10, color:'#9CA3AF', fontWeight:'bold', marginBottom:2}}>MÉTODOS DE PAGO</Text>
                            <Text style={{fontSize:13, color:'#4B5563'}}>{displayPro.paymentMethods.join(", ")}</Text>
                        </View>
                    </View>

                    <View style={{flexDirection:'row', marginBottom: 15}}>
                        <Shield size={20} color="#9CA3AF" style={{marginRight: 12}} />
                        <View>
                            <Text style={{fontSize: 10, color:'#9CA3AF', fontWeight:'bold', marginBottom:2}}>GARANTÍA</Text>
                            <Text style={{fontSize:13, color:'#16A34A', fontWeight:'500'}}>{displayPro.warranty}</Text>
                        </View>
                    </View>
                </View>

                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:15}}>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937'}}>Portafolio</Text>
                        <TouchableOpacity><ImagePlus size={18} color="#2563EB" /></TouchableOpacity>
                    </View>
                    <View style={{flexDirection:'row', flexWrap:'wrap', gap:10}}>
                        {displayPro.portfolio.map((item, i) => (
                            <View key={i} style={{width: '48%', aspectRatio: 1, borderRadius: 8, overflow:'hidden'}}>
                                <Image source={{uri: item.after}} style={{width:'100%', height:'100%'}} />
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937'}}>Zona de Trabajo</Text>
                        <TouchableOpacity><Edit2 size={16} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    <ZoneMap locationText={displayPro.location_zone} isApprox={false} />
                </View>
            </View>
        </ScrollView>
    );
};

const CategoryDetailView = ({ category, onBack, onSelectSubcategory, onSelectPro }) => {
    const subcategories = DETAILED_CATEGORIES[category.fullName] || [];
    const recommendedPros = PROFESSIONALS.filter(pro => pro.category === category.fullName);
    const topJobs = FEATURED_JOBS.filter(job => job.category === category.fullName || job.category === "Hogar");
    const ads = FEATURED_BUSINESSES[category.fullName] || [];

    return (
        <ScrollView style={{flex: 1, backgroundColor: '#F9FAFB'}}>
            <View style={{height: 140, backgroundColor: category.color, justifyContent: 'flex-end', padding: 20}}>
                <TouchableOpacity onPress={onBack} style={{position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.5)', padding: 8, borderRadius: 20}}>
                    <ArrowLeft color="#1F2937" size={20} />
                </TouchableOpacity>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <category.icon size={32} color={category.iconColor} style={{marginRight: 12, opacity: 0.8}} />
                    <View>
                        <Text style={{fontSize: 24, fontWeight: 'bold', color: '#1F2937'}}>{category.fullName}</Text>
                        <Text style={{fontSize: 14, color: '#4B5563', opacity: 0.8}}>¿Qué necesitas hoy?</Text>
                    </View>
                </View>
            </View>

            <View style={{padding: 20}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 24}}>
                    {subcategories.map((sub, i) => (
                        <TouchableOpacity key={i} onPress={() => onSelectSubcategory(sub)} style={{backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB'}}>
                            <Text style={{color: '#374151', fontSize: 12, fontWeight: '600'}}>{sub}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={{marginBottom: 24}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                        <Crown size={16} color="#EAB308" style={{marginRight: 6}} />
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase', letterSpacing: 0.5}}>Profesionales Top</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recommendedPros.map(pro => (
                            <TouchableOpacity key={pro.id} onPress={() => onSelectPro(pro)} style={{backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 12, width: 220, borderWidth: 1, borderColor: '#E5E7EB'}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                                    <Image source={{uri: pro.image}} style={{width: 40, height: 40, borderRadius: 20, marginRight: 10}} />
                                    <View>
                                        <Text style={{fontWeight: 'bold', color: '#1F2937', fontSize: 14}} numberOfLines={1}>{pro.name}</Text>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Star size={12} color="#FBBF24" fill="#FBBF24" />
                                            <Text style={{fontSize: 12, color: '#FBBF24', fontWeight: 'bold', marginLeft: 4}}>{pro.rating}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={{fontSize: 12, color: '#6B7280', marginBottom: 8}} numberOfLines={2}>{pro.description}</Text>
                                <View style={{backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}>
                                    <Text style={{fontSize: 10, color: '#4B5563', fontWeight: '600'}}>{pro.subcategory}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {ads.length > 0 && (
                    <View style={{marginBottom: 24}}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                            <Store size={16} color="#2563EB" style={{marginRight: 6}} />
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase', letterSpacing: 0.5}}>Comercios Destacados</Text>
                        </View>
                        {ads.map((ad, i) => (
                            <View key={i} style={{height: 100, borderRadius: 16, overflow: 'hidden', marginBottom: 10, backgroundColor: '#111827'}}>
                                <Image source={{uri: ad.image}} style={{width: '100%', height: '100%', position: 'absolute', opacity: 0.5}} />
                                <View style={{flex: 1, padding: 16, justifyContent: 'center'}}>
                                    <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>{ad.name}</Text>
                                    <Text style={{color: '#FDE047', fontSize: 14, fontWeight: '600'}}>{ad.promo}</Text>
                                    <TouchableOpacity style={{backgroundColor: 'white', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8}}>
                                        <Text style={{fontSize: 10, fontWeight: 'bold'}}>Ver Oferta</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{marginBottom: 40}}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
                        <Star size={16} color="#9333EA" style={{marginRight: 6}} />
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase', letterSpacing: 0.5}}>Trabajos Mejor Valorados</Text>
                    </View>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 12}}>
                        {topJobs.map(job => (
                            <View key={job.id} style={{width: '48%', backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB'}}>
                                <Image source={{uri: job.image}} style={{width: '100%', height: 100}} />
                                <View style={{padding: 8}}>
                                    <Text style={{fontSize: 12, fontWeight: 'bold', color: '#1F2937'}} numberOfLines={1}>{job.title}</Text>
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
                                        <Text style={{fontSize: 10, color: '#6B7280'}} numberOfLines={1}>{job.category}</Text>
                                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                            <Star size={10} color="#CA8A04" fill="#CA8A04" />
                                            <Text style={{fontSize: 10, color: '#CA8A04', marginLeft: 2}}>{job.rating}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

// --- COMPONENTE NUEVO: MENÚ DESPLEGABLE ---
const CustomDropdown = ({ label, value, options, onSelect, placeholder }) => {
    const [modalVisible, setModalVisible] = useState(false);
  
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity 
          style={styles.pickerContainer} 
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.input, { color: value ? '#1F2937' : '#9CA3AF' }]}>
            {value || placeholder}
          </Text>
          <ChevronDown size={20} color="#6B7280" />
        </TouchableOpacity>
  
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                <Text style={{fontSize:18, fontWeight:'bold', color:'#1F2937'}}>Selecciona {label}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{maxHeight: 300}}>
                {options.map((item, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={{paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'}}
                    onPress={() => {
                      onSelect(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{fontSize: 16, color: '#374151'}}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  
// --- FORMULARIO ACTUALIZADO ---
const ServiceForm = ({ onSubmit, isLoggedIn, onTriggerLogin, initialCategory }) => {
    const [formData, setFormData] = useState({
      category: initialCategory || '',
      subcategory: '',
      title: '',
      description: '',
      location: ''
    });
    const [isLocating, setIsLocating] = useState(false);
  
    useEffect(() => {
      if(initialCategory) setFormData(prev => ({...prev, category: initialCategory, subcategory: ''}));
    }, [initialCategory]);
  
    const categories = Object.keys(DETAILED_CATEGORIES);
    const subcategories = formData.category ? DETAILED_CATEGORIES[formData.category] : [];
  
    // LÓGICA DE EJEMPLOS DINÁMICOS
    const getDynamicPlaceholders = () => {
      let ph = { title: "Ej. Necesito un servicio...", desc: "Describe los detalles aquí..." };
  
      if (formData.category === "Automotriz") {
          ph = { title: "Ej. Ruido en los frenos", desc: "Suena metálico al frenar..." };
          if (formData.subcategory.includes("Aire") || formData.subcategory.includes("Climatización")) {
              ph = { title: "Ej. El aire no enfría", desc: "El compresor no arranca y sale aire caliente..." };
          } else if (formData.subcategory.includes("Mecánica")) {
              ph = { title: "Ej. El carro tiembla", desc: "Vibración fuerte al pasar de 80km/h..." };
          }
      } 
      else if (formData.category === "Hogar") {
          ph = { title: "Ej. Reparación en casa", desc: "Detalles del problema..." };
          if (formData.subcategory === "Aire Acondicionado") {
               ph = { title: "Ej. Mantenimiento Split", desc: "Gotea agua hacia adentro..." };
          } else if (formData.subcategory.includes("Plomería") || formData.subcategory.includes("Gasfitería")) {
               ph = { title: "Ej. Fuga bajo el lavabo", desc: "Hay mucha agua en el piso de la cocina..." };
          }
      }
      
      return ph;
    };
  
    const placeholders = getDynamicPlaceholders();
  
    return (
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Nueva Solicitud</Text>
          <Text style={styles.heroSubtitle}>Completa los detalles para recibir ofertas.</Text>
        </View>
        
        <View style={styles.formContainer}>
          
          <CustomDropdown 
            label="CATEGORÍA"
            placeholder="Selecciona una opción..."
            value={formData.category}
            options={categories}
            onSelect={(cat) => setFormData({...formData, category: cat, subcategory: '', title: '', description: ''})}
          />
          
          {formData.category ? (
             <CustomDropdown 
               label="SUBCATEGORÍA"
               placeholder={`Tipo de servicio de ${formData.category}...`}
               value={formData.subcategory}
               options={subcategories}
               onSelect={(sub) => setFormData({...formData, subcategory: sub, title: '', description: ''})}
             />
          ) : null}
  
          <View style={styles.inputGroup}>
              <Text style={styles.label}>TÍTULO DEL PEDIDO</Text>
              <View style={styles.inputWrapper}>
                  <Edit2 size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input} 
                    placeholder={placeholders.title} 
                    placeholderTextColor="#9CA3AF"
                    value={formData.title} 
                    onChangeText={t => setFormData({...formData, title: t})} 
                  />
              </View>
          </View>
          
          <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPCIÓN DETALLADA</Text>
              <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingTop: 10 }]}>
                  <TextInput 
                    style={[styles.input, {textAlignVertical: 'top'}]} 
                    placeholder={placeholders.desc} 
                    placeholderTextColor="#9CA3AF"
                    multiline 
                    numberOfLines={4}
                    value={formData.description} 
                    onChangeText={t => setFormData({...formData, description: t})} 
                  />
              </View>
          </View>
  
          <View style={styles.inputGroup}>
              <Text style={styles.label}>EVIDENCIA (FOTOS O VIDEO)</Text>
              <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={styles.mediaButton} onPress={() => alert('Abrir Galería')}>
                      <ImagePlus size={20} color="#4B5563" />
                      <Text style={styles.mediaButtonText}>Galería</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.mediaButton} onPress={() => alert('Abrir Cámara')}>
                      <Camera size={20} color="#4B5563" />
                      <Text style={styles.mediaButtonText}>Cámara</Text>
                  </TouchableOpacity>
              </View>
          </View>
  
          <View style={styles.inputGroup}>
              <Text style={styles.label}>UBICACIÓN</Text>
              <View style={styles.inputWrapper}>
                  <MapPin size={18} color="#9CA3AF" style={{marginRight: 8}} />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Caracas, Baruta" 
                    value={formData.location} 
                    onChangeText={t => setFormData({...formData, location: t})} 
                  />
                  <TouchableOpacity onPress={() => { setIsLocating(true); setTimeout(() => { setIsLocating(false); setFormData({...formData, location: "Ubicación Actual Detectada"}); }, 1000); }}>
                      {isLocating ? <ActivityIndicator size="small" color="#EA580C" /> : <Crosshair size={18} color="#4B5563" />}
                  </TouchableOpacity>
              </View>
          </View>
  
          <TouchableOpacity style={styles.searchButton} onPress={() => onSubmit(formData)}>
              <Text style={styles.searchButtonText}>Pedir Presupuesto</Text>
              <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

const ProDashboard = ({ user }) => (
    <View style={styles.homeSections}>
        <View style={styles.proHeaderCard}>
            <Text style={styles.proWelcome}>Hola, {user?.name || "Profesional"}</Text>
            <View style={styles.proStatsRow}>
                <View style={styles.proStat}><Text style={styles.proStatValue}>12</Text><Text style={styles.proStatLabel}>Nuevos</Text></View>
                <View style={styles.proStat}><Text style={styles.proStatValue}>4.9</Text><Text style={styles.proStatLabel}>Rating</Text></View>
                <View style={styles.proStat}><Text style={styles.proStatValue}>$850</Text><Text style={styles.proStatLabel}>Ganancias</Text></View>
            </View>
        </View>
        <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
        {INCOMING_LEADS_DATA.map(lead => (
            <View key={lead.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                    <Text style={styles.leadTitle}>{lead.title}</Text>
                    <View style={styles.leadTagContainer}><Text style={styles.leadTag}>{lead.category}</Text></View>
                </View>
                <View style={styles.leadInfoRow}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.leadInfoText}>{lead.location}</Text>
                </View>
                <Text style={styles.leadDesc}>{lead.description}</Text>
                <TouchableOpacity style={styles.leadButton}><Text style={styles.leadButtonText}>Ver Detalles</Text></TouchableOpacity>
            </View>
        ))}
    </View>
);

const ProProfileView = ({ user, onBack }) => {
    const data = { ...PROFESSIONALS[0], ...user };
    return (
        <ScrollView style={{flex: 1, backgroundColor: '#F9FAFB'}}>
            <View style={{height: 150, backgroundColor: '#1F2937'}}>
                <Image source={{uri: data.coverImage}} style={{width: '100%', height: '100%', opacity: 0.6}} />
                <TouchableOpacity onPress={onBack} style={{position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20}}>
                    <ArrowLeft color="white" size={20} />
                </TouchableOpacity>
            </View>
            <View style={{paddingHorizontal: 20, marginTop: -50}}>
                <View style={{backgroundColor: 'white', borderRadius: 16, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5}}>
                    <Image source={{uri: data.image}} style={{width: 100, height: 100, borderRadius: 50, marginTop: -50, borderWidth: 4, borderColor: 'white'}} />
                    <Text style={{fontSize: 22, fontWeight: 'bold', marginTop: 10}}>{data.name}</Text>
                    <Text style={{color: '#2563EB', fontWeight: '600'}}>{data.role}</Text>
                    <View style={{flexDirection: 'row', marginTop: 15, width: '100%', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15}}>
                        <View style={{alignItems: 'center'}}><Text style={{fontSize: 18, fontWeight: 'bold'}}>124</Text><Text style={{fontSize: 10, color: '#6B7280'}}>TRABAJOS</Text></View>
                        <View style={{alignItems: 'center'}}><Text style={{fontSize: 18, fontWeight: 'bold'}}>4.9</Text><Text style={{fontSize: 10, color: '#6B7280'}}>RATING</Text></View>
                    </View>
                </View>
                
                <View style={{marginTop: 20, backgroundColor: 'white', borderRadius: 16, padding: 20}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Sobre mí</Text>
                    <Text style={{color: '#4B5563', lineHeight: 20}}>{data.about || data.description}</Text>
                </View>

                <View style={{marginTop: 20, backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 40}}>
                    <Text style={{fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Detalles</Text>
                    <View style={{flexDirection: 'row', marginBottom: 10}}>
                        <Globe size={18} color="#9CA3AF" style={{marginRight: 10}} />
                        <Text style={{color: '#4B5563'}}>Español, Inglés Técnico</Text>
                    </View>
                    <View style={{flexDirection: 'row', marginBottom: 10}}>
                        <Shield size={18} color="#9CA3AF" style={{marginRight: 10}} />
                        <Text style={{color: '#4B5563'}}>Garantía de 3 meses</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

const HomeSections = ({ onSelectCategory }) => (
    <View style={styles.homeSections}>
        <View>
            <Text style={styles.sectionTitle}>Categorías Populares</Text>
            <View style={styles.categoriesGrid}>
                {CATEGORIES_DISPLAY.map(cat => (
                    <TouchableOpacity key={cat.id} style={[styles.catCard, { backgroundColor: cat.color }]} onPress={() => onSelectCategory(cat)}>
                        <cat.icon size={24} color={cat.iconColor} />
                        <Text style={styles.catText}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
        <View style={styles.howToCard}>
            <View style={styles.howToHeader}>
                <Text style={styles.howToTitle}>¿Cómo funciona?</Text>
                <Text style={styles.howToSubtitle}>Resuelve tu problema en 3 pasos</Text>
            </View>
            <View style={styles.stepsRow}>
                <View style={styles.step}>
                    <View style={[styles.stepBadge, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.stepNumber, { color: '#EA580C' }]}>1</Text></View>
                    <Text style={styles.stepLabel}>Pide</Text>
                </View>
                <View style={styles.step}>
                    <View style={[styles.stepBadge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.stepNumber, { color: '#2563EB' }]}>2</Text></View>
                    <Text style={styles.stepLabel}>Recibe</Text>
                </View>
                <View style={styles.step}>
                    <View style={[styles.stepBadge, { backgroundColor: '#DCFCE7' }]}><Text style={[styles.stepNumber, { color: '#16A34A' }]}>3</Text></View>
                    <Text style={styles.stepLabel}>Elige</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.videoButton}>
                <PlayCircle size={16} color="#2563EB" style={{marginRight:6}} />
                <Text style={styles.videoButtonText}>Ver video explicativo</Text>
            </TouchableOpacity>
        </View>
        <View>
            <Text style={styles.sectionTitle}>Opiniones de usuarios</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingRight: 20}}>
                {TESTIMONIALS.map(t => (
                    <View key={t.id} style={styles.testimonialCard}>
                        <View style={{flexDirection:'row', marginBottom:8}}>
                            {[...Array(t.stars)].map((_,i) => <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />)}
                        </View>
                        <Text style={styles.testimonialText}>"{t.text}"</Text>
                        <Text style={styles.testimonialUser}>- {t.user}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
        <View>
            <Text style={styles.sectionTitle}>Ideas para tu hogar</Text>
            {BLOG_POSTS.map(post => (
                <View key={post.id} style={styles.blogCard}>
                    <Image source={{uri: post.image}} style={styles.blogImage} />
                    <View style={styles.blogContent}>
                        <Text style={styles.blogCategory}>{post.category}</Text>
                        <Text style={styles.blogTitle}>{post.title}</Text>
                        <Text style={styles.blogLink}>Leer más ➝</Text>
                    </View>
                </View>
            ))}
        </View>
    </View>
);

const ChatInterface = ({ userMode, onBack }) => {
    const [messages, setMessages] = useState([{id:1, type:'other', text:'¡Hola! Vi tu solicitud.'}]);
    const [input, setInput] = useState('');
    return (
        <View style={{flex: 1, backgroundColor: '#F9FAFB'}}>
            <View style={{backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity onPress={onBack}><ArrowLeft size={24} color="#374151" /></TouchableOpacity>
                <Text style={{fontSize: 18, fontWeight: 'bold', marginLeft: 16, color: '#1F2937'}}>Chat</Text>
            </View>
            <ScrollView style={{flex: 1, padding: 16}}>
                {messages.map(m => (
                    <View key={m.id} style={{alignSelf: m.type === 'me' ? 'flex-end' : 'flex-start', backgroundColor: m.type === 'me' ? '#2563EB' : 'white', padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1}}>
                        <Text style={{color: m.type === 'me' ? 'white' : '#374151'}}>{m.text}</Text>
                    </View>
                ))}
            </ScrollView>
            <View style={{padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB', flexDirection: 'row'}}>
                <TextInput style={{flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8}} placeholder="Escribe un mensaje..." value={input} onChangeText={setInput} />
                <TouchableOpacity style={{backgroundColor: '#2563EB', padding: 10, borderRadius: 20}} onPress={() => {if(input) {setMessages([...messages, {id: Date.now(), type: 'me', text: input}]); setInput('');}}}>
                    <Send size={20} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const ChatList = ({ onViewChat }) => (
    <View style={{padding: 16}}>
        <Text style={styles.sectionTitle}>Mensajes</Text>
        {[1].map(i => (
            <TouchableOpacity key={i} onPress={onViewChat} style={{backgroundColor: 'white', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1}}>
                <Image source={{uri: PROFESSIONALS[0].image}} style={{width: 50, height: 50, borderRadius: 25, marginRight: 12}} />
                <View style={{flex: 1}}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                        <Text style={{fontWeight: 'bold', fontSize: 16, color: '#1F2937'}}>{PROFESSIONALS[0].name}</Text>
                        <Text style={{fontSize: 12, color: '#9CA3AF'}}>10:30 AM</Text>
                    </View>
                    <Text style={{color: '#6B7280', fontSize: 14}} numberOfLines={1}>Hola, el precio incluye los repuestos...</Text>
                </View>
            </TouchableOpacity>
        ))}
    </View>
);

const ActiveRequestsList = ({ onViewChat, requests }) => (
    <View style={{padding: 16}}>
        <Text style={styles.sectionTitle}>Mis Presupuestos</Text>
        {(requests || MY_REQUESTS_DATA).map(req => (
            <TouchableOpacity key={req.id} onPress={onViewChat} style={{backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB'}}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    <View style={{flex: 1}}>
                        <Text style={{fontWeight: 'bold', fontSize: 16, color: '#1F2937', marginBottom: 4}}>{req.title}</Text>
                        <Text style={{fontSize: 14, color: '#2563EB', marginBottom: 2}}>{req.proName}</Text>
                        <Text style={{fontSize: 12, color: '#9CA3AF'}}>{req.date}</Text>
                    </View>
                    <View style={{backgroundColor: req.color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6}}>
                        <Text style={{fontSize: 10, fontWeight: 'bold', color: req.textColor}}>{req.status}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        ))}
    </View>
);

// --- COMPONENTE APP (LÓGICA PRINCIPAL) ---

export default function App() {
  const [userMode, setUserMode] = useState('client');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [view, setView] = useState('home'); 
  const [initialCategory, setInitialCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ESTADOS DE DATOS (LA MEMORIA DE LA APP)
  const [myRequestsList, setMyRequestsList] = useState(MY_REQUESTS_DATA);
  const [proLeadsList, setProLeadsList] = useState(INCOMING_LEADS_DATA);

  const handleLogin = (userData) => {
      setIsLoggedIn(true);
      setCurrentUser(userData);
      setUserMode(userData.role);
      setShowAuth(false);
      setView('home');
  };

  const handleCategorySelect = (cat) => {
      setSelectedCategory(cat);
      setInitialCategory(cat.fullName); 
      setView('category-detail');
  };

  // FUNCIÓN PARA CREAR NUEVO PEDIDO
  const handleCreateNewRequest = (formData) => {
    if (!formData.category || !formData.title) {
      Alert.alert("Faltan datos", "Por favor selecciona una categoría y pon un título.");
      return;
    }

    // Crear el objeto para el Cliente
    const newClientRequest = {
      id: Date.now(),
      title: formData.title,
      status: "Pendiente",
      date: "Hace un momento",
      color: "#FEF3C7", // Amarillo
      textColor: "#D97706",
      actionRequired: false,
      proName: "Buscando profesionales..."
    };

    // Crear el objeto para el Profesional
    const newProLead = {
      id: Date.now(),
      client: currentUser?.name || "Usuario Nuevo",
      title: formData.title,
      category: formData.category,
      location: formData.location || "Ubicación no definida",
      distance: "Cerca de ti",
      description: formData.description || "Sin descripción adicional",
      time: "Ahora mismo"
    };

    // Guardar en las listas
    setMyRequestsList([newClientRequest, ...myRequestsList]);
    setProLeadsList([newProLead, ...proLeadsList]);

    Alert.alert("¡Solicitud Enviada!", "Tu pedido ha sido publicado.");
    setView('my-requests');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {view !== 'pro-profile-edit' && (
          <Header 
            userMode={userMode} 
            toggleMode={() => setUserMode(userMode === 'client' ? 'pro' : 'client')}
            isLoggedIn={isLoggedIn}
            onLoginPress={() => setShowAuth(true)}
            currentUser={currentUser}
          />
      )}

      {view === 'home' && (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {userMode === 'client' ? (
                <>
                    <ServiceForm 
                        onSubmit={handleCreateNewRequest} 
                        isLoggedIn={isLoggedIn} 
                        onTriggerLogin={() => setShowAuth(true)}
                        initialCategory={initialCategory} 
                    />
                    <HomeSections onSelectCategory={handleCategorySelect} />
                </>
            ) : (
                <ProDashboard user={currentUser} />
            )}
            <View style={{height: 100}} />
          </ScrollView>
      )}

      {view === 'pro-profile' && <ProProfileView user={currentUser} onBack={() => setView('home')} />}
      {view === 'client-profile' && <ClientProfileView onBack={() => setView('home')} />}
      
      {view === 'my-requests' && (
          <ScrollView style={styles.content}>
              <ActiveRequestsList requests={myRequestsList} onViewChat={() => setView('chat')} />
          </ScrollView>
      )}
      
      {view === 'chat-list' && <ScrollView style={styles.content}><ChatList onViewChat={() => setView('chat')} /></ScrollView>}
      {view === 'chat' && <ChatInterface userMode={userMode} onBack={() => setView('chat-list')} />}
      {view === 'pro-profile-edit' && <ProProfileEditView currentUser={currentUser} onBack={() => setView('home')} />}
      
      {view === 'category-detail' && selectedCategory && (
            <CategoryDetailView 
                category={selectedCategory} 
                onBack={() => setView('home')} 
                onSelectSubcategory={(sub) => { 
                    setInitialCategory(selectedCategory.fullName); 
                    setView('home'); 
                }} 
                onSelectPro={(pro) => { 
                    setView('pro-profile'); 
                }} 
            />
      )}

      {(['home', 'category-detail', 'pro-profile', 'my-requests', 'chat-list', 'client-profile', 'pro-profile-edit'].includes(view)) && (
          <BottomNav view={view} setView={setView} userMode={userMode} />
      )}

      <AuthModal visible={showAuth} onClose={() => setShowAuth(false)} onLogin={handleLogin} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: { padding: 6, borderRadius: 8, marginRight: 8 },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  modeButton: { marginRight: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 20 },
  modeButtonText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  loginButtonHeader: { marginRight: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EA580C', borderRadius: 20 },
  loginButtonHeaderText: { fontSize: 12, fontWeight: '600', color: 'white' },
  content: { flex: 1, padding: 16 },
  
  // Hero & Form
  heroCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  heroHeader: { backgroundColor: '#EA580C', padding: 20 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 4 },
  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, minHeight: 48 },
  pickerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#1F2937' },
  mediaButtonsRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  mediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#F9FAFB' },
  mediaButtonText: { marginLeft: 8, color: '#6B7280', fontWeight: '500' },
  searchButton: { backgroundColor: '#111827', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  searchButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  
  // Categories
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16, marginTop: 10 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  catCard: { width: '22%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  catText: { fontSize: 10, fontWeight: 'bold', color: '#374151', marginTop: 6 },
  homeSections: { paddingBottom: 24 },

  // How To
  howToCard: { backgroundColor: 'white', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20, marginTop: 24 },
  howToHeader: { backgroundColor: '#111827', padding: 16, alignItems: 'center' },
  howToTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  howToSubtitle: { color: '#9CA3AF', fontSize: 12 },
  stepsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  step: { alignItems: 'center', flex: 1 },
  stepBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepNumber: { fontWeight: 'bold', fontSize: 16 },
  stepLabel: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  videoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#F9FAFB' },
  videoButtonText: { color: '#2563EB', fontSize: 12, fontWeight: 'bold' },

  // Testimonials
  testimonialCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginRight: 16, width: 260, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  testimonialText: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  testimonialUser: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },

  // Blog
  blogCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  blogImage: { width: 100, height: '100%' },
  blogContent: { flex: 1, padding: 12, justifyContent: 'center' },
  blogCategory: { fontSize: 10, color: '#2563EB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  blogTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  blogLink: { fontSize: 12, color: '#6B7280' },

  // Pro Dashboard
  proHeaderCard: { backgroundColor: '#2563EB', borderRadius: 20, padding: 20, marginBottom: 24 },
  proWelcome: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  proStatsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 15 },
  proStat: { alignItems: 'center', flex: 1 },
  proStatValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  proStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 10, marginTop: 2, textTransform: 'uppercase' },
  
  leadCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  leadHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  leadTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', flex: 1 },
  leadTagContainer: { backgroundColor: '#EFF6FF', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  leadTag: { color: '#2563EB', fontSize: 10, fontWeight: 'bold' },
  leadInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  leadInfoText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  leadDesc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginBottom: 16 },
  leadButton: { backgroundColor: '#111827', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  leadButtonText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  // Bottom Nav
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', elevation: 20 },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '50%', maxHeight: '80%' },
  closeButton: { alignSelf: 'flex-end', padding: 4 },
  authHeader: { alignItems: 'center', marginBottom: 24 },
  authIconContainer: { width: 64, height: 64, backgroundColor: '#FFEDD5', borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: '#6B7280' },
  roleSwitchContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 24 },
  roleButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  roleButtonActive: { backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  roleButtonActivePro: { backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  roleButtonText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  roleButtonTextActive: { color: '#1F2937' },
  authInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, height: 56 },
  mainAuthButton: { backgroundColor: '#111827', borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  mainAuthButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  switchAuthText: { textAlign: 'center', marginTop: 15, color: '#EA580C', fontWeight: '600', fontSize: 14 },
  
  // Pro ID Verification Styles
  idVerificationContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  idButton: { width: '48%', height: 100, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  idButtonText: { fontSize: 12, color: '#1E40AF', marginTop: 8, fontWeight: '600' },
  verificationNote: { fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  scanIconBadge: { position:'absolute', bottom:-5, right:-5, backgroundColor: 'green', borderRadius: 10, padding: 2 },
  
  // Map
  zoneMapContainer: { height: 150, borderRadius: 12, overflow: 'hidden', marginTop: 8, position: 'relative' },
  mapImage: { width: '100%', height: '100%', opacity: 0.5 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  mapPinContainer: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  mapCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mapDot: { width: 10, height: 10, borderRadius: 5 },
  mapLabel: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'white', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  mapLabelText: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' }
});