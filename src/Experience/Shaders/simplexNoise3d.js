// Three.js Transpiler r181
// https://github.com/hughsk/glsl-noise/blob/master/simplex/3d.glsl

import {
  floor,
  Fn,
  overloadingFn,
  mul,
  sub,
  vec2,
  vec4,
  dot,
  step,
  min,
  max,
  float,
  abs,
  vec3,
} from "three/tsl";

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//

export const mod289_0 = /*@__PURE__*/ Fn(
  ([x]) => {
    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
  },
  { x: "vec3", return: "vec3" }
);

export const mod289_1 = /*@__PURE__*/ Fn(
  ([x]) => {
    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
  },
  { x: "vec4", return: "vec4" }
);

export const mod289 = /*@__PURE__*/ overloadingFn([mod289_0, mod289_1]);

export const permute = /*@__PURE__*/ Fn(
  ([x]) => {
    return mod289(x.mul(34.0).add(1.0).mul(x));
  },
  { x: "vec4", return: "vec4" }
);

export const taylorInvSqrt = /*@__PURE__*/ Fn(
  ([r]) => {
    return sub(1.79284291400159, mul(0.85373472095314, r));
  },
  { r: "vec4", return: "vec4" }
);

export const snoise = /*@__PURE__*/ Fn(
  ([v]) => {
    const C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner

    const i = floor(v.add(dot(v, C.yyy)));
    const x0 = v.sub(i).add(dot(i, C.xxx));

    // Other corners

    const g = step(x0.yzx, x0.xyz);
    const l = sub(1.0, g);
    const i1 = min(g.xyz, l.zxy);
    const i2 = max(g.xyz, l.zxy);

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;

    const x1 = x0.sub(i1).add(C.xxx);
    const x2 = x0.sub(i2).add(C.yyy);

    // 2.0*C.x = 1/3 = C.y

    const x3 = x0.sub(D.yyy);

    // -1.0+3.0*C.x = -0.5 = -D.y
    // Permutations

    i.assign(mod289(i));
    const p = permute(
      permute(
        permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
          .add(i.y)
          .add(vec4(0.0, i1.y, i2.y, 1.0))
      )
        .add(i.x)
        .add(vec4(0.0, i1.x, i2.x, 1.0))
    );

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)

    const n_ = float(0.142857142857);

    // 1.0/7.0

    const ns = n_.mul(D.wyz).sub(D.xzx);
    const j = p.sub(mul(49.0, floor(p.mul(ns.z).mul(ns.z))));

    //  mod(p,7*7)

    const x_ = floor(j.mul(ns.z));
    const y_ = floor(j.sub(mul(7.0, x_)));

    // mod(j,N)

    const x = x_.mul(ns.x).add(ns.yyyy);
    const y = y_.mul(ns.x).add(ns.yyyy);
    const h = sub(1.0, abs(x)).sub(abs(y));
    const b0 = vec4(x.xy, y.xy);
    const b1 = vec4(x.zw, y.zw);

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;

    const s0 = floor(b0).mul(2.0).add(1.0);
    const s1 = floor(b1).mul(2.0).add(1.0);
    const sh = step(h, vec4(0.0)).negate();
    const a0 = b0.xzyw.add(s0.xzyw.mul(sh.xxyy));
    const a1 = b1.xzyw.add(s1.xzyw.mul(sh.zzww));
    const p0 = vec3(a0.xy, h.x);
    const p1 = vec3(a0.zw, h.y);
    const p2 = vec3(a1.xy, h.z);
    const p3 = vec3(a1.zw, h.w);

    //Normalise gradients

    const norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
    );
    p0.mulAssign(norm.x);
    p1.mulAssign(norm.y);
    p2.mulAssign(norm.z);
    p3.mulAssign(norm.w);

    // Mix final noise value

    const m = max(
      sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))),
      0.0
    );
    m.assign(m.mul(m));

    return mul(
      42.0,
      dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)))
    );
  },
  { v: "vec3", return: "float" }
);
