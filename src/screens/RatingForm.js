import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const RatingForm = ({ onSubmit, revieweeName, isForPro, onCancel }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState({
        paidOnTime: true,
        clearInstructions: true,
        deliveredOnTime: true,
        qualityAsExpected: true,
        professionalism: true
    });

    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit({ rating, comment, answers });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 5 }}>Valorar a {revieweeName}</Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginBottom: 15 }}>Tu opinión ayuda a mantener la calidad en Profesional Cercano</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 20 }}>
                {[1, 2, 3, 4, 5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                        <FontAwesome5 name="star" solid={s <= rating} size={28} color={s <= rating ? '#F59E0B' : '#E2E8F0'} style={{ marginHorizontal: 4 }} />
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 12 }}>Preguntas rápidas:</Text>

            {isForPro ? (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Cumplió con los tiempos?</Text>
                        <Switch value={answers.deliveredOnTime} onValueChange={v => setAnswers({ ...answers, deliveredOnTime: v })} trackColor={{ true: '#10B981', false: '#CBD5E1' }} thumbColor={answers.deliveredOnTime ? '#fff' : '#f4f3f4'} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Calidad esperada?</Text>
                        <Switch value={answers.qualityAsExpected} onValueChange={v => setAnswers({ ...answers, qualityAsExpected: v })} trackColor={{ true: '#10B981', false: '#CBD5E1' }} thumbColor={answers.qualityAsExpected ? '#fff' : '#f4f3f4'} />
                    </View>
                </>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Pagó a tiempo?</Text>
                        <Switch value={answers.paidOnTime} onValueChange={v => setAnswers({ ...answers, paidOnTime: v })} trackColor={{ true: '#10B981', false: '#CBD5E1' }} thumbColor={answers.paidOnTime ? '#fff' : '#f4f3f4'} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, color: '#374151' }}>¿Instrucciones claras?</Text>
                        <Switch value={answers.clearInstructions} onValueChange={v => setAnswers({ ...answers, clearInstructions: v })} trackColor={{ true: '#10B981', false: '#CBD5E1' }} thumbColor={answers.clearInstructions ? '#fff' : '#f4f3f4'} />
                    </View>
                </>
            )}

            <TextInput
                placeholder="Cuéntanos más sobre tu experiencia..."
                value={comment}
                onChangeText={setComment}
                multiline
                style={{ backgroundColor: 'white', borderRadius: 12, padding: 12, height: 70, fontSize: 13, marginTop: 5, borderWidth: 1, borderColor: '#E2E8F0' }}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                {onCancel && (
                    <TouchableOpacity onPress={onCancel} style={{ flex: 1, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B' }}>Ahora no</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleFormSubmit}
                    disabled={isSubmitting}
                    style={{ flex: 2, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F59E0B', opacity: isSubmitting ? 0.7 : 1 }}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : (
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>ENVIAR VALORACIÓN</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default RatingForm;
