// Three.js Transpiler r181

import {
  floor,
  Fn,
  overloadingFn,
  mul,
  sub,
  vec4,
  property,
  vec3,
  fract,
  abs,
  dot,
  lessThan,
  step,
  clamp,
  max,
  vec2,
} from "three/tsl";

//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

export const mod289_0 = /*@__PURE__*/ Fn(
  ([x]) => {
    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
  },
  { x: "vec4", return: "vec4" }
);

export const mod289_1 = /*@__PURE__*/ Fn(
  ([x]) => {
    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
  },
  { x: "float", return: "float" }
);

export const mod289 = /*@__PURE__*/ overloadingFn([mod289_0, mod289_1]);

export const permute_0 = /*@__PURE__*/ Fn(
  ([x]) => {
    return mod289(x.mul(34.0).add(10.0).mul(x));
  },
  { x: "vec4", return: "vec4" }
);

export const permute_1 = /*@__PURE__*/ Fn(
  ([x]) => {
    return mod289(x.mul(34.0).add(10.0).mul(x));
  },
  { x: "float", return: "float" }
);

export const permute = /*@__PURE__*/ overloadingFn([permute_0, permute_1]);

export const taylorInvSqrt_0 = /*@__PURE__*/ Fn(
  ([r]) => {
    return sub(1.79284291400159, mul(0.85373472095314, r));
  },
  { r: "vec4", return: "vec4" }
);

export const taylorInvSqrt_1 = /*@__PURE__*/ Fn(
  ([r]) => {
    return sub(1.79284291400159, mul(0.85373472095314, r));
  },
  { r: "float", return: "float" }
);

export const taylorInvSqrt = /*@__PURE__*/ overloadingFn([
  taylorInvSqrt_0,
  taylorInvSqrt_1,
]);

export const grad4 = /*@__PURE__*/ Fn(
  ([j, ip]) => {
    const ones = vec4(1.0, 1.0, 1.0, -1.0);
    const p = property("vec4"),
      s = property("vec4");
    p.xyz.assign(
      floor(fract(vec3(j).mul(ip.xyz)).mul(7.0))
        .mul(ip.z)
        .sub(1.0)
    );
    p.w.assign(sub(1.5, dot(abs(p.xyz), ones.xyz)));
    s.assign(vec4(lessThan(p, vec4(0.0))));
    p.xyz.assign(p.xyz.add(s.xyz.mul(2.0).sub(1.0).mul(s.www)));

    return p;
  },
  { j: "float", ip: "vec4", return: "vec4" }
);

// (sqrt(5) - 1)/4 = F4, used once below
//#define F4 0.309016994374947451
const F4 = 0.309016994374947451;

export const snoise = /*@__PURE__*/ Fn(
  ([v]) => {
    const C = vec4(
      0.138196601125011,
      0.276393202250021,
      0.414589803375032,
      -0.447213595499958
    );

    // -1 + 4 * G4
    // First corner

    const i = floor(v.add(dot(v, vec4(F4))));
    const x0 = v.sub(i).add(dot(i, C.xxxx));

    // Other corners
    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)

    const i0 = property("vec4");
    const isX = step(x0.yzw, x0.xxx);
    const isYZ = step(x0.zww, x0.yyz);

    //  i0.x = dot( isX, vec3( 1.0 ) );

    i0.x.assign(isX.x.add(isX.y).add(isX.z));
    i0.yzw.assign(sub(1.0, isX));

    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );

    i0.y.addAssign(isYZ.x.add(isYZ.y));
    i0.zw.addAssign(sub(1.0, isYZ.xy));
    i0.z.addAssign(isYZ.z);
    i0.w.addAssign(sub(1.0, isYZ.z));

    // i0 now contains the unique values 0,1,2,3 in each channel

    const i3 = clamp(i0, 0.0, 1.0);
    const i2 = clamp(i0.sub(1.0), 0.0, 1.0);
    const i1 = clamp(i0.sub(2.0), 0.0, 1.0);

    //  x0 = x0 - 0.0 + 0.0 * C.xxxx
    //  x1 = x0 - i1  + 1.0 * C.xxxx
    //  x2 = x0 - i2  + 2.0 * C.xxxx
    //  x3 = x0 - i3  + 3.0 * C.xxxx
    //  x4 = x0 - 1.0 + 4.0 * C.xxxx

    const x1 = x0.sub(i1).add(C.xxxx);
    const x2 = x0.sub(i2).add(C.yyyy);
    const x3 = x0.sub(i3).add(C.zzzz);
    const x4 = x0.add(C.wwww);

    // Permutations

    i.assign(mod289(i));
    const j0 = permute(
      permute(permute(permute(i.w).add(i.z)).add(i.y)).add(i.x)
    );
    const j1 = permute(
      permute(
        permute(
          permute(i.w.add(vec4(i1.w, i2.w, i3.w, 1.0)))
            .add(i.z)
            .add(vec4(i1.z, i2.z, i3.z, 1.0))
        )
          .add(i.y)
          .add(vec4(i1.y, i2.y, i3.y, 1.0))
      )
        .add(i.x)
        .add(vec4(i1.x, i2.x, i3.x, 1.0))
    );

    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.

    const ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
    const p0 = grad4(j0, ip);
    const p1 = grad4(j1.x, ip);
    const p2 = grad4(j1.y, ip);
    const p3 = grad4(j1.z, ip);
    const p4 = grad4(j1.w, ip);

    // Normalise gradients

    const norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
    );
    p0.mulAssign(norm.x);
    p1.mulAssign(norm.y);
    p2.mulAssign(norm.z);
    p3.mulAssign(norm.w);
    p4.mulAssign(taylorInvSqrt(dot(p4, p4)));

    // Mix contributions from the five corners

    const m0 = max(sub(0.6, vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2))), 0.0);
    const m1 = max(sub(0.6, vec2(dot(x3, x3), dot(x4, x4))), 0.0);
    m0.assign(m0.mul(m0));
    m1.assign(m1.mul(m1));

    return mul(
      49.0,
      dot(m0.mul(m0), vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))).add(
        dot(m1.mul(m1), vec2(dot(p3, x3), dot(p4, x4)))
      )
    );
  },
  { v: "vec4", return: "float" }
);
