const mongoose = require('mongoose');
const Category = require('../models/Category');

const PLACEHOLDERS_DATA = {
    "Hogar": {
        "Aire Acondicionado": {
            title: "Ej. Mantenimiento y limpieza de split 12000 BTU",
            description: "Ej. El aire acondicionado no enfría lo suficiente y bota agua por dentro. Necesito revisión de gas y limpieza profunda..."
        },
        "Plomería": {
            title: "Ej. Fuga de agua debajo del fregadero",
            description: "Ej. Hay un bote de agua constante en la tubería de la cocina y la llave de paso está trabada. Requiero cambio de conexión..."
        },
        "Electricidad": {
            title: "Ej. Cortocircuito en tablero principal y tomas sin corriente",
            description: "Ej. Se disparó el breaker principal tras enchufar el microondas y varias tomas de la sala dejaron de funcionar..."
        },
        "Pintura": {
            title: "Ej. Pintura interior de apartamento (sala y 2 habitaciones)",
            description: "Ej. Requiero pintar paredes y techos de aproximadamente 75m2 en color blanco mate. Dispongo del material..."
        },
        "Albañilería": {
            title: "Ej. Reparación de filtración y frisado de pared",
            description: "Ej. Se levantó el friso por humedad en la pared del patio y necesito reparar, sellar y dejar lista para pintar..."
        },
        "Limpieza": {
            title: "Ej. Limpieza profunda post-mudanza de apartamento",
            description: "Ej. Busco servicio de limpieza general para apartamento de 90m2: vidrios, cocina a fondo, baños y pisos..."
        },
        "Cerrajería": {
            title: "Ej. Cambio de cilindro y cerradura de seguridad",
            description: "Ej. Se extraviaron las llaves y necesito cambiar el bombín de la puerta principal (tipo multilock)..."
        },
        "Carpintería": {
            title: "Ej. Ajuste de puertas de clóset y bisagras",
            description: "Ej. Las puertas corredizas del clóset se salieron del riel y una gaveta de la cocina está descuadrada..."
        }
    },
    "Autos": {
        "Mecánica Ligera": {
            title: "Ej. Cambio de pastillas de freno y revisión de tren delantero",
            description: "Ej. El auto hace un chillido al frenar y vibra el volante a más de 80 km/h (Toyota Corolla 2016)..."
        },
        "Cauchos": {
            title: "Ej. Reparación de pinchazo o cambio de cauchos",
            description: "Ej. Tengo un neumático desinflado con un clavo en el hombro, necesito vulcanización o montaje de repuesto..."
        },
        "Baterías": {
            title: "Ej. Auxilio vial por batería o reemplazo a domicilio",
            description: "Ej. El carro no da arranque en el estacionamiento, hace chasquido rápido. Requiero puente o batería de 800 amp..."
        },
        "Aire Acondicionado Auto": {
            title: "Ej. Carga de gas y revisión de compresor",
            description: "Ej. El aire solo tira ventilación caliente. Posible fuga en el evaporador o falta de gas R134a..."
        },
        "Latonería y Pintura": {
            title: "Ej. Reparación de abolladura en guardabarro derecho",
            description: "Ej. Pequeño golpe de estacionamiento con raspadura de pintura en la puerta y guardabarro trasero..."
        },
        "Autolavado": {
            title: "Ej. Lavado a vapor y detailing de tapicería a domicilio",
            description: "Ej. Limpieza profunda de asientos de tela manchados, techo y desinfección del interior..."
        },
        "Grúa": {
            title: "Ej. Remolque de vehículo accidentado en plataforma",
            description: "Ej. Vehículo sedán apagado por falla de motor en la Av. Principal, requiere traslado en plataforma hasta taller..."
        }
    },
    "Salud": {
        "Enfermería": {
            title: "Ej. Curación de herida quirúrgica y tratamiento a domicilio",
            description: "Ej. Requiero enfermera(o) profesional para cura diaria de herida post-operatoria y control de signos vitales..."
        },
        "Fisioterapia": {
            title: "Ej. Rehabilitación postoperatoria de tobillo o rodilla",
            description: "Ej. Paciente de 45 años necesita 10 sesiones de fisioterapia a domicilio tras cirugía de ligamentos/fractura..."
        },
        "Nutrición": {
            title: "Ej. Plan nutricional personalizado para pérdida de peso / patología",
            description: "Ej. Busco asesoría nutricional y plan de alimentación adaptado para resistencia a la insulina y hábitos saludables..."
        },
        "Cuidado de Adultos Mayores": {
            title: "Ej. Acompañamiento y asistencia para adulto mayor (turno día)",
            description: "Ej. Busco cuidadora responsable para acompañar a señora de 82 años con movilidad reducida: apoyo en aseo y medicinas..."
        },
        "Psicología": {
            title: "Ej. Terapia psicológica individual para manejo de ansiedad",
            description: "Ej. Busco psicólogo clínico (presencial u online) para sesiones semanales de enfoque cognitivo-conductual..."
        },
        "Entrenador Personal": {
            title: "Ej. Rutina de entrenamiento funcional y tonificación",
            description: "Ej. Requiero entrenador personal 3 veces por semana en parque o gimnasio del edificio para ganar masa muscular..."
        },
        "Dentista": {
            title: "Ej. Limpieza dental profunda y evaluación de caries",
            description: "Ej. Siento molestia al masticar en una muela inferior y requiero profilaxis y diagnóstico general..."
        }
    },
    "Tech": {
        "Reparación PC/Laptop": {
            title: "Ej. Laptop no enciende / Formateo y mantenimiento térmico",
            description: "Ej. Mi laptop Lenovo calienta mucho, el ventilador hace ruido y el sistema operativo está muy lento..."
        },
        "Redes y WiFi": {
            title: "Ej. Ampliación de cobertura WiFi con repetidor/Mesh",
            description: "Ej. La señal no llega a las habitaciones traseras. Requiero cableado de red Cat6 o configuración de router Mesh..."
        },
        "Cámaras de Seguridad": {
            title: "Ej. Instalación de 4 cámaras de seguridad CCTV / IP",
            description: "Ej. Necesito colocar 4 cámaras en los accesos de la casa y configurarlas para verlas en vivo desde el celular..."
        },
        "Instalación de Software": {
            title: "Ej. Instalación de sistema operativo y programas de diseño/oficina",
            description: "Ej. Requiero instalación limpia de Windows 11, paquete Office y software de edición con licencias..."
        },
        "Reparación de Celulares": {
            title: "Ej. Cambio de pantalla rota y batería para celular",
            description: "Ej. Pantalla estrellada táctil no responde (Samsung A54) y la batería dura muy pocas horas..."
        }
    },
    "Belleza": {
        "Peluquería": {
            title: "Ej. Corte de cabello, secado e hidratación a domicilio",
            description: "Ej. Requiero estilista para corte de puntas, tratamiento de keratina/botox capilar y peinado para evento..."
        },
        "Manicure/Pedicure": {
            title: "Ej. Manicure semipermanente y spa de pies",
            description: "Ej. Arreglo de uñas con esmaltado en gel semipermanente y limpieza completa de pies a domicilio..."
        },
        "Maquillaje": {
            title: "Ej. Maquillaje social y peinado para boda/graduación",
            description: "Ej. Requiero maquillaje profesional de larga duración para evento nocturno a las 6:00 PM..."
        },
        "Barbería": {
            title: "Ej. Corte fade moderno y perfilado de barba",
            description: "Ej. Servicio de barbería a domicilio: degradado bajo, perfilado con navaja y tratamiento de toalla caliente..."
        },
        "Masajes": {
            title: "Ej. Masaje descontracturante de espalda y cuello",
            description: "Ej. Mucha tensión acumulada en zona cervical y hombros. Sesión de 60 minutos de masoterapia a domicilio..."
        }
    },
    "Eventos": {
        "Fotografía": {
            title: "Ej. Sesión fotográfica para cumpleaños infantil / evento social",
            description: "Ej. Cobertura de 3 horas para fiesta familiar, entrega de fotos editadas en alta resolución..."
        },
        "Decoración": {
            title: "Ej. Arreglo con globos y backing para fiesta de 15 años",
            description: "Ej. Decoración temática con arco orgánico de globos, mesa de dulces y luces LED..."
        },
        "Catering/Comida": {
            title: "Ej. Pasapalos y bocadillos gourmet para 30 personas",
            description: "Ej. Menú variado de pasapalos fríos y calientes (dulces y salados) para reunión corporativa/familiar..."
        },
        "Música/DJ": {
            title: "Ej. Sonido profesional y DJ para fiesta privada",
            description: "Ej. Requiero luces, sonido para salón mediano y DJ con música variada (crossover) por 5 horas..."
        },
        "Animación": {
            title: "Ej. Show infantil con juegos y pinta-caritas",
            description: "Ej. Animadores para entretener a grupo de 15 niños durante 2 horas con dinámicas y concursos..."
        }
    },
    "Mascotas": {
        "Paseo de Perros": {
            title: "Ej. Paseos diarios de 45 min para perro mediano",
            description: "Ej. Busco paseador con experiencia de lunes a viernes en horario de la mañana para Golden Retriever juguetón..."
        },
        "Veterinaria a Domicilio": {
            title: "Ej. Consulta veterinaria general y vacunación",
            description: "Ej. Mi gato está decaído y no come. Requiero chequeo clínico, desparasitación y toma de muestra..."
        },
        "Peluquería Canina": {
            title: "Ej. Baño medicado, corte de pelo y corte de uñas",
            description: "Ej. Baño y corte de raza para Poodle mediano a domicilio o en van móvil..."
        },
        "Adiestramiento": {
            title: "Ej. Adiestramiento básico y corrección de conducta",
            description: "Ej. Cachorro de 6 meses que muerde muebles y tira mucho de la correa durante los paseos..."
        }
    },
    "Legal": {
        "Abogado": {
            title: "Ej. Asesoría legal para contrato de arrendamiento / compraventa",
            description: "Ej. Requiero revisión de contrato de alquiler comercial y orientación sobre cláusulas legales..."
        },
        "Gestoría": {
            title: "Ej. Trámite de legalización, apostilla o registro de documentos",
            description: "Ej. Necesito gestionar partida de nacimiento y antecedentes penales para trámites en el extranjero..."
        },
        "Contabilidad": {
            title: "Ej. Declaración de impuestos mensuales (IVA / ISLR)",
            description: "Ej. Asesoría contable para persona natural/empresa y balance general para solicitud bancaria..."
        },
        "Redacción de Documentos": {
            title: "Ej. Redacción de poder notariado o documento de venta",
            description: "Ej. Redacción de poder especial para venta de vehículo ante notaría pública..."
        }
    },
    "Bienes Raíces": {
        "Agente inmobiliario": {
            title: "Ej. Promoción y captación para venta de apartamento",
            description: "Ej. Busco corredor inmobiliario para comercializar apartamento de 3 habitaciones en zona residencial..."
        },
        "Tasador": {
            title: "Ej. Avalúo comercial certificado de propiedad",
            description: "Ej. Necesito informe de avalúo actualizado para trámite sucesoral o venta de local comercial..."
        },
        "Fotógrafo": {
            title: "Ej. Sesión de fotos profesionales y video para inmueble",
            description: "Ej. Fotografías con gran angular y video recorrido para publicar en portales inmobiliarios..."
        }
    },
    "Cursos": {
        "Inteligencia Artificial": {
            title: "Ej. Clases particulares de IA aplicada a negocios / ChatGPT",
            description: "Ej. Busco instructor para aprender a automatizar tareas con herramientas de Inteligencia Artificial..."
        },
        "Matemática": {
            title: "Ej. Tutoría de cálculo / álgebra para secundaria o universidad",
            description: "Ej. Preparación para examen final de matemáticas, 2 horas semanales a domicilio o vía Zoom..."
        },
        "Física y Química": {
            title: "Ej. Nivelación académica de física y química general",
            description: "Ej. Explicación de ejercicios de cinemática y estequiometría para bachillerato..."
        }
    },
    "Servicios": {
        "Mensajería": {
            title: "Ej. Envío y entrega de paquete o encomienda urgente",
            description: "Ej. Traslado de sobre con documentos desde Oficina A hasta Torre B antes de las 3:00 PM..."
        }
    }
};

