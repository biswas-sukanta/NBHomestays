const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const sourceDir = 'C:\\Users\\biswa\\.gemini\\antigravity\\brain\\92836532-b7da-42d7-b9de-95869a98cc2a';
const targetDir = 'C:\\Users\\biswa\\OneDrive\\Documents\\github\\NorthBengalHomestays\\frontend\\public\\states';

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const states = [
    { slug: 'west-bengal', file: 'hero_west_bengal_1772473758902.png' },
    { slug: 'sikkim', file: 'hero_sikkim_1772473774758.png' },
    { slug: 'assam', file: 'hero_assam_1772473791121.png' },
    { slug: 'meghalaya', file: 'hero_meghalaya_1772473809920.png' },
];

async function processImages() {
    for (const state of states) {
        const srcPath = path.join(sourceDir, state.file);
        const heroPath = path.join(targetDir, `hero-${state.slug}.webp`);
        const thumbPath = path.join(targetDir, `thumb-${state.slug}.webp`);

        try {
            // Create 1920x1080 Hero (1080p, WebP)
            await sharp(srcPath)
                .resize(1920, 1080, { fit: 'cover' })
                .webp({ quality: 85 })
                .toFile(heroPath);
            console.log(`Created ${heroPath}`);

            // Create 800x450 Thumb (WebP)
            await sharp(srcPath)
                .resize(800, 450, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(thumbPath);
            console.log(`Created ${thumbPath}`);
        } catch (e) {
            console.error(`Error processing ${state.slug}:`, e);
        }
    }
}

processImages().catch(console.error);
