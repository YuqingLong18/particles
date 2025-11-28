import * as THREE from 'three';

// Helper to normalize and center points
const normalizePoints = (points, scale = 10) => {
  const box = new THREE.Box3().setFromPoints(points);
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  
  return points.map(p => p.sub(center).multiplyScalar(scale / maxDim));
};

export const generateKochCurve = (numPoints) => {
  // Simplified 3D Koch-like fractal structure
  const points = [];
  const iterations = 5;
  
  const recurse = (p1, p2, depth) => {
    if (depth === 0) {
      points.push(p1);
      return;
    }
    
    const v = p2.clone().sub(p1).divideScalar(3);
    const p3 = p1.clone().add(v);
    const p5 = p2.clone().sub(v);
    
    // Rotate v 60 degrees around an arbitrary axis to create 3D structure
    const axis = new THREE.Vector3(0, 1, 0).cross(v).normalize();
    if (axis.length() === 0) axis.set(0, 0, 1);
    
    const p4 = p3.clone().add(v.clone().applyAxisAngle(axis, Math.PI / 3));
    
    recurse(p1, p3, depth - 1);
    recurse(p3, p4, depth - 1);
    recurse(p4, p5, depth - 1);
    recurse(p5, p2, depth - 1);
  };

  // Start with a tetrahedron for 3D effect
  const r = 5;
  const t1 = new THREE.Vector3(r, r, r);
  const t2 = new THREE.Vector3(-r, -r, r);
  const t3 = new THREE.Vector3(-r, r, -r);
  const t4 = new THREE.Vector3(r, -r, -r);

  recurse(t1, t2, iterations);
  recurse(t2, t3, iterations);
  recurse(t3, t4, iterations);
  recurse(t4, t1, iterations);
  recurse(t1, t3, iterations);
  recurse(t2, t4, iterations);

  // Resample to match numPoints
  return resample(points, numPoints);
};

export const generateCardioid = (numPoints) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * Math.PI * 2;
    const a = 5;
    const x = a * (2 * Math.cos(t) - Math.cos(2 * t));
    const y = a * (2 * Math.sin(t) - Math.sin(2 * t));
    const z = (Math.random() - 0.5) * 2; // Slight thickness
    points.push(new THREE.Vector3(x, y, z));
  }
  return normalizePoints(points);
};

export const generateButterfly = (numPoints) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 12 * Math.PI;
    const e = Math.exp(Math.cos(t));
    const term2 = 2 * Math.cos(4 * t);
    const term3 = Math.pow(Math.sin(t / 12), 5);
    
    const r = e - term2 + term3;
    const x = r * Math.sin(t);
    const y = r * Math.cos(t);
    const z = r * Math.sin(t * 2) * 0.5; // Add 3D twist
    
    points.push(new THREE.Vector3(x, y, z));
  }
  return normalizePoints(points);
};

export const generateSpiral = (numPoints) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 20 * Math.PI;
    const r = 0.5 * t;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    const z = t * 0.5; // Conical spiral
    points.push(new THREE.Vector3(x, y, z));
  }
  return normalizePoints(points);
};

export const generateCatenary = (numPoints) => {
  const points = [];
  const a = 2;
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints - 0.5) * 6;
    const x = t;
    const y = a * Math.cosh(t / a);
    // Rotate to form a surface of revolution (catenoid-ish)
    const theta = Math.random() * Math.PI * 2;
    const r = Math.abs(x); // Just a visual trick
    
    // Actually let's do a Catenoid surface
    const u = (i / numPoints) * Math.PI * 2;
    const v = ((i % 100) / 100 - 0.5) * 4;
    const c = 2;
    
    const x3 = c * Math.cosh(v/c) * Math.cos(u);
    const y3 = c * Math.cosh(v/c) * Math.sin(u);
    const z3 = v;
    
    points.push(new THREE.Vector3(x3, y3, z3));
  }
  return normalizePoints(points);
};

export const generateLemniscate = (numPoints) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    const a = 5;
    const denom = 1 + Math.sin(t) * Math.sin(t);
    const x = (a * Math.cos(t)) / denom;
    const y = (a * Math.sin(t) * Math.cos(t)) / denom;
    const z = x * Math.sin(t * 2) * 0.5; // Twist
    points.push(new THREE.Vector3(x, y, z));
  }
  return normalizePoints(points);
};

export const generateRose = (numPoints) => {
  const points = [];
  const k = 4; // Petals
  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 2 * Math.PI;
    const r = Math.cos(k * t);
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    const z = Math.sin(k * t) * 0.5;
    points.push(new THREE.Vector3(x, y, z));
  }
  return normalizePoints(points);
};

// Helper to resample points to exactly numPoints
const resample = (points, targetCount) => {
  if (points.length === 0) return [];
  const result = [];
  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor((i / targetCount) * points.length);
    result.push(points[index]);
  }
  return result;
};

export const Generators = {
  koch: generateKochCurve,
  cardioid: generateCardioid,
  butterfly: generateButterfly,
  spiral: generateSpiral,
  catenary: generateCatenary,
  lemniscate: generateLemniscate,
  rose: generateRose
};
