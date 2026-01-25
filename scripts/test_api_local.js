// const fetch = require('node-fetch'); // Using built-in fetch

async function testApi() {
    try {
        console.log("Testing Public API: http://localhost:5000/api/categories");
        const resPublic = await fetch('http://localhost:5000/api/categories');
        if (resPublic.ok) {
            const data = await resPublic.json();
            console.log(`Public API Success. Count: ${data.length}`);
            console.log("Categories:", data.map(c => c.name));
        } else {
            console.error(`Public API Failed: ${resPublic.status} ${resPublic.statusText}`);
        }

        console.log("\nTesting Admin API: http://localhost:5000/api/admin/categories");
        // Note: Admin API might need auth if we implemented it, but currently it seems open or just checking headers in frontend? 
        // Looking at admin.routes.js, it doesn't seem to have middleware applied in the route definition itself, 
        // but let's check server.js to see if there's global middleware.
        // server.js: app.use('/api/admin', adminRoutes); -> No auth middleware visible in snippet.
        
        const resAdmin = await fetch('http://localhost:5000/api/admin/categories', {
            method: 'GET' // Admin routes usually don't have a GET /categories, let's check admin.routes.js
        });
        
        // Wait, admin.routes.js has POST /categories, PUT /categories/:id, DELETE ... 
        // Does it have GET?
        // Let's check the file content again.
    } catch (error) {
        console.error("Connection Failed:", error.message);
    }
}

testApi();