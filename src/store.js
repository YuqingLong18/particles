import { create } from 'zustand';

export const useGestureStore = create((set) => ({
    rotation: { x: 0, y: 0 },
    scale: 1,
    position: { x: 0, y: 0, z: 0 },
    setRotation: (x, y) => set({ rotation: { x, y } }),
    setScale: (scale) => set({ scale }),
    setPosition: (x, y, z) => set({ position: { x, y, z } }),
}));
