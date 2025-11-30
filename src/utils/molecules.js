import * as THREE from 'three';

// Atom radii (relative) - based on van der Waals radii
const RADII = {
    H: 0.5,
    C: 0.85,
    O: 0.75,
    N: 0.75,
    Cl: 0.9,
    Na: 1.0, // Sodium
};

// Standard CPK coloring scheme for atoms
const COLORS = {
    H: new THREE.Color(0xffffff),  // White
    C: new THREE.Color(0x909090),  // Light grey (more visible)
    O: new THREE.Color(0xff3030),  // Red
    N: new THREE.Color(0x3050f8),  // Blue
    Cl: new THREE.Color(0x1ff01f), // Green
    Na: new THREE.Color(0xab5cf2), // Purple (Sodium)
};

// Molecule definitions with accurate geometries
// Bonds format: [index1, index2, order, type]
// order: 1, 2, 3
// type: 'covalent' (default), 'ionic'
const MOLECULES = {
    H2O: {
        name: 'Water',
        atoms: [
            { element: 'O', pos: [0, 0, 0] },
            { element: 'H', pos: [0.76, 0.59, 0] },      // ~104.5° angle
            { element: 'H', pos: [-0.76, 0.59, 0] }
        ],
        bonds: [[0, 1, 1], [0, 2, 1]]
    },
    CO2: {
        name: 'Carbon Dioxide',
        atoms: [
            { element: 'C', pos: [0, 0, 0] },
            { element: 'O', pos: [1.16, 0, 0] },         // Linear, 180°
            { element: 'O', pos: [-1.16, 0, 0] }
        ],
        bonds: [[0, 1, 2], [0, 2, 2]] // Double bonds
    },
    Methane: {
        name: 'Methane',
        atoms: [
            { element: 'C', pos: [0, 0, 0] },
            { element: 'H', pos: [0.63, 0.63, 0.63] },   // Tetrahedral
            { element: 'H', pos: [-0.63, -0.63, 0.63] },
            { element: 'H', pos: [-0.63, 0.63, -0.63] },
            { element: 'H', pos: [0.63, -0.63, -0.63] }
        ],
        bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]
    },
    NH3: {
        name: 'Ammonia',
        atoms: [
            { element: 'N', pos: [0, 0, 0] },
            { element: 'H', pos: [0.94, 0.38, 0] },      // Trigonal pyramidal
            { element: 'H', pos: [-0.47, 0.38, 0.81] },
            { element: 'H', pos: [-0.47, 0.38, -0.81] }
        ],
        bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]]
    },
    O2: {
        name: 'Oxygen',
        atoms: [
            { element: 'O', pos: [-0.6, 0, 0] },
            { element: 'O', pos: [0.6, 0, 0] }
        ],
        bonds: [[0, 1, 2]] // Double bond
    },
    N2: {
        name: 'Nitrogen',
        atoms: [
            { element: 'N', pos: [-0.55, 0, 0] },
            { element: 'N', pos: [0.55, 0, 0] }
        ],
        bonds: [[0, 1, 3]] // Triple bond
    },
    HCl: {
        name: 'Hydrogen Chloride',
        atoms: [
            { element: 'H', pos: [-0.64, 0, 0] },
            { element: 'Cl', pos: [0.64, 0, 0] }
        ],
        bonds: [[0, 1, 1, 'ionic']] // Ionic bond
    },
    Ethanol: {
        name: 'Ethanol',
        atoms: [
            { element: 'C', pos: [-0.75, 0, 0] },        // CH3
            { element: 'C', pos: [0.75, 0, 0] },         // CH2
            { element: 'O', pos: [1.25, 1.2, 0] },       // OH
            { element: 'H', pos: [1.8, 1.7, 0] },        // H on oxygen
            { element: 'H', pos: [-1.2, 0.9, 0] },       // H on first C
            { element: 'H', pos: [-1.2, -0.45, 0.78] },  // H on first C
            { element: 'H', pos: [-1.2, -0.45, -0.78] }, // H on first C
            { element: 'H', pos: [1.2, -0.45, 0.78] },   // H on second C
            { element: 'H', pos: [1.2, -0.45, -0.78] }   // H on second C
        ],
        bonds: [[0, 1, 1], [1, 2, 1], [2, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1], [1, 7, 1], [1, 8, 1]]
    }
};

