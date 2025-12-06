import * as THREE from 'three';

// Orbital periods in Earth years (used to calculate angular velocity)
// 10 seconds real time = 1 Earth year
const ORBITAL_PERIODS = {
    mercury: 0.24,
    venus: 0.62,
    earth: 1.0,
    mars: 1.88,
    jupiter: 11.86,
    saturn: 29.46,
    uranus: 84.01,
    neptune: 164.79
};

// Planet data: [name, distance from sun (AU scaled), color, size factor, orbital period]
const PLANET_DATA = [
    { name: 'sun', distance: 0, color: 0xFDB813, size: 3.0, period: 0 },
    { name: 'mercury', distance: 5, color: 0x8C7853, size: 0.4, period: ORBITAL_PERIODS.mercury },
    { name: 'venus', distance: 7, color: 0xFFC649, size: 0.9, period: ORBITAL_PERIODS.venus },
    { name: 'earth', distance: 9, color: 0x4A90E2, size: 1.0, period: ORBITAL_PERIODS.earth },
    { name: 'mars', distance: 11, color: 0xE27B58, size: 0.5, period: ORBITAL_PERIODS.mars },
    { name: 'jupiter', distance: 15, color: 0xC88B3A, size: 2.2, period: ORBITAL_PERIODS.jupiter },
    { name: 'saturn', distance: 19, color: 0xFAD5A5, size: 1.8, period: ORBITAL_PERIODS.saturn },
    { name: 'uranus', distance: 23, color: 0x4FD0E7, size: 1.2, period: ORBITAL_PERIODS.uranus },
    { name: 'neptune', distance: 27, color: 0x4166F5, size: 1.1, period: ORBITAL_PERIODS.neptune }
];

// Generate particles for a planet at a given angle
const generatePlanetParticles = (planet, angle, particlesPerPlanet) => {
    const points = [];
    const colors = [];
    const color = new THREE.Color(planet.color);

    if (planet.name === 'sun') {
        // Sun at center with more particles
        for (let i = 0; i < particlesPerPlanet * 3; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = planet.size * (0.8 + Math.random() * 0.4);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            points.push(new THREE.Vector3(x, y, z));

            // Sun glow effect - brighter in center
            const glowColor = color.clone();
            glowColor.multiplyScalar(1.2 + Math.random() * 0.3);
            colors.push(glowColor);
        }
    } else {
        // Calculate planet position based on orbital angle
        const x = planet.distance * Math.cos(angle);
        const z = planet.distance * Math.sin(angle);

        // Create sphere of particles for the planet
        for (let i = 0; i < particlesPerPlanet; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = planet.size * (0.7 + Math.random() * 0.3);

            const px = x + r * Math.sin(phi) * Math.cos(theta);
            const py = r * Math.sin(phi) * Math.sin(theta);
            const pz = z + r * Math.cos(phi);

            points.push(new THREE.Vector3(px, py, pz));
            colors.push(color.clone());
        }

        // Add orbital trail particles
        const trailParticles = Math.floor(particlesPerPlanet * 0.3);
        for (let i = 0; i < trailParticles; i++) {
            const trailAngle = angle - (Math.random() * Math.PI * 0.5);
            const tx = planet.distance * Math.cos(trailAngle);
            const tz = planet.distance * Math.sin(trailAngle);

            points.push(new THREE.Vector3(tx, (Math.random() - 0.5) * 0.2, tz));

            const trailColor = color.clone();
            trailColor.multiplyScalar(0.3 + Math.random() * 0.3);
            colors.push(trailColor);
        }
    }

    return { points, colors };
};

// Main function to generate solar system
// Time parameter controls the orbital positions
export const generateSolarSystem = (numPoints, time = 0) => {
    const allPoints = [];
    const allColors = [];

    // Calculate how many particles per planet
    const particlesPerPlanet = Math.floor(numPoints / (PLANET_DATA.length + 2));

    // Generate each planet
    PLANET_DATA.forEach(planet => {
        // Calculate orbital angle based on time and period
        // 10 seconds = 1 Earth year, so we scale time accordingly
        let angle = 0;
        if (planet.period > 0) {
            // Angular velocity = 2π / period
            // Time is in seconds, scale so 10 seconds = 1 Earth year
            const earthYears = time / 10.0;
            angle = (earthYears / planet.period) * Math.PI * 2;
        }

        const { points, colors } = generatePlanetParticles(planet, angle, particlesPerPlanet);
        allPoints.push(...points);
        allColors.push(...colors);
    });

    // Fill remaining particles with asteroid belt between Mars and Jupiter
    const remaining = numPoints - allPoints.length;
    const asteroidColor = new THREE.Color(0x888888);

    for (let i = 0; i < remaining; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 12 + Math.random() * 2; // Between Mars (11) and Jupiter (15)
        const x = distance * Math.cos(angle);
        const z = distance * Math.sin(angle);
        const y = (Math.random() - 0.5) * 0.5;

        allPoints.push(new THREE.Vector3(x, y, z));
        allColors.push(asteroidColor.clone().multiplyScalar(0.5 + Math.random() * 0.5));
    }

    return { points: allPoints, colors: allColors };
};

// Function to update solar system positions over time
export const updateSolarSystem = (time) => {
    return generateSolarSystem(30000, time);
};
