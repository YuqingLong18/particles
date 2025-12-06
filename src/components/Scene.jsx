import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ParticleField from './ParticleField';
import HandController from './HandController';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

const Scene = ({ mode, shape, moleculeType, customMolecule, useHandControl }) => {
    return (
        <Canvas camera={{ position: [0, 0, 50], fov: 60 }}>
            <color attach="background" args={['#000000']} />

            {/* Ambient environment */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <ambientLight intensity={0.5} />

            <Suspense fallback={null}>
                <ParticleField mode={mode} shape={shape} moleculeType={moleculeType} customMolecule={customMolecule} />
            </Suspense>

            {/* Post Processing for Glow */}
            <EffectComposer>
                <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
            </EffectComposer>

            {/* Controls */}
            {useHandControl ? <HandController /> : <OrbitControls enableDamping dampingFactor={0.05} />}
        </Canvas>
    );
};

export default Scene;
