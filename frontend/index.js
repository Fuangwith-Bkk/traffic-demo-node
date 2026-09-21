const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Headers that must be forwarded so the mesh can stitch frontend -> backend
// into a single distributed trace, and so header-based routing works.
const FORWARD_HEADERS = [
    'x-request-id', 'traceparent', 'tracestate',
    'x-b3-traceid', 'x-b3-spanid', 'x-b3-parentspanid', 'x-b3-sampled', 'x-b3-flags', 'b3',
    'x-user'
];
const forwardHeaders = (req) => {
    const headers = {};
    for (const h of FORWARD_HEADERS) {
        if (req.headers[h]) headers[h] = req.headers[h];
    }
    return headers;
};

// Call the backend and always resolve (errors are returned as a status + body)
const callBackend = async (req, path) => {
    try {
        const response = await axios.get(`${BACKEND_URL}${path}`, {
            headers: forwardHeaders(req),
            timeout: 15000,
            validateStatus: () => true
        });
        return { status: response.status, data: response.data };
    } catch (error) {
        return { status: 502, data: { error: "Could not talk to Backend", detail: error.message } };
    }
};

const page = (title, status, data) => `
    <div style="font-family: sans-serif; padding: 40px;">
        <h1>${title}</h1>
        <p><strong>Frontend</strong> asked <strong>Backend</strong>. HTTP status: <strong>${status}</strong></p>
        <div style="background: #333; color: #fff; padding: 15px; border-radius: 5px;">
            <pre>${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>
        </div>
        <br>
        <a href="/">Go Back</a>
    </div>
`;

// 1. INGRESS: UI with buttons
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1 style="color: #2c3e50;">Frontend Container</h1>
            <p style="color: green; font-weight: bold;">✔ Ingress Successful</p>
            <hr>
            <h3>Test in-mesh call (no Internet):</h3>
            <a href="/call-backend"><button style="background: #e8eaf6; padding: 10px;">Call Backend /info</button></a>
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

// 2. CONTAINER-TO-CONTAINER: in-mesh call to the backend
app.get('/call-backend', async (req, res) => {
    const result = await callBackend(req, '/info');
    res.status(result.status).send(page('Backend /info', result.status, result.data));
});

// 3. CONTAINER-TO-CONTAINER-TO-INTERNET: Proxy the status code request
app.get('/test-status/:code', async (req, res) => {
    const code = req.params.code;
    console.log(`Frontend: Asking backend to fetch status ${code}...`);
    const result = await callBackend(req, `/external-status/${code}`);
    res.status(result.status).send(page(`Result for Status ${code}`, result.status, result.data));
});

// 4. JSON API (handy for curl and load generators)
app.get('/api/info', async (req, res) => {
    const result = await callBackend(req, '/info');
    res.status(result.status).json(result.data);
});

app.get('/api/external-status/:code', async (req, res) => {
    const result = await callBackend(req, `/external-status/${req.params.code}`);
    res.status(result.status).json(result.data);
});

app.listen(PORT, () => {
    console.log(`Frontend server listening on port ${PORT} (backend: ${BACKEND_URL})`);
});
