# traffic-demo-node

Two small Node.js services used for the OpenShift Service Mesh 3 hands-on lab.

```
Browser -> frontend (:3000) -> backend (:3001) -> https://httpbin.org
```

## frontend

| Path | Description |
|---|---|
| `/` | UI with buttons |
| `/healthz` | Probe endpoint |
| `/call-backend`, `/api/info` | Calls backend `/info` (in-mesh only, no Internet) |
| `/test-status/:code`, `/api/external-status/:code` | Asks backend to fetch `/status/:code` from the external API |

Env: `BACKEND_URL` (default `http://localhost:3001`). The frontend forwards tracing headers
(`traceparent`, `x-b3-*`, `x-request-id`) and `x-user` to the backend, and returns the backend's HTTP status.

## backend

| Path | Description |
|---|---|
| `/` | Status (affected by chaos settings) |
| `/healthz` | Probe endpoint, never delayed or failed |
| `/info` | Returns version and hostname (no egress) |
| `/external-data` | Egress: `GET {EXTERNAL_API_BASE}/uuid` |
| `/external-status/:code` | Egress: `GET {EXTERNAL_API_BASE}/status/:code` |
| `/admin/chaos?fail=50&delay=2000` | Changes failure % / delay of this pod at runtime |

| Env | Default | Description |
|---|---|---|
| `APP_VERSION` | `v1` | Version label returned in responses |
| `FAIL_RATE` | `0` | % of requests answered with HTTP 503 |
| `DELAY_MS` | `0` | Delay added to every request |
| `EXTERNAL_API_BASE` | `https://httpbin.org` | External API used for egress tests |
