const fetch = require('node-fetch'); // Since Node 18 fetch is built-in
require('dotenv').config();

const run = async () => {
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    // Pro ID: 69a8319da8bc908566ad8f25
    const token = jwt.sign({ id: '69a8319da8bc908566ad8f25' }, process.env.JWT_SECRET || 'Clave2025profix', { expiresIn: '30d' });

    const filters = { role: 'pro', include_media: 'true' };
    const t = new Date().getTime();
    const queryString = new URLSearchParams({ ...filters, t }).toString();
    const url = `https://profix-backend.onrender.com/api/jobs/me?${queryString}`;
    
    console.log("Fetching", url);
    const res = await global.fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const text = await res.text();
    console.log(text.substring(0, 500));

    process.exit(0);
}
run().catch(console.error);
