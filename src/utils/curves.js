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

    const x3 = c * Math.cosh(v / c) * Math.cos(u);
    const y3 = c * Math.cosh(v / c) * Math.sin(u);
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

export const generateKleinBottle = (numPoints) => {
  const points = [];
  const a = 2; // Scale parameter

  for (let i = 0; i < numPoints; i++) {
    // Parametric equations for Klein bottle
    const u = (i / numPoints) * 2 * Math.PI;
    const v = ((i * 7) % numPoints / numPoints) * 2 * Math.PI; // Distribute in 2D parameter space

    const r = 4 * (1 - Math.cos(u) / 2);

    let x, y, z;
    if (u < Math.PI) {
      x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(u) * Math.cos(v);
      y = 16 * Math.sin(u) + r * Math.sin(u) * Math.cos(v);
    } else {
      x = 6 * Math.cos(u) * (1 + Math.sin(u)) + r * Math.cos(v + Math.PI);
      y = 16 * Math.sin(u);
    }
    z = r * Math.sin(v);

    points.push(new THREE.Vector3(x, y, z));
  }

  return normalizePoints(points, 8);
};

export const generateLorenzAttractor = (numPoints) => {
  const points = [];

  // Lorenz system parameters
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.01;

  // Initial conditions
  let x = 0.1;
  let y = 0;
  let z = 0;

  // Integrate the Lorenz equations
  for (let i = 0; i < numPoints; i++) {
    // Runge-Kutta integration (simplified Euler method for performance)
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;

    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    points.push(new THREE.Vector3(x, y, z));
  }

  return normalizePoints(points, 10);
};

export const generateMandelbulb = (numPoints) => {
  const points = [];
  const power = 8; // Classic Mandelbulb uses power 8
  const maxIterations = 10;
  const bailout = 2;
  const resolution = Math.ceil(Math.cbrt(numPoints / 4)); // Approximate cube root for 3D sampling

  // Sample points in 3D space
  for (let i = 0; i < numPoints; i++) {
    // Spherical sampling for better distribution
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * 1.5; // Sample within radius

    const x0 = r * Math.sin(phi) * Math.cos(theta);
    const y0 = r * Math.sin(phi) * Math.sin(theta);
    const z0 = r * Math.cos(phi);

    let x = 0, y = 0, z = 0;
    let iteration = 0;

    // Mandelbulb iteration
    while (iteration < maxIterations) {
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > bailout) break;

      const theta = Math.atan2(Math.sqrt(x * x + y * y), z);
      const phi = Math.atan2(y, x);

      const rPow = Math.pow(r, power);
      const newTheta = theta * power;
      const newPhi = phi * power;

      x = rPow * Math.sin(newTheta) * Math.cos(newPhi) + x0;
      y = rPow * Math.sin(newTheta) * Math.sin(newPhi) + y0;
      z = rPow * Math.cos(newTheta) + z0;

      iteration++;
    }

    // Only keep points that are on the surface (didn't escape too quickly)
    if (iteration > 2 && iteration < maxIterations) {
      points.push(new THREE.Vector3(x, y, z));
    }
  }

  // Fill remaining points if we don't have enough
  while (points.length < numPoints / 2) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.8 + Math.random() * 0.4;

    points.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }

  return normalizePoints(points, 10);
};

export const generateElectronOrbitals = (numPoints) => {
  const points = [];

  // Generate multiple orbitals (s, p, d)
  const orbitals = [
    { type: 's', n: 1, l: 0, m: 0, count: numPoints * 0.2 },
    { type: 'p', n: 2, l: 1, m: 0, count: numPoints * 0.3 },
    { type: 'p', n: 2, l: 1, m: 1, count: numPoints * 0.25 },
    { type: 'd', n: 3, l: 2, m: 0, count: numPoints * 0.25 }
  ];

  orbitals.forEach(orbital => {
    for (let i = 0; i < orbital.count; i++) {
      // Spherical coordinates
      const r = Math.pow(Math.random(), 1.5) * orbital.n * orbital.n * 2; // Probability distribution
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;

      // Simplified spherical harmonics for shape
      let angularFactor = 1;
      if (orbital.l === 1) { // p orbital
        angularFactor = Math.abs(Math.sin(theta) * Math.cos(phi + orbital.m * Math.PI / 2));
      } else if (orbital.l === 2) { // d orbital
        angularFactor = Math.abs(Math.sin(theta) * Math.sin(theta) * Math.cos(2 * phi));
      }

      const effectiveR = r * (0.5 + angularFactor);

      const x = effectiveR * Math.sin(theta) * Math.cos(phi);
      const y = effectiveR * Math.sin(theta) * Math.sin(phi);
      const z = effectiveR * Math.cos(theta);

      points.push(new THREE.Vector3(x, y, z));
    }
  });

  return normalizePoints(points, 10);
};

export const generateQuaternionJulia = (numPoints) => {
  const points = [];

  // Quaternion constant for Julia set
  const c = { r: -0.2, i: 0.6, j: 0.2, k: 0.2 };
  const maxIterations = 15;
  const bailout = 4;

  for (let i = 0; i < numPoints; i++) {
    // Sample points in 4D space (we'll project to 3D)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * 1.2;

    let qr = r * Math.sin(phi) * Math.cos(theta);
    let qi = r * Math.sin(phi) * Math.sin(theta);
    let qj = r * Math.cos(phi);
    let qk = (Math.random() - 0.5) * 0.5;

    let iteration = 0;

    // Quaternion Julia iteration: q = q² + c
    while (iteration < maxIterations) {
      const magnitude = Math.sqrt(qr * qr + qi * qi + qj * qj + qk * qk);
      if (magnitude > bailout) break;

      // Quaternion multiplication: q² = q * q
      const newQr = qr * qr - qi * qi - qj * qj - qk * qk;
      const newQi = 2 * qr * qi;
      const newQj = 2 * qr * qj;
      const newQk = 2 * qr * qk;

      // Add constant
      qr = newQr + c.r;
      qi = newQi + c.i;
      qj = newQj + c.j;
      qk = newQk + c.k;

      iteration++;
    }

    // Keep points on the boundary (fractal surface)
    if (iteration > 3 && iteration < maxIterations - 1) {
      // Project 4D to 3D (drop the k component or use it for color)
      points.push(new THREE.Vector3(qr, qi, qj));
    }
  }

  // Fill if needed
  while (points.length < numPoints / 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.8 + Math.random() * 0.4;

    points.push(new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    ));
  }

  return normalizePoints(points, 10);
};

export const Generators = {
  koch: generateKochCurve,
  cardioid: generateCardioid,
  butterfly: generateButterfly,
  spiral: generateSpiral,
  catenary: generateCatenary,
  lemniscate: generateLemniscate,
  rose: generateRose,
  klein: generateKleinBottle,
  lorenz: generateLorenzAttractor,
  mandelbulb: generateMandelbulb,
  orbitals: generateElectronOrbitals,
  julia: generateQuaternionJulia
};
