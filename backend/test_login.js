// Direct API test — bypasses shell escaping issues
const http = require('http');

const payload = JSON.stringify({
    email: 'guest@example.com',
    password: 'password'
});

const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/authenticate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    },
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
        console.log(`BODY: ${body}`);
    });
});

req.on('error', (e) => {
    console.error(`CONNECTION ERROR: ${e.message}`);
});

req.write(payload);
req.end();
