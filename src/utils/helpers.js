import { Alert, Platform } from 'react-native';

export const showAlert = (title, message, onPress = null) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n${message}`);
        if (onPress) onPress();
    } else {
        Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : undefined);
    }
};

export const showConfirmation = (title, message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar", destructive = false) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n${message}`)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    } else {
        Alert.alert(
            title,
            message,
            [
                { text: cancelText, style: "cancel", onPress: onCancel },
                {
                    text: confirmText,
                    style: destructive ? "destructive" : "default",
                    onPress: onConfirm
                }
            ]
        );
    }
};

// Helper para comparar IDs de forma segura
export const areIdsEqual = (id1, id2) => {
    if (!id1 || !id2) return false;
    const s1 = (typeof id1 === 'object' && id1 !== null) ? (id1._id || id1.id || id1.toString()) : String(id1);
    const s2 = (typeof id2 === 'object' && id2 !== null) ? (id2._id || id2.id || id2.toString()) : String(id2);
    const str1 = String(s1).replace(/["']/g, "").trim();
    const str2 = String(s2).replace(/["']/g, "").trim();
    return str1 === str2;
};

export const getClientStatus = (request) => {
    // PRIORITY ORDER: TERMINADO > VALORACIÓN > VALIDANDO > EN EJECUCIÓN > PRESUPUESTADA > CONTACTADA > ABIERTA > NUEVA
    if (request.status === 'canceled' || request.status === 'Cerrada') return 'ELIMINADA';

    // 1. TERMINADO (Any rating exists or status is rated/completed)
    const isRated = !!(request.status === 'rated' || request.status === 'TERMINADO' || request.status === 'completed' || request.status === 'Culminada' || request.clientRated || request.proRated || request.rating > 0 || request.proRating > 0 || (request.proFinished && request.clientFinished));
    if (isRated) return 'TERMINADO';

    // 3. VALIDANDO (Pro finished, Client hasn't confirmed)
    if (request.proFinished && !request.clientFinished) return 'VALIDANDO';

    // 4. EN EJECUCIÓN (Started)
    if (request.status === 'in_progress' || request.status === 'started' || request.status === 'En Ejecución') return 'EN EJECUCIÓN';

    const activeOffers = request.offers?.filter(o => o.status !== 'rejected');
    if (activeOffers && activeOffers.length > 0) return 'PRESUPUESTADA';

    // If there are offers but all are rejected
    if (request.offers && request.offers.length > 0) return 'RECHAZADA';

    if ((request.conversations && request.conversations.length > 0) || request.interactionsSummary?.contacted > 0) {
        return 'CONTACTADA';
    }

    return 'NUEVA';
};

export const getClientStatusColor = (status) => {
    switch (status) {
        case 'NUEVA': return { bg: '#6B7280', text: 'white' };
        case 'ABIERTA': return { bg: '#10B981', text: 'white' };
        case 'CONTACTADA': return { bg: '#2563EB', text: 'white' };
        case 'PRESUPUESTADA': return { bg: '#F59E0B', text: 'white' };
        case 'RECHAZADA': return { bg: '#EF4444', text: 'white' };
        case 'EN EJECUCIÓN': return { bg: '#059669', text: 'white' };
        case 'VALIDANDO': return { bg: '#F97316', text: 'white' };
        case 'VALORACIÓN': return { bg: '#8B5CF6', text: 'white' };
        case 'TERMINADO': return { bg: '#1F2937', text: 'white' };
        case 'ELIMINADA': return { bg: '#EF4444', text: 'white' };
        default: return { bg: '#6B7280', text: 'white' };
    }
};

export const getProStatusColor = (status) => {
    switch (status) {
        case 'GANADA': return { bg: '#DCFCE7', text: '#15803D' };
        case 'EN EJECUCIÓN': return { bg: '#D1FAE5', text: '#065F46' };
        case 'ACEPTADO': return { bg: '#DCFCE7', text: '#15803D' };
        case 'VALIDANDO': return { bg: '#FFEDD5', text: '#C2410C' };
        case 'VALORACIÓN': return { bg: '#E0E7FF', text: '#4338CA' };
        case 'TERMINADO': return { bg: '#1F2937', text: '#F9FAFB' };
        case 'PRESUPUESTADA': return { bg: '#FEF3C7', text: '#D97706' };
        case 'CONTACTADA': return { bg: '#DBEAFE', text: '#1E40AF' };
        case 'PERDIDA': return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'RECHAZADA': return { bg: '#FEE2E2', text: '#B91C1C' };
        case 'ABIERTA': return { bg: '#F3F4F6', text: '#4B5563' };
        case 'NUEVA': return { bg: '#ECFDF5', text: '#10B981' };
        case 'FINALIZADA': return { bg: '#1F2937', text: '#F9FAFB' };
        case 'Cerrada': return { bg: '#FEE2E2', text: '#B91C1C' };
        default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
};

export const getProStatus = (job, myId) => {
    if (job.calculatedProStatus) return job.calculatedProStatus;
    if (!job) return 'NUEVA';
    if (job.status === 'canceled' || job.status === 'Cerrada') return 'Cerrada';

    // Check if I am/was the professional for this job
    const isWinner = (job.professional && areIdsEqual(job.professional._id || job.professional, myId)) ||
        (job.offers && job.offers.some(o => areIdsEqual(o.proId?._id || o.proId, myId) && o.status === 'accepted'));

    // Check if another professional won
    const someoneElseWon = (job.professional && !areIdsEqual(job.professional._id || job.professional, myId)) ||
        (job.offers && job.offers.some(o => !areIdsEqual(o.proId?._id || o.proId, myId) && o.status === 'accepted'));

    if (someoneElseWon) return 'PERDIDA';

    if (job.status === 'rated' || job.status === 'completed' || job.status === 'Culminada' || job.status === 'TERMINADO') {
        if (!isWinner) return 'PERDIDA';
        if (job.status === 'rated' || job.status === 'TERMINADO' || job.proRated || job.clientRated || job.proRating > 0 || job.rating > 0) return 'TERMINADO';
        if (job.proFinished && job.clientFinished) return 'VALORACIÓN';
        return 'VALIDANDO';
    }

    if (job.status === 'in_progress' || job.status === 'started' || job.status === 'En Ejecución') {
        if (isWinner) {
            if (job.proFinished) return 'VALIDANDO';
            if (job.trackingStatus === 'started') return 'EN EJECUCIÓN';
            return 'ACEPTADO';
        }
        return 'PERDIDA';
    }

    // CHECK SHORTCUT (Calculated during loadRequests)
    if (job._myOfferStatus) {
        if (job._myOfferStatus === 'accepted') return 'GANADA';
        // Only return RECHAZADA if no one else won (someoneElseWon check already handled that above)
        if (job._myOfferStatus === 'rejected') return 'RECHAZADA';
        if (job._myOfferStatus === 'pending' || job._myOfferStatus === 'sent') return 'PRESUPUESTADA';
    }

    // CHECK OFFERS (For jobs not yet in progress/completed)
    // Es posible que offers venga como strings (IDs) o como objetos populados.
    // Manejar ambos casos.
    const myOffer = job.offers?.find(o => areIdsEqual(o.proId?._id || o.proId || o, myId));

    if (myOffer) {
        console.log(`[getProStatus] Found offer for ${job._id} (Status: ${myOffer.status})`);
        if (myOffer.status === 'accepted') return 'GANADA';
        if (myOffer.status === 'rejected') return 'RECHAZADA';
        if (myOffer.status === 'pending' || myOffer.status === 'sent') return 'PRESUPUESTADA';
    } else {
        // if (job.offers && job.offers.length > 0) {
        //     console.log(`[getProStatus] No matching offer for ${myId} in job ${job._id}. Offers proIds:`, job.offers.map(o => o.proId));
        // }
    }

    // CHECK CONVERSATIONS
    const myConv = job.conversations?.find(c => areIdsEqual(c.proId?._id || c.proId, myId));
    if (myConv) return 'CONTACTADA';

    // INTERACTION STATUS (Fallback)
    const dbStatus = job.proInteraction?.status || job.proInteractionStatus || 'new';
    switch (dbStatus) {
        case 'viewed': return 'ABIERTA';
        case 'contacted': return 'CONTACTADA';
        case 'offered': return 'PRESUPUESTADA';
        case 'won': return 'GANADA';
        case 'lost': return 'PERDIDA';
        case 'rejected': return 'RECHAZADA';
        case 'archived': return 'Archivada';
        default: return 'NUEVA';
    }
};
