import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

export const ProGamificationModal = ({
    visible,
    onClose,
    user,
}) => {
    const levelNames = { 1: 'ASPIRANTE', 2: 'VERIFICADO', 3: 'DESTACADO', 4: 'MAESTRO' };
    const levelThresholds = { 1: 500, 2: 1500, 3: 3500, 4: 3500 }; // 4 is max
    
    const currentLevel = user?.gamification?.currentLevel || 1;
    const currentPoints = user?.gamification?.currentSeasonPoints || 0;
    const projectedLevel = user?.gamification?.projectedLevel || currentLevel;

    // Calcular progreso
    const targetPoints = currentLevel < 4 ? levelThresholds[currentLevel] : currentPoints;
    let previousThreshold = currentLevel > 1 ? levelThresholds[currentLevel - 1] : 0;
    
    // Si ya alcanzó el máximo
    let progressPercentage = 100;
    let pointsNeeded = 0;

    if (currentLevel < 4) {
        const pointsInThisLevel = currentPoints - previousThreshold;
        const totalPointsForNextLevel = targetPoints - previousThreshold;
        progressPercentage = Math.max(0, Math.min(100, (pointsInThisLevel / totalPointsForNextLevel) * 100));
        pointsNeeded = targetPoints - currentPoints;
    }

    let totalScaleProgress = 100;
    if (currentLevel < 4) {
        totalScaleProgress = ((currentLevel - 1) + (progressPercentage / 100)) * (100 / 3);
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.dragHandle} />
                    
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Mi Nivel y Puntos</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        
                        {/* Estado Actual */}
                        <View style={styles.statusCard}>
                            <View style={styles.levelHeader}>
                                <FontAwesome5 name="award" size={24} color="#F59E0B" />
                                <Text style={styles.levelTitle}>NIVEL {levelNames[currentLevel]}</Text>
                            </View>
                            
                            <View style={styles.pointsDisplay}>
                                <Text style={styles.pointsNumber}>{currentPoints}</Text>
                                <Text style={styles.pointsLabel}>PUNTOS ACUMULADOS</Text>
                            </View>

                            {/* Visual Scale */}
                            <View style={{ width: '100%', marginBottom: 15, position: 'relative' }}>
                                {/* Background Line */}
                                <View style={{ position: 'absolute', top: 10, left: '12%', right: '12%', height: 3, backgroundColor: '#FDE68A', zIndex: 0 }} />
                                {/* Fill Line */}
                                <View style={{ position: 'absolute', top: 10, left: '12%', width: `${totalScaleProgress * 0.76}%`, height: 3, backgroundColor: '#D97706', zIndex: 0 }} />
                                
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                    {[1, 2, 3, 4].map(lvl => {
                                        const isReached = currentLevel >= lvl;
                                        return (
                                            <View key={lvl} style={{ alignItems: 'center', width: '25%' }}>
                                                <View style={{
                                                    width: 22, height: 22, borderRadius: 11, 
                                                    backgroundColor: isReached ? '#D97706' : '#FDE68A',
                                                    justifyContent: 'center', alignItems: 'center',
                                                    zIndex: 1,
                                                    borderWidth: 2, borderColor: '#FFFBEB'
                                                }}>
                                                    {isReached && <Feather name="check" size={12} color="white" />}
                                                </View>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: isReached ? '#D97706' : '#B45309', marginTop: 4, textAlign: 'center' }}>
                                                    {levelNames[lvl]}
                                                </Text>
                                                <Text style={{ fontSize: 9, color: '#D97706', opacity: 0.8 }}>
                                                    {lvl === 1 ? '0 pts' : `${levelThresholds[lvl-1]} pts`}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            {currentLevel < 4 ? (
                                <Text style={styles.progressText}>Te faltan <Text style={{fontWeight: 'bold'}}>{pointsNeeded} puntos</Text> para alcanzar el <Text style={{fontWeight: 'bold'}}>Nivel {levelNames[currentLevel + 1]}</Text></Text>
                            ) : (
                                <Text style={styles.progressText}>¡Has alcanzado el nivel máximo!</Text>
                            )}
                        </View>

                        {/* Proyección y Reglas Básicas */}
                        <View style={styles.infoBox}>
                            <Feather name="info" size={20} color="#2563EB" style={{marginRight: 10, marginTop: 2}} />
                            <View style={{flex: 1}}>
                                <Text style={styles.infoTitle}>Ventana Trimestral</Text>
                                <Text style={styles.infoDesc}>
                                    Los puntos se reinician cada trimestre (1 Ene, 1 Abr, 1 Jul, 1 Oct). 
                                    Conservarás tu rango actual para el próximo trimestre, pero debes seguir acumulando puntos para mantenerlo o subir.
                                </Text>
                            </View>
                        </View>

                        {/* Cómo Ganar Puntos */}
                        <Text style={styles.sectionTitle}>¿Cómo ganar más puntos?</Text>
                        
                        <View style={styles.actionList}>
                            <View style={styles.actionItem}>
                                <View style={styles.actionIconBox}><Feather name="briefcase" size={16} color="#10B981" /></View>
                                <Text style={styles.actionText}>Trabajo Completado</Text>
                                <Text style={styles.actionPoints}>+50 pts</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <View style={styles.actionIconBox}><Feather name="star" size={16} color="#F59E0B" /></View>
                                <Text style={styles.actionText}>Valoración de 5 estrellas</Text>
                                <Text style={styles.actionPoints}>+40 pts</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <View style={styles.actionIconBox}><Feather name="star" size={16} color="#F59E0B" /></View>
                                <Text style={styles.actionText}>Valoración de 4 estrellas</Text>
                                <Text style={styles.actionPoints}>+20 pts</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <View style={styles.actionIconBox}><Feather name="file-text" size={16} color="#3B82F6" /></View>
                                <Text style={styles.actionText}>Presupuesto Enviado</Text>
                                <Text style={styles.actionPoints}>+15 pts</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <View style={styles.actionIconBox}><Feather name="clock" size={16} color="#8B5CF6" /></View>
                                <Text style={styles.actionText}>Respuesta Rápida {"(<30 min)"}</Text>
                                <Text style={styles.actionPoints}>+10 pts</Text>
                            </View>
                            <View style={styles.actionItem}>
                                <View style={[styles.actionIconBox, { backgroundColor: '#FEE2E2' }]}><Feather name="alert-triangle" size={16} color="#EF4444" /></View>
                                <Text style={styles.actionText}>Valoración {"< 3 estrellas"}</Text>
                                <Text style={[styles.actionPoints, {color: '#EF4444'}]}>-50 pts</Text>
                            </View>
                        </View>
                        
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 5,
        alignSelf: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    closeButton: {
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderRadius: 20,
    },
    statusCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEF3C7'
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    levelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D97706',
        marginLeft: 10,
    },
    pointsDisplay: {
        alignItems: 'center',
        marginBottom: 20,
    },
    pointsNumber: {
        fontSize: 48,
        fontWeight: '900',
        color: '#1E293B',
    },
    pointsLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1,
    },
    progressBarContainer: {
        width: '100%',
        height: 12,
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#F59E0B',
        borderRadius: 10,
    },
    progressText: {
        fontSize: 13,
        color: '#475569',
        textAlign: 'center'
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 25,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 13,
        color: '#1E3A8A',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
    },
    actionList: {
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    actionIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    actionText: {
        flex: 1,
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    actionPoints: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    }
});
