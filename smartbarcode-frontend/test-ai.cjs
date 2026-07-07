const axios = require('axios');

async function test() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'adminpassword' // Assuming this is the admin password based on common defaults, or I'll try to get it
    });
    
    const token = loginRes.data.accessToken;
    console.log("Logged in successfully, token acquired.");

    // 2. Call AI Chat
    const chatRes = await axios.post('http://localhost:5000/api/ai/chat', 
      { message: "What is our total revenue for today?" },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Chat Response:", chatRes.data);
  } catch (error) {
    if (error.response) {
      console.error("API Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

test();
