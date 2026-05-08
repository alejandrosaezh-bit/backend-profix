const jwt = require('jsonwebtoken');

// Generate Admin JWT
const generateToken = () => {
    return jwt.sign({ id: 'dummy_admin_id' }, 'Clave2025profix', {
        expiresIn: '1d',
    });
};

const run = async () => {
    const token = generateToken();
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    
    // 1. Get users list
    let res = await fetch("https://profix-backend-h56b.onrender.com/api/admin/users", { headers });
    let users = await res.json();
    let targetUser = users.find(u => u.email === "gress.ft@gmail.com");
    if(!targetUser) {
        console.log("User not found!");
        return;
    }
    console.log("Found user:", targetUser._id, targetUser.name, "Role:", targetUser.role);

    // 2. Change password via admin endpoint
    console.log("Changing password to 'clave1234'...");
    res = await fetch(`https://profix-backend-h56b.onrender.com/api/admin/users/${targetUser._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: 'clave1234' })
    });
    let updateResult = await res.json();
    console.log("Update result:", updateResult._id ? "Success" : updateResult);

    // 3. Try to login normally
    console.log("Attempting login...");
    res = await fetch("https://profix-backend-h56b.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "gress.ft@gmail.com", password: "clave1234" })
    });
    let loginData = await res.json();
    console.log("Login result:", loginData);
}

run();
