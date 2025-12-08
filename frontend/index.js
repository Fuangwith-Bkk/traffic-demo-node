// frontend/index.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Use environment variable for backend URL, default to localhost for local testing
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// 1. INGRESS DEMO: You load this page
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #2c3e50;">Frontend Container</h1>
            <p style="color: green; font-weight: bold;">✔ Ingress Successful (You reached me!)</p>
            <hr>
            <p>Click the button below to test Container-to-Container traffic:</p>
            <a href="/test-connection">
                <button style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Call Backend</button>
            </a>
        </div>
    `);
});

// 2. CONTAINER-TO-CONTAINER DEMO: Frontend calls Backend
app.get('/test-connection', async (req, res) => {
    try {
        console.log(`Frontend: Calling backend at ${BACKEND_URL}...`);
        
        // This is the INTERNAL traffic (Container -> Container)
        const response = await axios.get(`${BACKEND_URL}/external-data`);

        res.send(`
            <div style="font-family: sans-serif; padding: 40px;">
                <h1>Communication Result</h1>
                <h3>✅ Backend Responded!</h3>
                <p><strong>Raw Data from Backend:</strong></p>
                <pre style="background: #f4f4f4; padding: 15px; border-radius: 5px;">${JSON.stringify(response.data, null, 2)}</pre>
                <br>
                <a href="/">Go Back</a>
            </div>
        `);
    } catch (error) {
        console.error("Frontend Error:", error.message);
        res.send(`
            <div style="font-family: sans-serif; padding: 40px;">
                <h1 style="color: red;">❌ Communication Failed</h1>
                <p>Could not reach Backend at: <code>${BACKEND_URL}</code></p>
                <p>Error details: ${error.message}</p>
                <a href="/">Go Back</a>
            </div>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Frontend server listening on port ${PORT}`);
});