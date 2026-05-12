const fs = require('fs');

try {
  let content = fs.readFileSync('src/screens/ClientProfileView.js', 'utf8');

  // We need to replace the entire combinedHistory block.
  // Find the block from "// COMBINAR TRABAJOS" to "// Calcular estadísticas de trabajo"
  const regex = /\/\/ COMBINAR TRABAJOS CON SUS REVIEWS \(Para "Historial y Valoraciones"\)[\s\S]*?\/\/ Calcular estadísticas de trabajo/;
  
  const correctLogic = `// COMBINAR TRABAJOS CON SUS REVIEWS (Para "Historial y Valoraciones")
    const combinedHistory = [];
    
    // 1. Trabajos completados
    const completedJobs = clientJobs.filter(job => ['completed', 'rated', 'Culminada'].includes(job.status));
    
    if (completedJobs && completedJobs.length > 0) {
        completedJobs.forEach(job => {
            const jobImages = [];
            if (job.images && Array.isArray(job.images)) job.images.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
            if (job.workPhotos && Array.isArray(job.workPhotos)) job.workPhotos.forEach(img => { if (img && !jobImages.includes(img)) jobImages.push(img); });
            if (job.projectHistory && Array.isArray(job.projectHistory)) {
                job.projectHistory.forEach(hi => { if (hi && hi.mediaUrl && !jobImages.includes(hi.mediaUrl)) jobImages.push(hi.mediaUrl); });
            }

            // CORRECCIÓN: r.job puede ser objeto o string.
            const review = reviews.find(r => r.job?._id === job._id || r.job === job._id || r.jobId === job._id);

            combinedHistory.push({
                jobId: job._id || job.id,
                title: job.title || 'Solicitud de servicio',
                date: job.createdAt,
                images: jobImages,
                review: review
            });
        });
    }

    // 2. Reseñas sin trabajo en la lista
    reviews.forEach(rev => {
        const jobId = rev.job?._id || rev.job || rev.jobId;
        if (!combinedHistory.some(ch => ch.jobId === jobId)) {
            combinedHistory.push({
                jobId: jobId,
                title: rev.job?.title || 'Servicio valorado',
                date: rev.createdAt || new Date().toISOString(),
                images: [],
                review: rev
            });
        }
    });

    combinedHistory.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Calcular estadísticas de trabajo`;

  content = content.replace(regex, correctLogic);
  
  // ALSO, wait... I noticed in the JSX I did not fix the "Completado sin reseña" text, I left it with an encoding error: "sin resea."
  content = content.replace("Completado sin resea.", "Completado sin reseña.");
  content = content.replace("Aǧn no hay", "Aún no hay");

  fs.writeFileSync('src/screens/ClientProfileView.js', content, 'utf8');
  console.log('done fixing combined history');
} catch(e) {
  console.error(e);
}
