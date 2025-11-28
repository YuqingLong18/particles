import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useGestureStore } from '../store';

const HandController = () => {
    const videoRef = useRef(null);
    const { setRotation, setScale, setPosition } = useGestureStore();

    useEffect(() => {
        const initHandLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });

            if (videoRef.current) {
                navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.addEventListener('loadeddata', () => {
                            predictWebcam(handLandmarker);
                        });
                    }
                });
            }
        };

        initHandLandmarker();
    }, []);

    const predictWebcam = (handLandmarker) => {
        if (videoRef.current && videoRef.current.currentTime !== videoRef.current.duration) {
            const startTimeMs = performance.now();
            const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs);

            if (results.landmarks && results.landmarks.length > 0) {
                const landmarks = results.landmarks[0];

                // 1. Position (Wrist)
                // Map 0..1 to -10..10 (approx scene range)
                // Invert X because webcam is mirrored usually, or just to match screen coords
                const x = (0.5 - landmarks[0].x) * 20;
                const y = (0.5 - landmarks[0].y) * 15;
                setPosition(x, y, 0);

                // 2. Scale (Pinch: Thumb tip vs Index tip)
                const thumbTip = landmarks[4];
                const indexTip = landmarks[8];
                const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                // Map distance 0.02..0.2 to scale 0.5..3
                const scale = Math.max(0.5, Math.min(5, distance * 15));
                setScale(scale);

                // 3. Rotation
                const wrist = landmarks[0];
                const middleMcp = landmarks[9];
                const indexMcp = landmarks[5];
                const pinkyMcp = landmarks[17];

                // Pitch (X-axis): Tilt forward/backward
                // Vector from Wrist to Middle MCP
                const handDirY = {
                    y: middleMcp.y - wrist.y,
                    z: middleMcp.z - wrist.z
                };
                // When hand is vertical (fingers up), y is negative, z is 0.
                // We want this to be 0 rotation.
                const pitch = -Math.atan2(handDirY.z, -handDirY.y);

                // Yaw (Y-axis): Turn left/right
                // Vector from Index MCP to Pinky MCP
                const handDirX = {
                    x: pinkyMcp.x - indexMcp.x,
                    z: pinkyMcp.z - indexMcp.z
                };
                // When hand is flat facing camera, x is positive (Right hand), z is 0.
                const yaw = Math.atan2(handDirX.z, handDirX.x);

                // Apply rotation (multiply for sensitivity)
                setRotation(pitch * 2, yaw * 2);
            }

            requestAnimationFrame(() => predictWebcam(handLandmarker));
        }
    };

    return (
        <div style={{ display: 'none' }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ transform: 'scaleX(-1)' }}
            />
        </div>
    );
};

export default HandController;
