import * as THREE from "three/webgpu";
import {
  uniform,
  storage,
  Fn,
  instanceIndex,
  time,
  deltaTime,
  uv,
  vec2,
  vec3,
  vec4,
  mix,
  sin,
  float,
  modelViewMatrix,
} from "three/tsl";

import Experience from "../Experience";
import { curlNoise } from "../Shaders/curlNoise";
import { simplexNoise3d } from "../Shaders/simplexNoise3d";
import { simplexNoise4d } from "../Shaders/simplexNoise4d";

export default class CurlNoise {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.renderer = this.experience.renderer.instance;
    this.debug = this.experience.debug;

    // Options
    this.options = {
      size: 256,
      sphereRadius: 2,
    };

    // Uniforms
    this.speed = uniform(0.35);
    this.curlStrength = uniform(0.1);
    this.curlFreq = uniform(0.5);
    this.particleScale = uniform(0.003);

    this.focus = uniform(5.1);
    this.fov = uniform(50);
    this.blur = uniform(30);

    // Setup
    this.setGeometry();

    // Debug

    this.setDebug();
  }

  setGeometry() {
    const size = this.options.size;
    const length = size * size;

    // Generate particles on a sphere
    const positions = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      let i3 = i * 3;

      // Random point in unit sphere
      let x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = Math.sqrt(x * x + y * y + z * z);
      } while (len > 1);

      // Normalize and scale to sphere radius
      if (len > 0) {
        const scale = this.options.sphereRadius / len;
        x *= scale;
        y *= scale;
        z *= scale;
      }

      positions[i3 + 0] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }

    // Base geometry
    const baseGeometry = {};
    baseGeometry.instance = new THREE.BufferGeometry();
    baseGeometry.instance.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    baseGeometry.positionAttribute = baseGeometry.instance.attributes.position;
    baseGeometry.count = baseGeometry.instance.attributes.position.count;
    const material = new THREE.SpriteNodeMaterial();

    const basePositionBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(positions, 3),
      "vec3",
      baseGeometry.count
    );

    const positionBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(positions, 3),
      "vec3",
      baseGeometry.count
    );

    const init = Fn(() => {
      const basePosition = basePositionBuffer.element(instanceIndex);
      const position = positionBuffer.element(instanceIndex);
      position.assign(basePosition);
    })();

    const initCompute = init.compute(baseGeometry.count);
    this.renderer.compute(initCompute);

    // Update function
    const update = Fn(() => {
      // Setup
      const t = time.mul(this.speed);

      const position = positionBuffer.element(instanceIndex);
      const basePos = basePositionBuffer.element(instanceIndex);

      // Compute pos
      const pos = basePos.add(
        curlNoise(basePos.mul(this.curlFreq).add(t)).mul(this.curlStrength)
      );

      let curlPos = basePos.add(
        curlNoise(basePos.mul(this.curlFreq).add(t)).mul(this.curlStrength)
      );

      curlPos.addAssign(
        curlNoise(curlPos.mul(this.curlFreq).mul(2.0))
          .mul(0.5)
          .mul(this.curlStrength)
      );

      curlPos.addAssign(
        curlNoise(curlPos.mul(this.curlFreq).mul(4.0))
          .mul(0.25)
          .mul(this.curlStrength)
      );

      curlPos.addAssign(
        curlNoise(curlPos.mul(this.curlFreq).mul(8.0))
          .mul(0.125)
          .mul(this.curlStrength)
      );
      curlPos.addAssign(
        curlNoise(curlPos.mul(this.curlFreq).mul(16.0))
          .mul(0.0625)
          .mul(this.curlStrength)
      );

      const mixFactor = simplexNoise3d(pos.add(t));
      const finalPos = mix(pos, curlPos, mixFactor);
      position.assign(finalPos);
    })();

    this.updateCompute = update.compute(baseGeometry.count);

    // Position
    material.positionNode = positionBuffer.toAttribute();

    // Color
    material.colorNode = Fn(() => {
      uv().sub(0.5).length().greaterThan(0.5).discard();

      return vec4(1.0, 1.0, 1.0, 1.0);
    })();

    material.scaleNode = Fn(() => {
      const pos = positionBuffer.element(instanceIndex);

      const mvPosition = modelViewMatrix.mul(vec4(pos, 1.0));

      const vDistance = this.focus.sub(mvPosition.z.negate()).abs();

      const normalizedIndex = instanceIndex
        .toFloat()
        .div(float(baseGeometry.count));
      const stepThreshold = float(1.0).sub(float(1.0).div(this.fov));
      const focusStep = normalizedIndex.step(stepThreshold);

      // return focusStep.mul(vDistance).mul(this.blur).mul(2.0);
      return this.particleScale.mul(vDistance);
    })();

    // Mesh
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      baseGeometry.count
    );
    this.scene.add(mesh);
  }

  setDebug() {
    if (this.debug.active) {
      const debugFolder = this.debug.ui.addFolder({
        title: "Curl Noise",
      });

      debugFolder.addBinding(this.speed, "value", {
        label: "Speed",
        min: 0.01,
        max: 2.0,
        step: 0.01,
      });

      debugFolder.addBinding(this.curlStrength, "value", {
        label: "Curl Strength",
        min: 0.01,
        max: 2.0,
        step: 0.01,
      });
      debugFolder.addBinding(this.curlFreq, "value", {
        label: "Curl Frequency",
        min: 0.01,
        max: 2.0,
        step: 0.01,
      });

      debugFolder.addBinding(this.particleScale, "value", {
        label: "Particle Scale",
        min: 0.001,
        max: 0.01,
        step: 0.001,
      });

      debugFolder.addBinding(this.focus, "value", {
        label: "Focus",
        min: 3,
        max: 7,
        step: 0.01,
      });

      debugFolder.addBinding(this.fov, "value", {
        label: "FOV",
        min: 0,
        max: 200,
        step: 1,
      });

      debugFolder.addBinding(this.blur, "value", {
        label: "Blur",
        min: 0,
        max: 100,
        step: 1,
      });
    }
  }

  update() {
    if (this.updateCompute && this.renderer) {
      this.renderer.compute(this.updateCompute);
    }
  }
}
