import * as THREE from 'three';

// Atom radii (relative) - based on van der Waals radii
const RADII = {
    H: 0.5,
    C: 0.85,
    O: 0.75,
    N: 0.75,
    Cl: 0.9,
};

// Standard CPK coloring scheme for atoms
const COLORS = {
    H: new THREE.Color(0xffffff),  // White
    C: new THREE.Color(0x909090),  // Light grey (more visible)
    O: new THREE.Color(0xff3030),  // Red
    N: new THREE.Color(0x3050f8),  // Blue
    Cl: new THREE.Color(0x1ff01f), // Green
};

// Molecule definitions with accurate geometries
const MOLECULES = {
    H2O: {
        name: 'Water',
        atoms: [
            { element: 'O', pos: [0, 0, 0] },
            { element: 'H', pos: [0.76, 0.59, 0] },      // ~104.5° angle
            { element: 'H', pos: [-0.76, 0.59, 0] }
        ],
        bonds: [[0, 1], [0, 2]]
    },
    CO2: {
        name: 'Carbon Dioxide',
        atoms: [
            { element: 'C', pos: [0, 0, 0] },
            { element: 'O', pos: [1.16, 0, 0] },         // Linear, 180°
            { element: 'O', pos: [-1.16, 0, 0] }
        ],
        bonds: [[0, 1], [0, 2]]
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
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]]
    },
    NH3: {
        name: 'Ammonia',
        atoms: [
            { element: 'N', pos: [0, 0, 0] },
            { element: 'H', pos: [0.94, 0.38, 0] },      // Trigonal pyramidal
            { element: 'H', pos: [-0.47, 0.38, 0.81] },
            { element: 'H', pos: [-0.47, 0.38, -0.81] }
        ],
        bonds: [[0, 1], [0, 2], [0, 3]]
    },
    O2: {
        name: 'Oxygen',
        atoms: [
            { element: 'O', pos: [-0.6, 0, 0] },
            { element: 'O', pos: [0.6, 0, 0] }
        ],
        bonds: [[0, 1]]
    },
    N2: {
        name: 'Nitrogen',
        atoms: [
            { element: 'N', pos: [-0.55, 0, 0] },
            { element: 'N', pos: [0.55, 0, 0] }
        ],
        bonds: [[0, 1]]
    },
    HCl: {
        name: 'Hydrogen Chloride',
        atoms: [
            { element: 'H', pos: [-0.64, 0, 0] },
            { element: 'Cl', pos: [0.64, 0, 0] }
        ],
        bonds: [[0, 1]]
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
        bonds: [[0, 1], [1, 2], [2, 3], [0, 4], [0, 5], [0, 6], [1, 7], [1, 8]]
    }
};

export const generateMolecule = (type, numPoints) => {
    const molecule = MOLECULES[type];
    if (!molecule) return { points: [], colors: [] };

    const points = [];
    const colors = [];

    // Distribute points: 70% to atoms, 30% to bonds
    const totalAtoms = molecule.atoms.length;
    const totalBonds = molecule.bonds.length;

    const pointsPerAtom = Math.floor((numPoints * 0.7) / totalAtoms);
    const pointsPerBond = totalBonds > 0 ? Math.floor((numPoints * 0.3) / totalBonds) : 0;

    // Generate Atoms - dense spheres with element-specific colors
    molecule.atoms.forEach(atom => {
        const center = new THREE.Vector3(...atom.pos);
        const radius = RADII[atom.element] || 0.7;
        const color = COLORS[atom.element] || new THREE.Color(0xff00ff);

        for (let i = 0; i < pointsPerAtom; i++) {
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

    // Generate Bonds - cylinders connecting atoms
    molecule.bonds.forEach(bond => {
        const atom1 = molecule.atoms[bond[0]];
        const atom2 = molecule.atoms[bond[1]];
        const start = new THREE.Vector3(...atom1.pos);
        const end = new THREE.Vector3(...atom2.pos);
        const direction = end.clone().sub(start);
        const length = direction.length();
        const axis = direction.clone().normalize();

        // Create rotation to align cylinder with bond
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);

        // Use a gradient color for bonds (blend of the two atom colors)
        const color1 = COLORS[atom1.element] || new THREE.Color(0xcccccc);
        const color2 = COLORS[atom2.element] || new THREE.Color(0xcccccc);

        for (let i = 0; i < pointsPerBond; i++) {
            const theta = Math.random() * Math.PI * 2;
            const r = 0.12; // Bond thickness
            const h = Math.random() * length;

            // Create point in cylinder
            const p = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
            p.applyQuaternion(quaternion);
            p.add(start);

            // Blend colors based on position along bond
            const t = h / length;
            const bondColor = color1.clone().lerp(color2, t);

            points.push(p);
            colors.push(bondColor);
        }
    });

    // Scale up for better visibility
    const scale = 4;
    points.forEach(p => p.multiplyScalar(scale));

    return { points, colors };
};