export const generateMolecule = (type, numPoints, customData = null) => {
    let molecule = MOLECULES[type];

    if (type === 'custom' && customData) {
        molecule = customData;
    }

    if (!molecule) return { points: [], colors: [] };

    const points = [];
    const colors = [];

    // Distribute points: 70% to atoms, 30% to bonds
    const totalAtoms = molecule.atoms.length;
    const totalBonds = molecule.bonds.length;

    const totalAtomPoints = Math.floor(numPoints * 0.7);
    const pointsPerBond = totalBonds > 0 ? Math.floor((numPoints * 0.3) / totalBonds) : 0;

    // Calculate total volume for density normalization
    let totalVolume = 0;
    molecule.atoms.forEach(atom => {
        const r = RADII[atom.element] || 0.7;
        totalVolume += r * r * r; // Proportional to volume
    });

    // Generate Atoms - dense spheres with element-specific colors
    molecule.atoms.forEach(atom => {
        const center = new THREE.Vector3(...atom.pos);
        const radius = RADII[atom.element] || 0.7;
        const color = COLORS[atom.element] || new THREE.Color(0xff00ff);

        // Allocate points based on volume fraction to maintain constant density
        const volume = radius * radius * radius;
        const pointsForThisAtom = Math.floor(totalAtomPoints * (volume / totalVolume));

        for (let i = 0; i < pointsForThisAtom; i++) {
            // Random point in sphere using spherical coordinates
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = Math.cbrt(Math.random()) * radius; // Uniform volume distribution

            const x = center.x + r * Math.sin(phi) * Math.cos(theta);
            const y = center.y + r * Math.sin(phi) * Math.sin(theta);
            const z = center.z + r * Math.cos(phi);

            points.push(new THREE.Vector3(x, y, z));
            colors.push(color.clone());
        }
    });

    // Generate Bonds
    molecule.bonds.forEach(bond => {
        const atom1 = molecule.atoms[bond[0]];
        const atom2 = molecule.atoms[bond[1]];
        const order = bond[2] || 1;
        const bondType = bond[3] || 'covalent';

        const start = new THREE.Vector3(...atom1.pos);
        const end = new THREE.Vector3(...atom2.pos);
        const direction = end.clone().sub(start);
        const length = direction.length();
        const axis = direction.clone().normalize();

        // Calculate perpendicular vector for multi-bond offsets
        let perp = new THREE.Vector3(0, 1, 0).cross(axis);
        if (perp.lengthSq() < 0.001) {
            perp = new THREE.Vector3(0, 0, 1).cross(axis);
        }
        perp.normalize();

        const bondSeparation = 0.15; // Distance between multiple bonds
        const bondRadius = 0.05; // Much thinner bonds

        // Determine bond offsets based on order
        const offsets = [];
        if (order === 1) {
            offsets.push(new THREE.Vector3(0, 0, 0));
        } else if (order === 2) {
            offsets.push(perp.clone().multiplyScalar(bondSeparation / 2));
            offsets.push(perp.clone().multiplyScalar(-bondSeparation / 2));
        } else if (order === 3) {
            offsets.push(new THREE.Vector3(0, 0, 0));
            offsets.push(perp.clone().multiplyScalar(bondSeparation));
            offsets.push(perp.clone().multiplyScalar(-bondSeparation));
        }

        // Use a gradient color for bonds (blend of the two atom colors)
        const color1 = COLORS[atom1.element] || new THREE.Color(0xcccccc);
        const color2 = COLORS[atom2.element] || new THREE.Color(0xcccccc);

        const pointsPerSubBond = Math.floor(pointsPerBond / order);

        offsets.forEach(offset => {
            // Create rotation to align cylinder with bond
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);

            for (let i = 0; i < pointsPerSubBond; i++) {
                let r, theta, h;

                if (bondType === 'ionic') {
                    // Ionic Cloud: Diffuse, wider, volumetric distribution
                    // Use a much larger radius for the cloud
                    const maxRadius = 0.4;
                    // Random point WITHIN the cylinder (volume), not just on surface
                    // Power of 0.5 for uniform distribution in circle, or just random for center-bias (more 'cloud-like')
                    const rRand = Math.random();
                    r = maxRadius * Math.sqrt(rRand); // Sqrt for uniform, or just rRand for center-dense

                    theta = Math.random() * Math.PI * 2;
                    h = Math.random() * length;
                } else {
                    // Covalent: Thin, solid cylinder (surface only for sharpness)
                    theta = Math.random() * Math.PI * 2;
                    r = bondRadius;
                    h = Math.random() * length;
                }

                // Create point in cylinder
                const p = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
                p.applyQuaternion(quaternion);
                p.add(start).add(offset); // Add start pos and multi-bond offset

                // Blend colors based on position along bond
                const t = h / length;
                let bondColor = color1.clone().lerp(color2, t);

                // Ionic bond color tweak: Use a distinct, bright color
                if (bondType === 'ionic') {
                    // Electric Cyan/Blue for distinct "energy" look
                    bondColor = new THREE.Color(0x00ffff);
                    // Add slight variation for shimmering effect
                    bondColor.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
                }

                points.push(p);
                colors.push(bondColor);
            }
        });
    });

    // Scale up for better visibility
    const scale = 4;
    points.forEach(p => p.multiplyScalar(scale));

    return { points, colors };
};

