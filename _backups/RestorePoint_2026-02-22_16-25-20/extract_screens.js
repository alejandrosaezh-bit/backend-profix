const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

function extractBetween(startStr, endStr) {
    const start = content.indexOf(startStr);
    const end = content.indexOf(endStr);
    if (start === -1 || (end !== -1 && end < start)) return null;
    if (end === -1) return content.substring(start).trim();
    return content.substring(start, end).trim();
}

const serviceForm = extractBetween('const ServiceForm =', '// --- 5. PANTALLAS DE DETALLE ---');
const requestDetailClient = extractBetween('const RequestDetailClient =', 'const JobDetailPro =');
const jobDetailPro = extractBetween('const JobDetailPro =', 'const RatingForm =');
const ratingForm = extractBetween('const RatingForm =', 'const CloseRequestModal =');
const closeRequestModal = extractBetween('const CloseRequestModal =', 'const ProjectTimeline =');
const projectTimeline = extractBetween('const ProjectTimeline =', '// --- 6. APP PRINCIPAL (CONTENEDOR) ---');

console.log('ServiceForm len:', serviceForm ? serviceForm.length : 0);
console.log('RequestDetailClient len:', requestDetailClient ? requestDetailClient.length : 0);
console.log('JobDetailPro len:', jobDetailPro ? jobDetailPro.length : 0);
console.log('RatingForm len:', ratingForm ? ratingForm.length : 0);
console.log('CloseRequestModal len:', closeRequestModal ? closeRequestModal.length : 0);
console.log('ProjectTimeline len:', projectTimeline ? projectTimeline.length : 0);

if (serviceForm) fs.writeFileSync('./src/screens/ServiceForm.js', serviceForm, 'utf8');
if (requestDetailClient) fs.writeFileSync('./src/screens/RequestDetailClient.js', requestDetailClient, 'utf8');
if (jobDetailPro) fs.writeFileSync('./src/screens/JobDetailPro.js', jobDetailPro, 'utf8');
if (ratingForm) fs.writeFileSync('./src/screens/RatingForm.js', ratingForm, 'utf8');
if (closeRequestModal) fs.writeFileSync('./src/screens/CloseRequestModal.js', closeRequestModal, 'utf8');
if (projectTimeline) fs.writeFileSync('./src/screens/ProjectTimeline.js', projectTimeline, 'utf8');
