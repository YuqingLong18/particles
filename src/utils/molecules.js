import * as THREE from 'three';

// Atom radii (relative)
const RADII = {
    H: 0.5,
    C: 1.0,
    O: 0.9,
    N: 0.9,
};

// Colors
const COLORS = {
    H: new THREE.Color(0xffffff), // White
    C: new THREE.Color(0x909090), // Grey
    O: new THREE.Color(0xff0000), // Red
    N: new THREE.Color(0x0000ff), // Blue
};

// Simple molecule definitions (approximate coordinates)
const MOLECULES = {
    H2O: {
        atoms: [
            { element: 'O', pos: [0, 0, 0] },
            { element: 'H', pos: [0.96, -0.24, 0] },
            { element: 'H', pos: [-0.24, 0.96, 0] } // Approximate angle
        ],
        bonds: [[0, 1], [0, 2]]
    },
    Methane: { // CH4
        atoms: [
            { element: 'C', pos: [0, 0, 0] },
            { element: 'H', pos: [1, 1, 1] },
            { element: 'H', pos: [-1, -1, 1] },
            { element: 'H', pos: [-1, 1, -1] },
            { element: 'H', pos: [1, -1, -1] }
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
    },
    CO2: {
        atoms: [
            { element: 'C', pos: [0, 0, 0] },
            { element: 'O', pos: [1.2, 0, 0] },
            { element: 'O', pos: [-1.2, 0, 0] }
        ],
        bonds: [[0, 1], [0, 2]]
    }
};

export const generateMolecule = (type, numPoints) => {
    const molecule = MOLECULES[type];
    if (!molecule) return [];

    const points = [];
    const colors = [];

    // Distribute points among atoms and bonds
    // Strategy: 
    // 1. Core atoms: dense sphere of particles
    // 2. Bonds: cylinder of particles
    // 3. Electron cloud: sparse cloud around the whole thing

    const pointsPerAtom = Math.floor((numPoints * 0.6) / molecule.atoms.length);
    const pointsPerBond = molecule.bonds.length > 0 ? Math.floor((numPoints * 0.2) / molecule.bonds.length) : 0;
    const cloudPoints = numPoints - (pointsPerAtom * molecule.atoms.length) - (pointsPerBond * molecule.bonds.length);

    // Generate Atoms
    molecule.atoms.forEach(atom => {
        const center = new THREE.Vector3(...atom.pos);
        const radius = RADII[atom.element];
        const color = COLORS[atom.element];

        for (let i = 0; i < pointsPerAtom; i++) {
            // Random point in sphere
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = Math.cbrt(Math.random()) * radius; // Uniform distribution

            const x = center.x + r * Math.sin(phi) * Math.cos(theta);
            const y = center.y + r * Math.sin(phi) * Math.sin(theta);
            const z = center.z + r * Math.cos(phi);

            points.push(new THREE.Vector3(x, y, z));
            colors.push(color);
        }
    });

    // Generate Bonds
    molecule.bonds.forEach(bond => {
        const start = new THREE.Vector3(...molecule.atoms[bond[0]].pos);
        const end = new THREE.Vector3(...molecule.atoms[bond[1]].pos);
        const direction = end.clone().sub(start);
        const length = direction.length();
        const axis = direction.clone().normalize();

        // Rotation to align cylinder with bond
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);

        for (let i = 0; i < pointsPerBond; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 0.1; // Bond radius
            const h = Math.random() * length;

            const p = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
            p.applyQuaternion(quaternion);
            p.add(start);

            points.push(p);
            colors.push(new THREE.Color(0xaaaaaa)); // Bond color
        }
    });

    // Generate Electron Cloud
    // Approximate as a larger, sparse sphere around the center
    const center = new THREE.Vector3(0, 0, 0); // Simplified center
    const cloudRadius = 3.0;

    for (let i = 0; i < cloudPoints; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = cloudRadius * (0.8 + Math.random() * 0.4); // Fuzzy edge

        const x = center.x + r * Math.sin(phi) * Math.cos(theta);
        const y = center.y + r * Math.sin(phi) * Math.sin(theta);
        const z = center.z + r * Math.cos(phi);

        points.push(new THREE.Vector3(x, y, z));
        colors.push(new THREE.Color(0x00ffff).multiplyScalar(0.5)); // Faint blue
    }

    // Scale up
    const scale = 3;
    points.forEach(p => p.multiplyScalar(scale));

    return { points, colors };
};
