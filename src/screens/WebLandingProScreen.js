import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    useWindowDimensions
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WebLandingProScreen({ onGoBack, onStartRegistration }) {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Cabecera */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#334155" />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
                    <Text style={styles.logoText}>
                        <Text style={{ color: '#2563EB' }}>Profesional</Text>{' '}
                        <Text style={{ color: '#EA580C' }}>Cercano</Text>
                    </Text>
                </View>
                <View style={{ width: 40 }} /> {/* Espacio para balancear el back button */}
            </View>

            {/* Hero Section */}
            <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
                <View style={[styles.heroTextContainer, isDesktop && styles.heroTextContainerDesktop]}>
                    <Text style={styles.heroTitle}>Comienza a expandir tu negocio hoy mismo</Text>
                    <Text style={styles.heroSubtitle}>
                        Sé parte de la revolución de los servicios. Gana clientes, aumenta tus ingresos y sé valorado por tu trabajo.
                    </Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={onStartRegistration}>
                        <Text style={styles.ctaButtonText}>Crear Cuenta de Profesional</Text>
                        <Feather name="arrow-right" size={20} color="white" />
                    </TouchableOpacity>
                </View>
                <View style={[styles.heroImageContainer, isDesktop && styles.heroImageContainerDesktop]}>
                    <View style={styles.heroImagePlaceholder}>
                        <FontAwesome5 name="chart-line" size={80} color="#2563EB" />
                    </View>
                </View>
            </View>

            {/* Beneficios */}
            <View style={[styles.benefitsSection, isDesktop && styles.benefitsSectionDesktop]}>
                <Text style={styles.sectionTitle}>¿Por qué unirte a nosotros?</Text>
                
                <View style={[styles.benefitsGrid, isDesktop && styles.benefitsGridDesktop]}>
                    
                    {/* Beneficio 1 */}
                    <View style={styles.benefitCard}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="trending-up" size={32} color="#2563EB" />
                        </View>
                        <Text style={styles.benefitTitle}>Gana sin invertir</Text>
                        <Text style={styles.benefitText}>
                            El registro es totalmente gratuito. Nosotros hacemos la publicidad por ti, conectándote con cientos de clientes.
                        </Text>
                    </View>

                    {/* Beneficio 2 */}
                    <View style={styles.benefitCard}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#FCE7F3' }]}>
                            <Feather name="shield" size={32} color="#DB2777" />
                        </View>
                        <Text style={styles.benefitTitle}>Privacidad Total</Text>
                        <Text style={styles.benefitText}>
                            Tú decides cuándo recibir solicitudes. Protegemos tu información con total seguridad y privacidad.
                        </Text>
                    </View>

                    {/* Beneficio 3 */}
                    <View style={styles.benefitCard}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
                            <Feather name="star" size={32} color="#D97706" />
                        </View>
                        <Text style={styles.benefitTitle}>Reconocimiento</Text>
                        <Text style={styles.benefitText}>
                            Por fin serás valorado. Construye una reputación impecable y destaca frente a la competencia.
                        </Text>
                    </View>

                    {/* Beneficio 4 */}
                    <View style={styles.benefitCard}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#D1FAE5' }]}>
                            <Feather name="users" size={32} color="#059669" />
                        </View>
                        <Text style={styles.benefitTitle}>Tu Gran Aliado</Text>
                        <Text style={styles.benefitText}>
                            No estás solo. Crece de la mano de un aliado comercial diseñado exclusivamente para profesionales como tú.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Bottom CTA */}
            <LinearGradient
                colors={['#1E3A8A', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bottomCtaSection}
            >
                <Text style={styles.bottomCtaTitle}>¿Listo para llevar tu trabajo al siguiente nivel?</Text>
                <Text style={styles.bottomCtaSubtitle}>
                    Regístrate en menos de 2 minutos y empieza a recibir propuestas hoy mismo.
                </Text>
                <TouchableOpacity style={styles.ctaButtonWhite} onPress={onStartRegistration}>
                    <Text style={styles.ctaButtonTextBlue}>Únete como Profesional Ahora</Text>
                </TouchableOpacity>
            </LinearGradient>
            
            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>© {new Date().getFullYear()} Profesional Cercano. Todos los derechos reservados.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9'
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
        marginRight: 10
    },
    logoText: {
        fontSize: 20,
        fontWeight: '900',
    },
    heroSection: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 30
    },
    heroSectionDesktop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 100,
        paddingVertical: 80,
    },
    heroTextContainer: {
        alignItems: 'center',
        textAlign: 'center'
    },
    heroTextContainerDesktop: {
        flex: 1,
        alignItems: 'flex-start',
        paddingRight: 50
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 44,
        ...(Platform.OS === 'web' && { textAlign: 'left' })
    },
    heroSubtitle: {
        fontSize: 18,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 28,
        ...(Platform.OS === 'web' && { textAlign: 'left' })
    },
    ctaButton: {
        backgroundColor: '#EA580C',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    ctaButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10
    },
    heroImageContainer: {
        marginTop: 40,
        width: '100%',
        alignItems: 'center'
    },
    heroImageContainerDesktop: {
        flex: 1,
        marginTop: 0,
        alignItems: 'center'
    },
    heroImagePlaceholder: {
        width: 300,
        height: 300,
        backgroundColor: '#EFF6FF',
        borderRadius: 150,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: '#DBEAFE'
    },
    benefitsSection: {
        padding: 20,
    },
    benefitsSectionDesktop: {
        paddingHorizontal: 100,
        paddingVertical: 60
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 40
    },
    benefitsGrid: {
        flexDirection: 'column',
        gap: 20
    },
    benefitsGridDesktop: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    benefitCard: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        flex: 1,
        minWidth: 280,
        maxWidth: 350,
        margin: 10
    },
    iconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    benefitTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center'
    },
    benefitText: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24
    },
    bottomCtaSection: {
        padding: 40,
        alignItems: 'center',
        marginTop: 40
    },
    bottomCtaTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 15
    },
    bottomCtaSubtitle: {
        fontSize: 16,
        color: '#DBEAFE',
        textAlign: 'center',
        marginBottom: 30,
        maxWidth: 600
    },
    ctaButtonWhite: {
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10
    },
    ctaButtonTextBlue: {
        color: '#2563EB',
        fontSize: 18,
        fontWeight: 'bold'
    },
    footer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#0F172A'
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14
    }
});
