const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// 1. INGRESS: Updated UI with Status Code Buttons
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #2c3e50;">Frontend Container</h1>
            <p style="color: green; font-weight: bold;">✔ Ingress Successful</p>
            <hr>
            <h3>Test Egress Status Codes:</h3>
            <p>Click a button to tell the Backend to fetch a specific code from the Internet:</p>
            
            <a href="/test-status/200"><button style="background: #e1f7d5; padding: 10px;">Send 200 (Success)</button></a>
            <a href="/test-status/404"><button style="background: #fff4e5; padding: 10px;">Send 404 (Not Found)</button></a>
            <a href="/test-status/418"><button style="background: #e0f7fa; padding: 10px;">Send 418 (Teapot)</button></a>
            <a href="/test-status/500"><button style="background: #ffebee; padding: 10px;">Send 500 (Server Error)</button></a>
        </div>
    `);
});

// 2. CONTAINER-TO-CONTAINER: Proxy the status code request
app.get('/test-status/:code', async (req, res) => {
    const code = req.params.code;
    try {
        console.log(`Frontend: Asking backend to fetch status ${code}...`);
        
        // Call the Backend's new endpoint
        const response = await axios.get(`${BACKEND_URL}/external-status/${code}`);

        // Display the JSON nicely
        res.send(`
            <div style="font-family: sans-serif; padding: 40px;">
                <h1>Result for Status ${code}</h1>
                <p><strong>Frontend</strong> asked <strong>Backend</strong> to ask <strong>Internet</strong>.</p>
                <div style="background: #333; color: #fff; padding: 15px; border-radius: 5px;">
                    <pre>${JSON.stringify(response.data, null, 2)}</pre>
                </div>
                <br>
                <a href="/">Go Back</a>
            </div>
        `);
    } catch (error) {
        // Handle case where Backend itself is down
        res.send(`
            <h1 style="color: red;">Communication Error</h1>
            <p>Could not talk to Backend.</p>
            <pre>${error.message}</pre>
            <a href="/">Go Back</a>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Frontend server listening on port ${PORT}`);
});