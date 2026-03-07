import fs from 'fs';
import path from 'path';

console.log('Verifying API contract between frontend and backend...');

// Run from root of frontend project
const backendEndpointsPath = path.resolve('scripts/backend-endpoints.json');
if (!fs.existsSync(backendEndpointsPath)) {
    console.error(`❌ Backend endpoints inventory not found at ${backendEndpointsPath}`);
    process.exit(1);
}

const backendInventory = JSON.parse(fs.readFileSync(backendEndpointsPath, 'utf8'));

// Normalize paths by replacing any {variable} with {}
const normalizePath = (p: string) => p.replace(/\{[^\}]+\}/g, '{}');

const validBackendPaths = new Set();
backendInventory.forEach((endpoint: any) => {
    validBackendPaths.add(normalizePath(endpoint.path));
});

const frontendEndpointsPath = path.resolve('scripts/frontend-endpoints.json');
if (!fs.existsSync(frontendEndpointsPath)) {
    console.error(`❌ Frontend endpoints inventory not found at ${frontendEndpointsPath}`);
    process.exit(1);
}

const frontendInventory = JSON.parse(fs.readFileSync(frontendEndpointsPath, 'utf8'));

let hasErrors = false;

// 3. Verify frontend usage against backend inventory
for (const [serviceFile, methods] of Object.entries(frontendInventory)) {
    // Add type assertion since Object.entries returns any
    (methods as any[]).forEach((usage: any) => {
        // Map frontend method (e.g., 'getById') to HTTP verb. 
        // This is a simplification; in a real scenario, we'd parse the axios.get/post/put/delete calls.
        // For this script, we'll infer the method based on typical naming conventions or extract it during the scan.
        // Since our frontend-endpoints.json doesn't contain the HTTP method currently, we'll do a partial path check.
        // To be perfectly accurate, we should adjust the frontend scan to extract HTTP methods.

        let rawFrontendPath = '/api' + usage.path.split('?')[0]; // strip query params
        let normalizedFrontendPath = normalizePath(rawFrontendPath);

        // Check if ANY backend endpoint matches this path
        if (!validBackendPaths.has(normalizedFrontendPath)) {
            console.error(`❌ Contract Violation in ${serviceFile} -> ${usage.method}: Route ${rawFrontendPath} does NOT exist on the backend.`);
            hasErrors = true;
        }
    });
}

if (hasErrors) {
    console.error('❌ API Contract Verification FAILED. Please fix the mismatched endpoints in frontend domain services.');
    process.exit(1);
} else {
    console.log('✅ API Contract Verification PASSED. All frontend API routes are valid.');
    process.exit(0);
}
