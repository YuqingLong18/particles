import * as THREE from 'three';

// Helper to convert RA/Dec to Cartesian
// RA (Right Ascension) is in hours (0-24), Dec (Declination) is in degrees (-90 to 90)
// Distance is in Light Years
const celestialToCartesian = (ra, dec, dist) => {
    // Convert RA to radians (1 hour = 15 degrees)
    const phi = (ra * 15) * (Math.PI / 180);
    // Convert Dec to radians
    const theta = dec * (Math.PI / 180);

    // Standard conversion (Z is up/North)
    const x = dist * Math.cos(theta) * Math.cos(phi);
    const y = dist * Math.cos(theta) * Math.sin(phi);
    const z = dist * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
};

// Helper to estimate color from Spectral Type
const colorFromType = (type) => {
    if (type.startsWith('O')) return new THREE.Color(0x9bb0ff); // Blue
    if (type.startsWith('B')) return new THREE.Color(0xaabfff); // Blue-white
    if (type.startsWith('A')) return new THREE.Color(0xcad7ff); // White
    if (type.startsWith('F')) return new THREE.Color(0xf8f7ff); // Yellow-white
    if (type.startsWith('G')) return new THREE.Color(0xfff4ea); // Yellow (Sun)
    if (type.startsWith('K')) return new THREE.Color(0xffd2a1); // Orange
    if (type.startsWith('M')) return new THREE.Color(0xffcc6f); // Red
    return new THREE.Color(0xffffff);
};

// A subset of bright stars + some neighbors
// Data format: [Name, RA (hours), Dec (degrees), Distance (ly), Spectral Type, Magnitude]
const starData = [
    ['Sun', 0, 0, 0, 'G2', -26.7], // Center
    ['Sirius', 6.75, -16.7, 8.6, 'A1', -1.46],
    ['Canopus', 6.4, -52.7, 310, 'F0', -0.74],
    ['Alpha Centauri', 14.66, -60.8, 4.37, 'G2', -0.27],
    ['Arcturus', 14.26, 19.1, 37, 'K0', -0.05],
    ['Vega', 18.6, 38.8, 25, 'A0', 0.03],
    ['Capella', 5.27, 46.0, 42, 'G3', 0.08],
    ['Rigel', 5.24, -8.2, 860, 'B8', 0.13],
    ['Procyon', 7.65, 5.2, 11.4, 'F5', 0.34],
    ['Betelgeuse', 5.92, 7.4, 640, 'M1', 0.42], // Variable
    ['Achernar', 1.63, -57.2, 144, 'B6', 0.46],
    ['Hadar', 14.06, -60.4, 390, 'B1', 0.61],
    ['Altair', 19.85, 8.9, 16.7, 'A7', 0.76],
    ['Acrux', 12.44, -63.1, 320, 'B0', 0.76],
    ['Aldebaran', 4.6, 16.5, 65, 'K5', 0.86],
    ['Antares', 16.49, -26.4, 600, 'M1', 0.96],
    ['Spica', 13.42, -11.2, 250, 'B1', 0.97],
    ['Pollux', 7.76, 28.0, 34, 'K0', 1.14],
    ['Fomalhaut', 22.96, -29.6, 25, 'A3', 1.16],
    ['Deneb', 20.69, 45.3, 2600, 'A2', 1.25],
    ['Mimosa', 12.8, -59.7, 280, 'B0', 1.25],
    ['Regulus', 10.14, 11.9, 79, 'B7', 1.36],
    ['Adhara', 6.98, -28.9, 430, 'B2', 1.5],
    ['Castor', 7.58, 31.9, 52, 'A1', 1.58],
    ['Gacrux', 12.52, -57.1, 88, 'M3', 1.64],
    ['Shaula', 17.56, -37.1, 700, 'B1', 1.62],
];

export const generateGalaxy = (numPoints) => {
    const points = [];
    const colors = [];

    // 1. Add Real Stars
    starData.forEach(star => {
        const [name, ra, dec, dist, type, mag] = star;

        // Scale distance down for visualization (e.g., log scale or simple divisor)
        // Using a simple divisor to keep them in view, but preserving relative direction
        // Let's use a log-ish scale for distance to keep far stars visible but distinct
        let d = dist;
        if (d > 0) {
            d = Math.log10(d + 1) * 5;
        }

        const pos = celestialToCartesian(ra, dec, d);
        points.push(pos);

        const color = colorFromType(type);
        colors.push(color);
    });

    // 2. Fill the rest with background stars (random distribution but spherical)
    const remaining = numPoints - points.length;
    for (let i = 0; i < remaining; i++) {
        // Random direction
        const ra = Math.random() * 24;
        const dec = (Math.random() - 0.5) * 180;
        // Random distance (background field)
        const dist = 15 + Math.random() * 15;

        const pos = celestialToCartesian(ra, dec, dist);
        points.push(pos);

        // Random faint star color
        const color = new THREE.Color();
        color.setHSL(0.6 + Math.random() * 0.1, 0.2, Math.random() * 0.5);
        colors.push(color);
    }

    return { points, colors };
};
