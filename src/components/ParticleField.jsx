import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Generators } from '../utils/curves';
import { generateMolecule } from '../utils/molecules';
import { generateGalaxy } from '../utils/galaxy';
import { generateArtifact } from '../utils/artifacts';
import { initAudio, getAudioData } from '../utils/audio';
import { generateText3D } from '../utils/text3d';
import { useGestureStore } from '../store';

const NUM_PARTICLES = 30000;

const ParticleField = ({ mode, shape, moleculeType, customMolecule }) => {
    const pointsRef = useRef();
    const groupRef = useRef();

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

        if (mode === 'welcome') {
            const data = generateText3D(NUM_PARTICLES);
            newPoints = data.points;
            newColors = data.colors;
        } else if (mode === 'math') {
            const generator = Generators[shape] || Generators.koch;
            newPoints = generator(NUM_PARTICLES);

            // Generate varied colors along the curve for a more particle-like effect
            for (let i = 0; i < NUM_PARTICLES; i++) {
                const t = i / NUM_PARTICLES; // Position along curve (0 to 1)

                // Create color gradient with softer, less bright colors
                const hue = (t * 0.3 + 0.5) % 1.0; // Cycle through blue-cyan-purple range
                const saturation = 0.6 + Math.random() * 0.2; // Varied saturation
                const lightness = 0.4 + Math.random() * 0.2; // Softer, less bright

                const color = new THREE.Color();
                color.setHSL(hue, saturation, lightness);
                newColors.push(color);
            }
        } else if (mode === 'molecule') {
            const data = generateMolecule(moleculeType, NUM_PARTICLES, customMolecule);
            newPoints = data.points;
            newColors = data.colors;
        } else if (mode === 'galaxy') {
            const data = generateGalaxy(NUM_PARTICLES);
            newPoints = data.points;
            newColors = data.colors;
        } else if (mode === 'artifact') {
            const data = generateArtifact(shape, NUM_PARTICLES);
            newPoints = data.points;
            newColors = data.colors;
        } else if (mode === 'audio') {
            // Initialize audio if needed
            initAudio();

            // Initial sphere shape for audio
            const data = generateArtifact('vase', NUM_PARTICLES); // Reuse vase or sphere as base
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
                targetPositions[i * 3] = 0;
                targetPositions[i * 3 + 1] = 0;
                targetPositions[i * 3 + 2] = 0;
                targetColors[i * 3] = 0;
                targetColors[i * 3 + 1] = 0;
                targetColors[i * 3 + 2] = 0;
            }
        }
    }, [mode, shape, moleculeType, customMolecule, targetPositions, targetColors]);

    useFrame((state, delta) => {
        // 1. Particle Morphing Logic
        if (pointsRef.current) {
            const geometry = pointsRef.current.geometry;
            const positionAttribute = geometry.attributes.position;
            const colorAttribute = geometry.attributes.color;

            const speed = 3.0 * delta;

            // Audio Reactive Logic
            let audioData = null;
            if (mode === 'audio') {
                audioData = getAudioData();
            }

            for (let i = 0; i < NUM_PARTICLES; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                let tx = targetPositions[ix];
                let ty = targetPositions[iy];
                let tz = targetPositions[iz];

                // Modify target based on audio
                if (mode === 'audio' && audioData) {
                    // Map particle index to frequency bin
                    const bin = i % audioData.length;
                    const val = audioData[bin] / 255.0; // 0 to 1

                    // Expand out from center
                    const factor = 1 + val * 2.0;
                    tx *= factor;
                    ty *= factor;
                    tz *= factor;

                    // Color shift
                    colors[ix] = val;
                    colors[iy] = 0.5;
                    colors[iz] = 1 - val;
                } else {
                    // Standard morphing
                    colors[ix] += (targetColors[ix] - colors[ix]) * speed;
                    colors[iy] += (targetColors[iy] - colors[iy]) * speed;
                    colors[iz] += (targetColors[iz] - colors[iz]) * speed;
                }

                positions[ix] += (tx - positions[ix]) * speed;
                positions[iy] += (ty - positions[iy]) * speed;
                positions[iz] += (tz - positions[iz]) * speed;
            }

            positionAttribute.needsUpdate = true;
            colorAttribute.needsUpdate = true;
        }

        // 2. Gesture Control Logic (Applied to Group)
        if (groupRef.current) {
            const { rotation, scale, position } = useGestureStore.getState();

            // Smooth interpolation for gestures
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotation.x, 0.1);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.y, 0.1);

            groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, scale, 0.1));

            groupRef.current.position.lerp(new THREE.Vector3(position.x, position.y, position.z), 0.1);
        }
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
          
          gl_PointSize = 4.0 * pixelRatio * (30.0 / -mvPosition.z);
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          float glow = 1.0 - (dist * 2.0);
          glow = pow(glow, 1.5);
          
          gl_FragColor = vec4(vColor, glow);
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
    }, []);

    return (
        <group ref={groupRef}>
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
        </group>
    );
};

export default ParticleField;
