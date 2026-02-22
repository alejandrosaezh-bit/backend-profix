import { Dimensions, Platform, StatusBar as RNStatusBar, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Standard Grey Background
        // BAJAR CONTENIDO DE BARRA DE ESTADO
        paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 30) + 5 : 5
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: 'white',
        borderBottomWidth: 0,
        elevation: 5,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 10
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    logoIcon: { padding: 8, borderRadius: 12, marginRight: 10 },
    logoText: { fontSize: 18, fontWeight: 'bold', color: '#111827' }, // Reduced to 18px
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    modeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modeButtonText: { fontSize: 13, fontWeight: 'bold', color: '#4B5563' }, // Grey-600
    loginButtonHeader: {
        backgroundColor: '#EA580C',
        paddingHorizontal: 20,
        borderRadius: 24,
        minHeight: 48,
        justifyContent: 'center'
    },
    loginButtonHeaderText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    content: { flex: 1, paddingHorizontal: 24, paddingVertical: 16 }, // Wider margins

    heroCard: {
        backgroundColor: 'white',
        borderRadius: 0, // Fallback to full-bleed
        marginBottom: 20,
    },
    heroHeader: { backgroundColor: '#EA580C', padding: 24 },
    heroTitle: { fontSize: 26, fontWeight: 'bold', color: 'white' },
    heroSubtitle: { fontSize: 17, color: 'rgba(255,255,255,0.9)' },
    formContainer: { paddingVertical: 20 },
    label: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }, // Consistent 15px
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        minHeight: 56,
        alignItems: 'center'
    },
    input: {
        fontSize: 16,
        color: '#111827'
    },
    inputBox: {
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        fontSize: 17,
        fontWeight: 'bold',
        color: '#111827',
        minHeight: 56
    },
    inputGroup: { marginBottom: 16 },
    helperText: { fontSize: 12, color: '#6B7280', marginBottom: 12, marginTop: -4, textAlign: 'center' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        minHeight: 56
    },
    locationIconButton: {
        width: 56,
        height: 56,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#9CA3AF',
    },
    locationButtonText: {
        color: '#EA580C',
        fontWeight: 'bold',
        fontSize: 16
    },
    privacyNote: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
        lineHeight: 18
    },
    suggestionsContainer: {
        position: 'absolute',
        top: '100%',
        paddingTop: 0,
        marginTop: 4,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        elevation: 8,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },
    suggestionItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    suggestionText: {
        fontSize: 16,
        color: '#374151'
    },
    mediaButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 48
    },
    searchButton: {
        backgroundColor: '#EA580C',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16, // Reduced form 20
        borderRadius: 16,
        alignItems: 'center',
        minHeight: 56, // Reduced from 64
        marginTop: 16, // Reduced from 20
        marginBottom: 12 // Drastically reduced from 30
    },
    searchButtonText: { color: 'white', fontWeight: 'bold', fontSize: 17, marginRight: 8 },

    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827', marginTop: 0 },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 24,
        marginTop: 8
    },
    catCard: {
        width: '31%',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        aspectRatio: 0.95
    },
    catIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    catTextCard: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        flex: 0
    },

    reqCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    proHeaderCard: { backgroundColor: '#2563EB', padding: 24, borderRadius: 16, marginBottom: 20 },
    jobCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    offerCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },

    // Removed duplicate modalOverlay and modalContent
    mainAuthButton: { padding: 16, borderRadius: 12, alignItems: 'center', minHeight: 48 },

    // NAV INFERIOR
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        paddingBottom: Platform.OS === 'android' ? 55 : 30, // Aumentado para evitar solapamiento
        minHeight: 90 // Aumentado mínimamente
    },
    navItem: { alignItems: 'center', padding: 8, flex: 1, minHeight: 48 },

    // ESTILOS EXTRA SECCIONES
    howToCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 0,
        marginBottom: 24,
        paddingBottom: 10
    },
    howToHeader: { backgroundColor: '#F8F9FA', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    howToTitle: { color: '#111827', fontSize: 20, fontWeight: 'bold' },
    howToSubtitle: { color: '#4B5563', fontSize: 14, marginTop: 4 },
    stepsRow: { flexDirection: 'row', padding: 24, justifyContent: 'space-between' },
    step: { alignItems: 'center', flex: 1 },
    stepBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    stepNumber: { fontWeight: 'bold', fontSize: 18 },
    stepLabel: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: 'white',
        minHeight: 48
    },
    videoButtonText: { color: '#2563EB', fontSize: 14, fontWeight: 'bold' },

    testimonialCard: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        marginRight: 16,
        width: 280,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    testimonialText: { fontSize: 15, color: '#4B5563', fontStyle: 'italic', marginBottom: 12, lineHeight: 22 },
    testimonialUser: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

    blogCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        height: 100
    },

    // ESTILOS FORMULARIO SEPARADO
    serviceFormCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#FFF7ED',
        elevation: 5,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
    },
    serviceFormHeader: { backgroundColor: 'white', paddingVertical: 15, paddingBottom: 10 },
    serviceFormTitle: { fontSize: 22, fontWeight: 'bold', color: '#111811', lineHeight: 28 },
    serviceFormSubtitle: { color: '#4B5563', fontSize: 14, marginTop: 8, lineHeight: 20 },
    serviceFormContent: { paddingVertical: 10 },
    blogContent: { flex: 1, padding: 16, justifyContent: 'center' },
    blogCategory: { fontSize: 12, color: '#2563EB', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 6 },
    blogTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    blogLink: { fontSize: 14, color: '#4B5563' },

    // BADGES
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: 'white'
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },

    // Dropdown Styles
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        minHeight: 48
    },
    dropdownButtonText: { color: 'white', fontWeight: '600', fontSize: 14, flex: 1 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        padding: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        maxHeight: '80%'
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827', textAlign: 'center' },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        minHeight: 56
    },
    modalOptionSelected: { backgroundColor: '#FFF7ED', paddingHorizontal: 16, borderRadius: 12, borderBottomWidth: 0 },
    modalOptionText: { fontSize: 16, color: '#475569' },
    modalOptionTextSelected: { color: '#EA580C', fontWeight: 'bold' },

    // Category Grid Modal Styles
    categoryGridModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    categoryGridModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: '92%', // Full Screen but with gap
        maxHeight: '100%'
    },
    categoryGridHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    categoryGridTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
    categoryGridSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    categoryGridCloseButton: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 20, minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
    categoryGridScroll: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 30 },
    categoryGridItem: {
        width: '31%',
        aspectRatio: 1,
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minHeight: 48,
        minWidth: 48
    },
    categoryGridIconWrapper: { padding: 12, borderRadius: 50, marginBottom: 8 },
    categoryGridLabel: { fontSize: 12, fontWeight: 'bold', color: '#111827', textAlign: 'center' }
});