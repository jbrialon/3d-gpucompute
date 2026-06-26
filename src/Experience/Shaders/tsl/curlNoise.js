import { Fn, vec2, vec3, float } from "three/tsl";

export const curlNoise2D = Fn(([p, baseNoise]) => {
  const eps = float(0.001);

  const n = baseNoise(p);
  const nx = baseNoise(p.add(vec2(eps, 0)));
  const ny = baseNoise(p.add(vec2(0, eps)));

  const dndx = nx.sub(n).div(eps);
  const dndy = ny.sub(n).div(eps);

  // Curl in 2D: rotate gradient 90 degrees
  return vec2(dndy, dndx.negate());
});

export const curlNoise3D = Fn(([p, baseNoise]) => {
  const eps = float(0.001);

  const px = baseNoise(p.add(vec3(eps, 0, 0)));
  const nx = baseNoise(p.sub(vec3(eps, 0, 0)));
  const py = baseNoise(p.add(vec3(0, eps, 0)));
  const ny = baseNoise(p.sub(vec3(0, eps, 0)));
  const pz = baseNoise(p.add(vec3(0, 0, eps)));
  const nz = baseNoise(p.sub(vec3(0, 0, eps)));

  const x = py.sub(ny).sub(pz.sub(nz));
  const y = pz.sub(nz).sub(px.sub(nx));
  const z = px.sub(nx).sub(py.sub(ny));

  return vec3(x, y, z).div(eps.mul(2));
});
