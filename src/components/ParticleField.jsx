import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Generators } from '../utils/curves';
import { generateMolecule } from '../utils/molecules';

const NUM_PARTICLES = 30000;

const ParticleField = ({ mode, shape, moleculeType }) => {
    const pointsRef = useRef();

    // Buffers for positions
    const { positions, colors, targetPositions, targetColors } = useMemo(() => {
        const pos = new Float32Array(NUM_PARTICLES * 3);
        const col = new Float32Array(NUM_PARTICLES * 3);
        const targetPos = new Float32Array(NUM_PARTICLES * 3);
        const targetCol = new Float32Array(NUM_PARTICLES * 3);

        // Initialize with random positions
        for (let i = 0; i < NUM_PARTICLES; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

            col[i * 3] = 1;
            col[i * 3 + 1] = 1;
            col[i * 3 + 2] = 1;
        }

        return {
            positions: pos,
            colors: col,
            targetPositions: targetPos,
            targetColors: targetCol
        };
    }, []);

    // Update targets when props change
    useEffect(() => {
        let newPoints = [];
        let newColors = [];

        if (mode === 'math') {
            const generator = Generators[shape] || Generators.koch;
            newPoints = generator(NUM_PARTICLES);
            // Math curves are usually single color or gradient based on position
            // Let's make them white/blueish by default, shader will handle some coloring
            for (let i = 0; i < NUM_PARTICLES; i++) {
                newColors.push(new THREE.Color(0.2, 0.6, 1.0));
            }
        } else if (mode === 'molecule') {
            const data = generateMolecule(moleculeType, NUM_PARTICLES);
            newPoints = data.points;
            newColors = data.colors;
        }

        // Fill buffers
        for (let i = 0; i < NUM_PARTICLES; i++) {
            if (i < newPoints.length) {
                targetPositions[i * 3] = newPoints[i].x;
                targetPositions[i * 3 + 1] = newPoints[i].y;
                targetPositions[i * 3 + 2] = newPoints[i].z;

                if (newColors[i]) {
                    targetColors[i * 3] = newColors[i].r;
                    targetColors[i * 3 + 1] = newColors[i].g;
                    targetColors[i * 3 + 2] = newColors[i].b;
                } else {
                    targetColors[i * 3] = 1;
                    targetColors[i * 3 + 1] = 1;
                    targetColors[i * 3 + 2] = 1;
                }
            } else {
                // Hide unused particles
                targetPositions[i * 3] = 0;
                targetPositions[i * 3 + 1] = 0;
                targetPositions[i * 3 + 2] = 0;
                // Make them invisible or black
                targetColors[i * 3] = 0;
                targetColors[i * 3 + 1] = 0;
                targetColors[i * 3 + 2] = 0;
            }
        }

        // Reset animation time or trigger a transition flag if using custom shader uniforms for transition
        // For now, we'll lerp in CPU/useFrame for simplicity unless performance is bad, 
        // but 30k lerps in JS is borderline. Let's try JS lerp first, it's flexible.
        // Actually, for 30k, JS lerp might be heavy. 
        // Better approach: Update a "target" attribute and let vertex shader mix?
        // No, React Three Fiber useFrame loop is fine for 30k simple lerps if we use TypedArrays directly.

    }, [mode, shape, moleculeType, targetPositions, targetColors]);

    useFrame((state, delta) => {
        if (!pointsRef.current) return;

        const geometry = pointsRef.current.geometry;
        const positionAttribute = geometry.attributes.position;
        const colorAttribute = geometry.attributes.color;

        const speed = 3.0 * delta; // Interpolation speed

        for (let i = 0; i < NUM_PARTICLES; i++) {
            const ix = i * 3;
            const iy = i * 3 + 1;
            const iz = i * 3 + 2;

            // Lerp Position
            positions[ix] += (targetPositions[ix] - positions[ix]) * speed;
            positions[iy] += (targetPositions[iy] - positions[iy]) * speed;
            positions[iz] += (targetPositions[iz] - positions[iz]) * speed;

            // Lerp Color
            colors[ix] += (targetColors[ix] - colors[ix]) * speed;
            colors[iy] += (targetColors[iy] - colors[iy]) * speed;
            colors[iz] += (targetColors[iz] - colors[iz]) * speed;
        }

        positionAttribute.needsUpdate = true;
        colorAttribute.needsUpdate = true;

        // Optional: Add some noise/movement to particles so they aren't static
        const time = state.clock.getElapsedTime();
        pointsRef.current.rotation.y = time * 0.05; // Slow rotation of the whole system
    });

    // Custom Shader Material
    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
        uniform float time;
        uniform float pixelRatio;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation
          gl_PointSize = 4.0 * pixelRatio * (30.0 / -mvPosition.z);
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // Circular particle
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          // Glow effect
          float glow = 1.0 - (dist * 2.0);
          glow = pow(glow, 1.5);
          
          gl_FragColor = vec4(vColor, glow); // Add transparency/glow
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }, []);

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={NUM_PARTICLES}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={NUM_PARTICLES}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <primitive object={shaderMaterial} attach="material" />
        </points>
    );
};

export default ParticleField;
