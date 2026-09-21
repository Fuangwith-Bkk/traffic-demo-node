// backend/index.js
const express = require('express');
const axios = require('axios');
const os = require('os');
const app = express();
const PORT = 3001; // We will run backend on port 3001 internally

// --- Service mesh lab settings (all optional) ---
// APP_VERSION       : version label returned in every response (v1, v2, ...)
// FAIL_RATE         : percentage (0-100) of requests answered with HTTP 503
// DELAY_MS          : artificial delay added to every request
// EXTERNAL_API_BASE : base URL of the external API used for egress tests
const VERSION = process.env.APP_VERSION || 'v1';
const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE || 'https://httpbin.org';
let failRate = parseInt(process.env.FAIL_RATE || '0', 10);
let delayMs = parseInt(process.env.DELAY_MS || '0', 10);

// Middleware to parse JSON
app.use(express.json());

const identity = () => ({ source: "Backend Container", version: VERSION, hostname: os.hostname() });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Change failure/delay settings of THIS pod at runtime: /admin/chaos?fail=50&delay=2000
// (the admin endpoint itself is never delayed or failed)
app.get('/admin/chaos', (req, res) => {
    if (req.query.fail !== undefined) failRate = parseInt(req.query.fail, 10) || 0;
    if (req.query.delay !== undefined) delayMs = parseInt(req.query.delay, 10) || 0;
    console.log(`Backend: chaos settings fail=${failRate}% delay=${delayMs}ms`);
    res.json({ ...identity(), fail_rate: failRate, delay_ms: delayMs });
});

// Apply the simulated delay/failure to every other request
app.use(async (req, res, next) => {
    if (delayMs > 0) await sleep(delayMs);
    if (failRate > 0 && Math.random() * 100 < failRate) {
        console.log(`Backend: simulated failure for ${req.path}`);
        return res.status(503).json({ ...identity(), error: "Simulated failure (FAIL_RATE)" });
    }
    next();
});

// 1. HEALTH CHECK: Simple ping
app.get('/', (req, res) => {
    res.send({ ...identity(), status: "Backend is running", time: new Date() });
});

// 2. INFO: in-mesh call only, no egress (used by the traffic management labs)
app.get('/info', (req, res) => {
    res.json({ ...identity(), message: `Hello from backend ${VERSION}`, time: new Date() });
});

// 3. EGRESS DEMO: This endpoint talks to the outside world
app.get('/external-data', async (req, res) => {
    try {
        console.log(`Backend: Attempting Egress to ${EXTERNAL_API_BASE}...`);

        // This is the EGRESS traffic (Container -> Internet)
        const response = await axios.get(`${EXTERNAL_API_BASE}/uuid`);

        res.json({
            ...identity(),
            message: "I fetched this from the internet!",
            data_from_internet: response.data
        });
    } catch (error) {
        console.error("Egress failed:", error.message);
        res.status(502).json({ ...identity(), error: "Failed to reach external API", detail: error.message });
    }
});

// 4. EGRESS STATUS: forwards a status code request (e.g., 200, 404, 500) to httpbin
app.get('/external-status/:code', async (req, res) => {
    const code = req.params.code;

    try {
        console.log(`Backend: Requesting status ${code} from ${EXTERNAL_API_BASE}...`);

        const response = await axios.get(`${EXTERNAL_API_BASE}/status/${code}`, {
            // IMPORTANT: Prevent axios from throwing errors on 4xx/5xx responses
            validateStatus: function (status) {
                return true;
            }
        });

        // Return the result to the frontend
        res.json({
            ...identity(),
            requested_code: code,
            received_from_internet: response.status,
            message: `External API returned HTTP ${response.status}`
        });

    } catch (error) {
        console.error("Egress failed:", error.message);
        res.status(502).json({ ...identity(), error: "Failed to reach external API", detail: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend ${VERSION} listening on port ${PORT} (external API: ${EXTERNAL_API_BASE})`);
});
