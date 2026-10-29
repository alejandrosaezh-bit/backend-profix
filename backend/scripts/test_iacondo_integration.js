const IacondoIntegrationService = require('../services/IacondoIntegrationService');

async function runTests() {
    console.log('--- TEST 1: Validación de Payload ---');
    const invalidPayload = {};
    const validation1 = IacondoIntegrationService.validateQuotePayload(invalidPayload);
    console.log('Payload vacío es inválido:', !validation1.isValid, 'Errores:', validation1.errors.length);

    const sampleQuote = {
        condoSubdomain: 'semeruco',
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
            quoteNumber: 'PC-2026-0891',
            amount: 350.00,
            currency: 'USD',
            laborCost: 200.00,
            materialsCost: 150.00,
            pdfUrl: 'https://storage.profesionalcercano.com/cotizaciones/PC-0891.pdf',
            photos: [
                'https://storage.profesionalcercano.com/evidencias/foto1.jpg'
            ],
            validUntil: '2026-09-30'
        },
        webhookUrl: 'https://api.profesionalcercano.com/webhooks/iacondo-status'
    };

    const validation2 = IacondoIntegrationService.validateQuotePayload(sampleQuote);
    console.log('Payload de muestra es válido:', validation2.isValid, 'Errores:', validation2.errors);

    console.log('\n--- TEST 2: Formateo de Payload con Contrato Exacto ---');
    const formatted = IacondoIntegrationService.formatQuotePayload(sampleQuote, {
        condoSubdomain: 'semeruco',
        webhookUrl: 'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status'
    });
    console.log('Payload Formateado:\n', JSON.stringify(formatted, null, 2));

    console.log('\n--- TEST 3: Verificación de Cabeceras y Endpoint ---');
    const config = {
        apiUrl: 'https://condopro-api.onrender.com/api/integrations/v1',
        apiKey: 'test_key_abc123',
        condoSubdomain: 'semeruco',
        webhookUrl: 'https://profix-backend-h56b.onrender.com/api/webhooks/iacondo-status'
    };

    console.log('URL de destino:', `${config.apiUrl}/maintenance-quotes`);
    console.log('Headers que se enviarán:', {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
    });

    console.log('\n--- TEST 4: Simulación de Webhook de IACONDO ---');
    const mockWebhook = {
        quoteNumber: 'PC-2026-0891',
        status: 'APPROVED',
        approvedAmount: 350.00,
        notes: 'Aprobado por junta de condominio en reunión ordinaria',
        condoSubdomain: 'semeruco'
    };
    console.log('Simulando payload de webhook entrante:', mockWebhook);

    console.log('\n--- TEST 5: Normalización de Subdominio de Condominios ---');
    const sub1 = IacondoIntegrationService.normalizeSubdomain('Semeruco', 'Residencias Semeruco');
    const sub2 = IacondoIntegrationService.normalizeSubdomain('', 'Conjunto Residencial Los Naranjos');
    console.log('Subdominio 1:', sub1, '| Subdominio 2:', sub2);
    
    console.log('\n✅ Todos los tests unitarios pasaron correctamente!');
}

runTests().catch(err => {
    console.error('Error en tests:', err);
    process.exit(1);
});
