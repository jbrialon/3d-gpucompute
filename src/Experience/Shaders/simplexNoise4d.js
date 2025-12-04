import {
  mod,
  Fn,
  floor,
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
  vec2,
  step,
  clamp,
  max,
} from "three/tsl";

// Simplex 4D Noise
// by Ian McEwan, Stefan Gustavson (https://github.com/stegu/webgl-noise)

const permute_0 = Fn(
  ([x]) => {
    return mod(x.mul(34.0).add(1.0).mul(x), 289.0);
  },
  { x: "vec4", return: "vec4" }
);

const permute_1 = Fn(
  ([x]) => {
    return floor(mod(x.mul(34.0).add(1.0).mul(x), 289.0));
  },
  { x: "float", return: "float" }
);

const permute = overloadingFn([permute_0, permute_1]);

const taylorInvSqrt_0 = Fn(
  ([r]) => {
    return sub(1.79284291400159, mul(0.85373472095314, r));
  },
  { r: "vec4", return: "vec4" }
);

const taylorInvSqrt_1 = Fn(
  ([r]) => {
    return sub(1.79284291400159, mul(0.85373472095314, r));
  },
  { r: "float", return: "float" }
);

const taylorInvSqrt = overloadingFn([taylorInvSqrt_0, taylorInvSqrt_1]);

const grad4 = Fn(
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

export const simplexNoise4d = Fn(
  ([v]) => {
    const C = vec2(0.138196601125010504, 0.309016994374947451);

    const i = floor(v.add(dot(v, C.yyyy)));
    const x0 = v.sub(i).add(dot(i, C.xxxx));

    const i0 = property("vec4");
    const isX = step(x0.yzw, x0.xxx);
    const isYZ = step(x0.zww, x0.yyz);

    i0.x.assign(isX.x.add(isX.y).add(isX.z));
    i0.yzw.assign(sub(1.0, isX));
    i0.y.addAssign(isYZ.x.add(isYZ.y));
    i0.zw.addAssign(sub(1.0, isYZ.xy));
    i0.z.addAssign(isYZ.z);
    i0.w.addAssign(sub(1.0, isYZ.z));

    const i3 = clamp(i0, 0.0, 1.0);
    const i2 = clamp(i0.sub(1.0), 0.0, 1.0);
    const i1 = clamp(i0.sub(2.0), 0.0, 1.0);

    const x1 = x0.sub(i1).add(mul(1.0, C.xxxx));
    const x2 = x0.sub(i2).add(mul(2.0, C.xxxx));
    const x3 = x0.sub(i3).add(mul(3.0, C.xxxx));
    const x4 = x0.sub(1.0).add(mul(4.0, C.xxxx));

    i.assign(mod(i, 289.0));

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

    const ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

    const p0 = grad4(j0, ip);
    const p1 = grad4(j1.x, ip);
    const p2 = grad4(j1.y, ip);
    const p3 = grad4(j1.z, ip);
    const p4 = grad4(j1.w, ip);

    const norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
    );
    p0.mulAssign(norm.x);
    p1.mulAssign(norm.y);
    p2.mulAssign(norm.z);
    p3.mulAssign(norm.w);
    p4.mulAssign(taylorInvSqrt(dot(p4, p4)));

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
