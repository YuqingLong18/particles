import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Generators } from '../utils/curves';
import { generateMolecule } from '../utils/molecules';
import { generateGalaxy } from '../utils/galaxy';
import { generateArtifact } from '../utils/artifacts';
import { initAudio, getAudioData } from '../utils/audio';
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

        if (mode === 'math') {
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

            // Initialize as a flat ribbon along X-axis
            newPoints = [];
            newColors = [];
            for (let i = 0; i < NUM_PARTICLES; i++) {
                const t = i / NUM_PARTICLES;
                const x = (t - 0.5) * 20; // Spread from -10 to 10
                const y = 0;
                const z = (Math.random() - 0.5) * 2; // Slight depth for 3D ribbon effect
                newPoints.push(new THREE.Vector3(x, y, z));

                // Initial color (will be updated by audio)
                newColors.push(new THREE.Color(0x00ffff));
            }
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
            const time = state.clock.elapsedTime;

            // Audio Reactive Logic
            let audioData = null;
            if (mode === 'audio') {
                audioData = getAudioData();
            }

            // Calculate Audio Metrics once per frame
            let volume = 0;
            let pitch = 0;
            let dominantBin = 0;

            if (audioData) {
                let sum = 0;
                let maxVal = 0;
                for (let i = 0; i < audioData.length; i++) {
                    sum += audioData[i];
                    if (audioData[i] > maxVal) {
                        maxVal = audioData[i];
                        dominantBin = i;
                    }
                }
                volume = sum / audioData.length / 255.0; // 0 to 1
                // Pitch: Normalize bin index (0-255 roughly) to a frequency factor
                // Lower bins = Bass, Higher bins = Treble
                pitch = dominantBin / audioData.length;
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
                    // Cosmic Flow Logic

                    // 1. Flow Calculation
                    // Particles flow from left (-20) to right (20)
                    // Use index 'i' to distribute them along the flow
                    const flowSpeed = 0.2 + volume * 0.5; // Faster when louder
                    const cycle = 40; // Width of the flow field

                    // Continuous flow position based on time and index
                    // (i / NUM_PARTICLES) gives 0..1
                    // (time * flowSpeed) adds movement
                    // % 1.0 wraps it around
                    let flowT = (i / NUM_PARTICLES + time * 0.05) % 1.0;

                    // Map 0..1 to -20..20
                    let x = (flowT - 0.5) * cycle;

                    // 2. Wave & Noise Calculation
                    const amplitude = 1 + volume * 15; // Higher amplitude
                    const frequency = 0.5 + pitch * 5; // Lower base freq for "cosmic" feel

                    // Base Wave (The "Path")
                    const baseX = x;
                    const baseY = Math.sin(baseX * frequency + time) * amplitude;

                    // 3. Cosmic Scatter (Sparser & Volumetric)
                    // Use 'i' to generate pseudo-random offsets that are stable per particle
                    // We want a "tube" or "cloud" around the path
                    const randomAngle = i * 137.5; // Golden angle for distribution
                    const randomRadius = 2 + Math.random() * 8; // Wide spread (2 to 10 units radius)

                    // Swirling momentum
                    const swirlSpeed = 1.0 + volume * 2.0;
                    const swirl = time * swirlSpeed + i * 0.01;

                    const offsetX = Math.cos(randomAngle) * 0.5; // Slight x-jitter
                    const offsetY = Math.sin(swirl + randomAngle) * randomRadius * (0.5 + volume); // Expand with volume
                    const offsetZ = Math.cos(swirl + randomAngle) * randomRadius * (0.5 + volume);

                    tx = baseX + offsetX;
                    ty = baseY + offsetY;
                    tz = offsetZ; // Z is mostly the scatter

                    // 4. Color Mapping (Cosmic Palette)
                    // Deep Blues, Purples, Cyans, with occasional bright white/red stars
                    // Pitch shifts the hue slightly

                    const baseHue = 0.6 + pitch * 0.2; // 0.6 (Blue) to 0.8 (Purple/Magenta)
                    const sat = 0.8;
                    const light = 0.3 + volume * 0.7; // Pulse brightness

                    // Occasional "sparkle" for high pitch
                    let finalLight = light;
                    if (Math.random() > 0.95 && pitch > 0.5) {
                        finalLight = 1.0; // Sparkle
                    }

                    const color = new THREE.Color().setHSL(baseHue, sat, finalLight);

                    // Direct assignment for immediate flow
                    positions[ix] = tx;
                    positions[iy] = ty;
                    positions[iz] = tz;

                    colors[ix] = color.r;
                    colors[iy] = color.g;
                    colors[iz] = color.b;

                } else {
                    // Standard morphing for other modes
                    colors[ix] += (targetColors[ix] - colors[ix]) * speed;
                    colors[iy] += (targetColors[iy] - colors[iy]) * speed;
                    colors[iz] += (targetColors[iz] - colors[iz]) * speed;

                    positions[ix] += (tx - positions[ix]) * speed;
                    positions[iy] += (ty - positions[iy]) * speed;
                    positions[iz] += (tz - positions[iz]) * speed;
                }
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
