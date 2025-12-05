// curlNoise.js
import { vec3, Fn, float, mul, div } from "three/tsl";
import { simplexNoise3d } from "./simplexNoise3d.js";

const snoiseVec3 = Fn(
  ([x]) => {
    const s = simplexNoise3d(vec3(x));
    const s1 = simplexNoise3d(
      vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2))
    );
    const s2 = simplexNoise3d(
      vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4))
    );
    const c = vec3(s, s1, s2);
    return c;
  },
  { x: "vec3", return: "vec3" }
);

export const curlNoise = Fn(
  ([p]) => {
    const e = float(0.1);
    const dx = vec3(e, 0.0, 0.0);
    const dy = vec3(0.0, e, 0.0);
    const dz = vec3(0.0, 0.0, e);

    const p_x0 = snoiseVec3(p.sub(dx));
    const p_x1 = snoiseVec3(p.add(dx));
    const p_y0 = snoiseVec3(p.sub(dy));
    const p_y1 = snoiseVec3(p.add(dy));
    const p_z0 = snoiseVec3(p.sub(dz));
    const p_z1 = snoiseVec3(p.add(dz));

    const x = p_y1.z.sub(p_y0.z).sub(p_z1.y).add(p_z0.y);
    const y = p_z1.x.sub(p_z0.x).sub(p_x1.z).add(p_x0.z);
    const z = p_x1.y.sub(p_x0.y).sub(p_y1.x).add(p_y0.x);

    const divisor = div(1.0, mul(2.0, e));
    return vec3(x, y, z).mul(divisor);
  },
  { p: "vec3", return: "vec3" }
);
