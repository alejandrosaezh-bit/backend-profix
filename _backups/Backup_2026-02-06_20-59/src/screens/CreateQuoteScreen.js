import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Clock, DollarSign, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CreateQuoteScreen = ({ job, onBack, onSendQuote, currentUser }) => {
    const [items, setItems] = useState([{ id: 1, description: '', price: '' }]);
    const [descriptionLine, setDescriptionLine] = useState('');
    const [showDescriptionLine, setShowDescriptionLine] = useState(false);

    // Additional Fields
    const [executionTime, setExecutionTime] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [startDateText, setStartDateText] = useState(new Date().toLocaleDateString());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState(''); // e.g. 50% - 50%
    const [currency, setCurrency] = useState('$'); // $ or Bs
    const [warranty, setWarranty] = useState('');
    const [conditions, setConditions] = useState('');
    const [observations, setObservations] = useState('');

    // Tax
    const [addTax, setAddTax] = useState(false);
    const [taxRate, setTaxRate] = useState('16'); // Default 16%

    const [total, setTotal] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (job && job.offers && currentUser) {
            const existingOffer = job.offers.find(o =>
                (o.proId?._id || o.proId) === currentUser._id ||
                o.proEmail === currentUser.email
            );

            if (existingOffer) {
                setIsEditing(true);
                setItems(existingOffer.items && existingOffer.items.length > 0
                    ? existingOffer.items.map(i => ({ ...i, id: i._id || Date.now() + Math.random(), price: i.price.toString() }))
                    : [{ id: 1, description: '', price: '' }]
                );
                setDescriptionLine(existingOffer.descriptionLine || '');
                setShowDescriptionLine(!!existingOffer.descriptionLine);
                setExecutionTime(existingOffer.duration || existingOffer.executionTime || '');

                // Parse date safely
                let date = new Date();
                if (existingOffer.startDate) {
                    // Try to parse if string
                    const parts = existingOffer.startDate.split('/');
                    if (parts.length === 3) {
                        // dd/mm/yyyy
                        date = new Date(parts[2], parts[1] - 1, parts[0]);
                    } else {
                        const d = new Date(existingOffer.startDate);
                        if (!isNaN(d.getTime())) date = d;
                    }
                }
                setStartDate(date);
                setStartDateText(date.toLocaleDateString());

                setPaymentTerms(existingOffer.paymentTerms || '');
                setCurrency(existingOffer.currency || '$');
                setWarranty(existingOffer.warranty || '');
                setConditions(existingOffer.conditions || '');
                setObservations(existingOffer.observations || '');
                setAddTax(existingOffer.addTax || false);
                setTaxRate(existingOffer.taxRate ? existingOffer.taxRate.toString() : '16');
            }
        }
    }, [job, currentUser]);

    useEffect(() => {
        calculateTotal();
    }, [items, addTax, taxRate]);

    const calculateTotal = () => {
        let subtotal = items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            return sum + price;
        }, 0);

        if (addTax) {
            const tax = subtotal * (parseFloat(taxRate) / 100);
            setTotal(subtotal + tax);
        } else {
            setTotal(subtotal);
        }
    };

    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), description: '', price: '' }]);
    };

    const handleDateTextChange = (text) => {
        setStartDateText(text);
        // Intentar parsear DD/MM/YYYY
        const parts = text.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            if (year > 2000 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) {
                    setStartDate(d);
                }
            }
        }
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id, field, value) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setItems(newItems);
    };

    const handleSend = () => {
        // Validation
        if (items.some(i => !i.description || !i.price)) {
            Alert.alert('Error', 'Por favor completa todos los ítems de la oferta.');
            return;
        }
        if (total <= 0) {
            Alert.alert('Error', 'El monto total debe ser mayor a 0.');
            return;
        }

        const quoteData = {
            items: items.map(i => ({
                description: i.description,
                price: parseFloat(i.price) || 0
            })),
            descriptionLine: showDescriptionLine ? descriptionLine : null,
            executionTime,
            duration: executionTime, // Compatibility
            startDate: startDate.toLocaleDateString(),
            paymentTerms,
            currency,
            amount: total, // Explicitly send amount
            total: total,
            price: total.toFixed(2), // Compatibility
            warranty,
            conditions,
            observations,
            addTax,
            taxRate: addTax ? taxRate : 0,
            date: new Date().toISOString().split('T')[0]
        };

        const jobId = job.id || job._id;
        if (!jobId) {
            console.error("[CreateQuoteScreen] JOB ID IS MISSING", job);
            Alert.alert("Error", "No se pudo identificar la solicitud.");
            return;
        }

        onSendQuote(jobId, quoteData, isEditing);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeft color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Actualizar Oferta' : 'Crear Oferta'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Job Summary */}
                <View style={styles.section}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.clientName}>Cliente: {job.clientName}</Text>
                </View>

                {/* Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ítems del Trabajo</Text>
                    {items.map((item, index) => (
                        <View key={item.id} style={styles.itemRow}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Descripción</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Retirar papel tapiz"
                                    value={item.description}
                                    onChangeText={(text) => updateItem(item.id, 'description', text)}
                                />
                            </View>
                            <View style={{ width: 100 }}>
                                <Text style={styles.label}>Precio ({currency})</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                    value={item.price}
                                    onChangeText={(text) => updateItem(item.id, 'price', text)}
                                />
                            </View>
                            {items.length > 1 && (
                                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={{ marginTop: 20, marginLeft: 5 }}>
                                    <Trash2 color="#EF4444" size={20} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity onPress={handleAddItem} style={styles.addButton}>
                        <Plus color="#2563EB" size={20} />
                        <Text style={styles.addButtonText}>Agregar Ítem</Text>
                    </TouchableOpacity>
                </View>

                {/* Description Line Toggle */}
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Agregar línea de descripción adicional</Text>
                        <Switch value={showDescriptionLine} onValueChange={setShowDescriptionLine} />
                    </View>
                    {showDescriptionLine && (
                        <TextInput
                            style={[styles.input, { marginTop: 10 }]}
                            placeholder="Descripción general del trabajo..."
                            value={descriptionLine}
                            onChangeText={setDescriptionLine}
                        />
                    )}
                </View>

                {/* Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del Servicio</Text>

                    <Text style={styles.label}>Tiempo de ejecución</Text>
                    <View style={styles.rowInput}>
                        <Clock size={20} color="#666" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Ej. 3 días"
                            value={executionTime}
                            onChangeText={setExecutionTime}
                        />
                    </View>

                    <Text style={styles.label}>Fecha de inicio estimada</Text>
                    <View style={styles.rowInput}>
                        {Platform.OS === 'web' ? (
                            <View style={{ 
                                marginRight: 10, 
                                width: 42, 
                                height: 42, 
                                backgroundColor: '#EFF6FF', 
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: '#BFDBFE',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Calendar size={20} color="#2563EB" />
                                <DateTimePicker
                                    value={startDate}
                                    mode="date"
                                    onChange={(event, selectedDate) => {
                                        if (selectedDate) {
                                            setStartDate(selectedDate);
                                            setStartDateText(selectedDate.toLocaleDateString());
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        opacity: 0, // Invisible pero clicable
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer'
                                    }}
                                />
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={{ 
                                    marginRight: 10, 
                                    padding: 10, 
                                    backgroundColor: '#EFF6FF', 
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: '#BFDBFE'
                                }}
                            >
                                <Calendar size={20} color="#2563EB" />
                            </TouchableOpacity>
                        )}
                        <TextInput
                            style={styles.flexInput}
                            placeholder="DD/MM/YYYY"
                            value={startDateText}
                            onChangeText={handleDateTextChange}
                        />
                    </View>

                    {Platform.OS !== 'web' && showDatePicker && (
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                if (Platform.OS !== 'ios') setShowDatePicker(false);
                                if (selectedDate) {
                                    setStartDate(selectedDate);
                                    setStartDateText(selectedDate.toLocaleDateString());
                                }
                            }}
                            minimumDate={new Date()}
                        />
                    )}

                    {Platform.OS === 'ios' && showDatePicker && (
                        <TouchableOpacity 
                            style={{ alignItems: 'center', padding: 10 }}
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={{ color: '#2563EB', fontWeight: 'bold' }}>Confirmar Fecha</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.label}>Forma de pago</Text>
                    <View style={styles.rowInput}>
                        <DollarSign size={20} color="#666" style={{ marginRight: 10 }} />
                        <TextInput
                            style={styles.flexInput}
                            placeholder="Ej. 50% adelanto"
                            value={paymentTerms}
                            onChangeText={setPaymentTerms}
                        />
                    </View>

                    <View style={styles.rowInput}>
                        <Text style={{ fontWeight: 'bold', marginRight: 10, color: '#666' }}>Moneda:</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setCurrency('$')}
                                style={[styles.currencyBadge, currency === '$' && styles.currencyActive]}
                            >
                                <Text style={{ color: currency === '$' ? 'white' : '#666' }}>$ USD</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setCurrency('Bs')}
                                style={[styles.currencyBadge, currency === 'Bs' && styles.currencyActive]}
                            >
                                <Text style={{ color: currency === 'Bs' ? 'white' : '#666' }}>Bs</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Additional Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Condiciones y Garantías</Text>
                    <TextInput
                        style={[styles.input, { marginBottom: 10 }]}
                        placeholder="Garantía (Ej. 3 meses por mano de obra)"
                        value={warranty}
                        onChangeText={setWarranty}
                    />
                    <TextInput
                        style={[styles.input, { marginBottom: 10 }]}
                        placeholder="Condiciones (Ej. Cliente pone materiales)"
                        value={conditions}
                        onChangeText={setConditions}
                    />
                    <TextInput
                        style={[styles.input]}
                        placeholder="Observaciones adicionales"
                        value={observations}
                        onChangeText={setObservations}
                        multiline
                    />
                </View>

                {/* Tax */}
                <View style={styles.section}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.label}>Agregar IVA</Text>
                        <Switch value={addTax} onValueChange={setAddTax} />
                    </View>
                    {addTax && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Text style={{ marginRight: 10 }}>Tasa (%):</Text>
                            <TextInput
                                style={[styles.input, { width: 80 }]}
                                value={taxRate}
                                keyboardType="numeric"
                                onChangeText={setTaxRate}
                            />
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* Footer Total & Action */}
            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>Total Estimado</Text>
                    <Text style={styles.totalAmount}>{currency} {total.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Text style={styles.sendButtonText}>{isEditing ? 'Actualizar Oferta' : 'Enviar Oferta'}</Text>
                </TouchableOpacity>
            </View>
        </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E5E7EB', paddingTop: 40 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    content: { padding: 16 },
    section: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16 },
    jobTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    clientName: { fontSize: 14, color: '#6B7280' },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    label: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    input: { 
        borderWidth: 2, 
        borderColor: '#000', 
        borderRadius: 8, 
        padding: 10, 
        fontSize: 16, 
        backgroundColor: '#fff',
        color: '#000'
    },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 8, borderStyle: 'dashed', backgroundColor: '#EFF6FF' },
    addButtonText: { color: '#2563EB', fontWeight: '600', marginLeft: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    flexInput: { 
        flex: 1, 
        borderWidth: 2, 
        borderColor: '#000', 
        borderRadius: 8, 
        padding: 10, 
        fontSize: 16, 
        backgroundColor: '#fff',
        color: '#000'
    },
    currencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E7EB' },
    currencyActive: { backgroundColor: '#2563EB' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 12, color: '#6B7280' },
    totalAmount: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
    sendButton: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    sendButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default CreateQuoteScreen;