async function updatePlaceholders() {
    try {
        await mongoose.connect('mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta');
        console.log("Connected to MongoDB");

        const categories = await Category.find();

        for (let cat of categories) {
            console.log(`Processing category: ${cat.name}`);
            const catMap = PLACEHOLDERS_DATA[cat.name] || {};

            let modified = false;
            for (let sub of cat.subcategories) {
                const subName = sub.name;
                const custom = catMap[subName];

                if (custom) {
                    sub.titlePlaceholder = custom.title;
                    sub.descriptionPlaceholder = custom.description;
                    modified = true;
                    console.log(`  Updated [${subName}]: ${custom.title}`);
                } else if (!sub.titlePlaceholder || sub.titlePlaceholder.includes('Reparación general')) {
                    sub.titlePlaceholder = `Ej. Servicio de ${subName}`;
                    sub.descriptionPlaceholder = `Ej. Detalla lo que necesitas para tu solicitud de ${subName}...`;
                    modified = true;
                    console.log(`  Updated fallback [${subName}]: ${sub.titlePlaceholder}`);
                }
            }

            if (modified) {
                await cat.save();
                console.log(` Saved ${cat.name}`);
            }
        }

        console.log(" All subcategories updated successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating placeholders:", err);
        process.exit(1);
    }
}

updatePlaceholders();
