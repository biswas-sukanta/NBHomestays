// Register a user, then extract their password hash from the DB to get the correct BCrypt hash
const http = require('http');

// Step 1: Register
const email = `hashgen_${Date.now()}@test.com`;
const payload = JSON.stringify({
    firstname: 'Hash',
    lastname: 'Gen',
    email,
    password: 'password'
});

const opts = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
};

const req = http.request(opts, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        console.log('Registration status:', res.statusCode);
        if (res.statusCode === 200) {
            console.log('Registered email:', email);
            console.log('Now check DB: SELECT password FROM users WHERE email =', `'${email}'`);
        } else {
            console.log('Registration failed:', d);
        }
    });
});
req.write(payload);
req.end();
