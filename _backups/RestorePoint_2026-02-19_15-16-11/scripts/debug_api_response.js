
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const login = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'alejandrosaezhes@gmail.com',
      password: 'newpassword123' // Suponiendo esta pass, corrige si es otra
    });
    return res.data.token;
  } catch (e) {
    console.error('Login Failed:', e.message);
    if(e.response) console.log(e.response.data);
    return null;
  }
};

const checkJobs = async (token) => {
  try {
    const res = await axios.get('http://localhost:5000/api/jobs/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.data.length > 0) {
      console.log('--- RAW FIRST JOB ---');
      console.log(JSON.stringify(res.data[0], null, 2));
      console.log('--- CATEGORY FIELD ---');
      console.log(JSON.stringify(res.data[0].category, null, 2));
    } else {
        console.log('No jobs found for this user.');
    }

  } catch (e) {
    console.error('Fetch Jobs Failed:', e.message);
  }
};

const run = async () => {
    // Need a valid password or simulate token directly. 
    // Easier to use backend script to mint token since I have access to secrets.
    // Switching strategy to backend-side script to avoid password guessing.
};
run();
