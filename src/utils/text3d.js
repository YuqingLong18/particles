import * as THREE from 'three';

/**
 * Generate 3D text particles for "THIS NEXUS"
 * @param {number} numParticles - Total number of particles to generate
 * @returns {Object} { points: Vector3[], colors: Color[] }
 */
export function generateText3D(numParticles) {
    const points = [];
    const colors = [];

    // Define "THIS NEXUS" in a simple 3D grid format
    // We'll create letters using a voxel-like approach
    const text = "THIS NEXUS";
    const letterSpacing = 2.5;
    const letterHeight = 8;
    const letterWidth = 6;
    const depth = 3;

    // Simple letter definitions (5x7 grid, 1=filled, 0=empty)
    const letterPatterns = {
        'T': [
            [1, 1, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
        ],
        'H': [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        'I': [
            [0, 1, 1, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 1, 1, 0],
        ],
        'S': [
            [0, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1],
            [1, 1, 1, 1, 0],
        ],
        'N': [
            [1, 0, 0, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
        ],
        'E': [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1],
        ],
        'X': [
            [1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [1, 0, 0, 0, 1],
        ],
        'U': [
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [0, 1, 1, 1, 0],
        ],
        ' ': [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
        ],
    };

    // Generate voxel positions for each letter
    const voxelPositions = [];
    let xOffset = 0;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const pattern = letterPatterns[char] || letterPatterns[' '];

        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                if (pattern[row][col] === 1) {
                    // Add multiple depth layers for 3D effect
                    for (let d = 0; d < depth; d++) {
                        voxelPositions.push({
                            x: xOffset + col * 1.2,
                            y: (pattern.length - row - 1) * 1.2 - 4, // Center vertically
                            z: d * 1.2 - depth * 0.6,
                            charIndex: i,
                            totalChars: text.length
                        });
                    }
                }
            }
        }

        xOffset += letterSpacing + 5 * 1.2; // Move to next letter position
    }

    // Center the entire text
    const centerX = xOffset / 2;
    voxelPositions.forEach(pos => {
        pos.x -= centerX;
    });

    // Distribute particles across voxel positions with some randomness
    const particlesPerVoxel = Math.ceil(numParticles / voxelPositions.length);

    for (let i = 0; i < voxelPositions.length; i++) {
        const voxel = voxelPositions[i];
        const numToAdd = Math.min(particlesPerVoxel, numParticles - points.length);

        for (let j = 0; j < numToAdd; j++) {
            // Add slight randomness within each voxel
            const randomOffset = 0.3;
            const point = new THREE.Vector3(
                voxel.x + (Math.random() - 0.5) * randomOffset,
                voxel.y + (Math.random() - 0.5) * randomOffset,
                voxel.z + (Math.random() - 0.5) * randomOffset
            );
            points.push(point);

            // Create blue to red gradient based on character position
            const t = voxel.charIndex / voxel.totalChars;
            const color = new THREE.Color();

            // Interpolate from blue (0, 0, 1) to red (1, 0, 0)
            const r = t;
            const g = 0.2 + Math.sin(t * Math.PI) * 0.3; // Add some variation
            const b = 1 - t;

            color.setRGB(r, g, b);
            colors.push(color);
        }
    }

    // Fill remaining particles if needed
    while (points.length < numParticles) {
        const randomVoxel = voxelPositions[Math.floor(Math.random() * voxelPositions.length)];
        const randomOffset = 0.5;
        const point = new THREE.Vector3(
            randomVoxel.x + (Math.random() - 0.5) * randomOffset,
            randomVoxel.y + (Math.random() - 0.5) * randomOffset,
            randomVoxel.z + (Math.random() - 0.5) * randomOffset
        );
        points.push(point);

        const t = randomVoxel.charIndex / randomVoxel.totalChars;
        const color = new THREE.Color();
        const r = t;
        const g = 0.2 + Math.sin(t * Math.PI) * 0.3;
        const b = 1 - t;
        color.setRGB(r, g, b);
        colors.push(color);
    }

    return { points, colors };
}
