const fs = require('fs');
const file = 'backend/routes/jobs.routes.js';
let content = fs.readFileSync(file, 'utf8');

const target = `        // Notificar a profesionales si es urgente
        if (createdJob.isUrgent) {
            try {
                const categoryObj = await require('../models/Category').findById(category);
                if (categoryObj) {
                    const pros = await User.find({
                        [\`profiles.\${categoryObj.name}.acceptsUrgentJobs\`]: true,
                        role: 'professional' // ensure they are pros
                    });

                    console.log(\`[POST /jobs] Found \${pros.length} pros for urgent job in \${categoryObj.name}\`);

                    for (const pro of pros) {
                        await NotificationService.notifyUser({
                            userId: pro._id,
                            eventKey: 'prof_quote_responses', // Using existing event template that works
                            title: '🚨 EMERGENCIA 24/7 🚨',
                            body: \`Se requiere \${subcategory || categoryObj.name} URGENTE. Título: \${title}. Ubicación: \${exactLocation?.address || location}\`,
                            data: { jobId: createdJob._id, type: 'urgent_job' },
                            buttonText: 'Ver Emergencia',
                            buttonUrl: \`profix://job/\${createdJob._id}\`
                        });

                        const io = req.app.get('socketio');
                        if (io) {
                            io.to(\`user_\${pro._id}\`).emit('urgent_job_alert', {
                                jobId: createdJob._id,
                                title: createdJob.title,
                                categoryName: categoryObj.name,
                                subcategory: createdJob.subcategory,
                                location: createdJob.exactLocation?.address || createdJob.location
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("[POST /jobs] Error notifying urgent job:", err);
            }
        }`;

const replacement = `        // Notificar a profesionales (Urgente o Normal)
        try {
            const categoryObj = await require('../models/Category').findById(category);
            if (categoryObj) {
                const query = {
                    [\`profiles.\${categoryObj.name}\`]: { $exists: true },
                    role: 'professional',
                    isActive: true
                };
                if (createdJob.isUrgent) {
                    query[\`profiles.\${categoryObj.name}.acceptsUrgentJobs\`] = true;
                }
                const pros = await User.find(query);
                console.log(\`[POST /jobs] Found \${pros.length} pros for \${createdJob.isUrgent ? 'urgent' : 'normal'} job in \${categoryObj.name}\`);

                for (const pro of pros) {
                    const eventTitle = createdJob.isUrgent ? '🚨 EMERGENCIA 24/7 🚨' : 'Nueva Solicitud de Trabajo';
                    const eventBody = createdJob.isUrgent 
                        ? \`Se requiere \${subcategory || categoryObj.name} URGENTE. Título: \${title}. Ubicación: \${exactLocation?.address || location}\`
                        : \`Nuevo trabajo de \${subcategory || categoryObj.name}: \${title}. Ubicación: \${location}\`;

                    await NotificationService.notifyUser({
                        userId: pro._id,
                        eventKey: 'prof_new_requests',
                        title: eventTitle,
                        body: eventBody,
                        data: { jobId: createdJob._id, type: createdJob.isUrgent ? 'urgent_job' : 'new_job' },
                        buttonText: 'Ver Solicitud',
                        buttonUrl: \`profix://job/\${createdJob._id}\`
                    });

                    const io = req.app.get('socketio');
                    if (io) {
                        io.to(\`user_\${pro._id}\`).emit(createdJob.isUrgent ? 'urgent_job_alert' : 'notification', {
                            jobId: createdJob._id,
                            type: createdJob.isUrgent ? 'urgent_job' : 'new_job',
                            title: eventTitle,
                            body: eventBody,
                            categoryName: categoryObj.name,
                            subcategory: createdJob.subcategory,
                            location: createdJob.exactLocation?.address || createdJob.location
                        });
                    }
                }
            }
        } catch (err) {
            console.error("[POST /jobs] Error notifying professionals for new job:", err);
        }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Success");
} else {
    // If not found exactly, try regex replacing the block
    const regex = /\/\/ Notificar a profesionales si es urgente[\s\S]*?catch \(err\) \{\s*console\.error\("\[POST \/jobs\] Error notifying urgent job:", err\);\s*\}\s*\}/m;
    if (regex.test(content)) {
        content = content.replace(regex, replacement);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Regex Success");
    } else {
        console.log("Failed to find block");
    }
}
