import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

const HandController = () => {
    const { camera } = useThree();
    const videoRef = useRef(null);
    const recognizerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const lastGestureRef = useRef(null);
    const lastPositionRef = useRef(null);
    const initialPinchDistanceRef = useRef(null);
    const initialZoomRef = useRef(null);

    useEffect(() => {
        const initMediaPipe = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });

            setIsLoaded(true);
        };

        initMediaPipe();

        // Setup Camera
        const video = document.createElement('video');
        video.style.display = 'none';
        video.autoplay = true;
        video.playsInline = true;
        document.body.appendChild(video);
        videoRef.current = video;

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
                video.srcObject = stream;
            });
        }

        return () => {
            if (videoRef.current) {
                const stream = videoRef.current.srcObject;
                if (stream) {
                    const tracks = stream.getTracks();
                    tracks.forEach(track => track.stop());
                }
                document.body.removeChild(videoRef.current);
            }
        };
    }, []);

    useFrame(() => {
        if (!isLoaded || !recognizerRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

        const results = recognizerRef.current.recognizeForVideo(videoRef.current, Date.now());

        if (results.gestures.length > 0) {
            const gesture = results.gestures[0][0].categoryName;
            const landmarks = results.landmarks[0];

            // Map landmarks to screen coordinates (approx)
            // Index finger tip is index 8
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            const currentPos = new THREE.Vector2(indexTip.x, indexTip.y);

            // --- Interaction Logic ---

            // 1. Pinch to Zoom
            // We can detect pinch by distance between thumb and index
            const distance = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
            const isPinching = distance < 0.05; // Threshold

            if (isPinching) {
                if (initialPinchDistanceRef.current === null) {
                    initialPinchDistanceRef.current = distance;
                    initialZoomRef.current = camera.position.z;
                } else {
                    // Calculate zoom delta
                    const delta = (initialPinchDistanceRef.current - distance) * 200; // Sensitivity
                    camera.position.z = THREE.MathUtils.clamp(initialZoomRef.current + delta, 5, 100);
                }
            } else {
                initialPinchDistanceRef.current = null;
            }

            // 2. Closed Fist to Rotate
            if (gesture === 'Closed_Fist') {
                if (lastPositionRef.current) {
                    const deltaX = currentPos.x - lastPositionRef.current.x;
                    const deltaY = currentPos.y - lastPositionRef.current.y;

                    // Rotate camera around the center (0,0,0)
                    // Simplified: just move camera position for now, or rotate scene
                    // Let's rotate the camera orbit
                    const theta = deltaX * 5; // Sensitivity
                    const phi = deltaY * 5;

                    // Convert to spherical to rotate
                    const spherical = new THREE.Spherical().setFromVector3(camera.position);
                    spherical.theta -= theta;
                    spherical.phi -= phi;
                    spherical.makeSafe();

                    camera.position.setFromSpherical(spherical);
                    camera.lookAt(0, 0, 0);
                }
            }

            // 3. Open Palm to Pan (Move camera target/offset)
            if (gesture === 'Open_Palm') {
                if (lastPositionRef.current) {
                    const deltaX = currentPos.x - lastPositionRef.current.x;
                    const deltaY = currentPos.y - lastPositionRef.current.y;

                    camera.position.x += deltaX * 20;
                    camera.position.y -= deltaY * 20;
                }
            }

            lastPositionRef.current = currentPos;
            lastGestureRef.current = gesture;
        } else {
            lastPositionRef.current = null;
            initialPinchDistanceRef.current = null;
        }
    });

    return null; // This component has no visual representation in the scene
};

export default HandController;
