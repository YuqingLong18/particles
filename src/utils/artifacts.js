import * as THREE from 'three';

// Helper to normalize points
const normalizePoints = (points, scale = 10) => {
    const box = new THREE.Box3().setFromPoints(points);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    return points.map(p => p.sub(center).multiplyScalar(scale / maxDim));
};

export const generatePyramid = (numPoints) => {
    const points = [];
    const colors = [];

    for (let i = 0; i < numPoints; i++) {
        // Randomly choose a face (4 faces + base)
        const face = Math.floor(Math.random() * 5);
        let p = new THREE.Vector3();

        if (face < 4) {
            // Triangular faces
            // Base vertices: (-1, -1, 0), (1, -1, 0), (1, 1, 0), (-1, 1, 0)
            // Apex: (0, 0, 1.5)

            // Barycentric coordinates for triangle
            let r1 = Math.random();
            let r2 = Math.random();
            if (r1 + r2 > 1) {
                r1 = 1 - r1;
                r2 = 1 - r2;
            }

            const h = 1.5;
            const apex = new THREE.Vector3(0, h, 0);
            let v1, v2;

            if (face === 0) { v1 = new THREE.Vector3(-1, 0, 1); v2 = new THREE.Vector3(1, 0, 1); }
            else if (face === 1) { v1 = new THREE.Vector3(1, 0, 1); v2 = new THREE.Vector3(1, 0, -1); }
            else if (face === 2) { v1 = new THREE.Vector3(1, 0, -1); v2 = new THREE.Vector3(-1, 0, -1); }
            else { v1 = new THREE.Vector3(-1, 0, -1); v2 = new THREE.Vector3(-1, 0, 1); }

            // p = apex + r1*(v1-apex) + r2*(v2-apex)
            p.copy(apex).add(v1.sub(apex).multiplyScalar(r1)).add(v2.sub(apex).multiplyScalar(r2));

        } else {
            // Base (Square)
            p.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
        }

        points.push(p);

        // Sandstone color
        const color = new THREE.Color().setHSL(0.1 + Math.random() * 0.05, 0.6, 0.5 + Math.random() * 0.2);
        colors.push(color);
    }

    return { points: normalizePoints(points), colors };
};

export const generateColumn = (numPoints) => {
    const points = [];
    const colors = [];

    for (let i = 0; i < numPoints; i++) {
        const h = Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;

        // Fluting effect
        const flutes = 20;
        const rBase = 1.0;
        const fluteDepth = 0.05;
        const r = rBase + Math.cos(theta * flutes) * fluteDepth;

        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = h;

        // Capital and Base
        let finalX = x;
        let finalZ = z;

        if (h < 1 || h > 9) {
            // Wider base/capital
            finalX *= 1.2;
            finalZ *= 1.2;
        }

        points.push(new THREE.Vector3(finalX, y, finalZ));

        // Marble color
        const color = new THREE.Color().setHSL(0, 0, 0.9 + Math.random() * 0.1);
        colors.push(color);
    }

    return { points: normalizePoints(points), colors };
};

export const generateVase = (numPoints) => {
    const points = [];
    const colors = [];

    for (let i = 0; i < numPoints; i++) {
        const t = Math.random(); // 0 to 1 height
        const y = t * 10;

        // Profile curve (radius as function of height)
        // e.g., sin wave
        const r = 1.5 + Math.sin(t * Math.PI * 2) * 0.5 + Math.sin(t * Math.PI * 4) * 0.2;

        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);

        points.push(new THREE.Vector3(x, y, z));

        // Clay/Terracotta color
        const color = new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.7, 0.4 + Math.random() * 0.2);
        colors.push(color);
    }

    return { points: normalizePoints(points), colors };
};

export const generateArtifact = (type, numPoints) => {
    if (type === 'pyramid') return generatePyramid(numPoints);
    if (type === 'column') return generateColumn(numPoints);
    if (type === 'vase') return generateVase(numPoints);
    return generatePyramid(numPoints);
};
