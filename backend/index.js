// backend/index.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001; // We will run backend on port 3001 internally

// Middleware to parse JSON
app.use(express.json());

// 1. HEALTH CHECK: Simple ping
app.get('/', (req, res) => {
    res.send({ status: "Backend is running", time: new Date() });
});

// 2. EGRESS DEMO: This endpoint talks to the outside world
app.get('/external-data', async (req, res) => {
    try {
        console.log("Backend: Attempting Egress to httpbin.org...");
        
        // This is the EGRESS traffic (Container -> Internet)
        const response = await axios.get('https://httpbin.org/uuid');

        res.json({
            source: "Backend Container",
            message: "I fetched this from the internet!",
            data_from_internet: response.data
        });
    } catch (error) {
        console.error("Egress failed:", error.message);
        res.status(500).json({ error: "Failed to reach external API" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});