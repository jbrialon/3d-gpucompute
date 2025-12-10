import * as THREE from "three/webgpu";
import {
  uniform,
  vec3,
  storage,
  instanceIndex,
  Fn,
  smoothstep,
  hash,
  time,
  deltaTime,
  vec4,
  If,
  uv,
} from "three/tsl";

import Experience from "../Experience";
import { snoise as simplexNoise4d } from "../Shaders/simplexNoise4d";

export default class FlowField {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.renderer = this.experience.renderer.instance;
    this.debug = this.experience.debug;

    this.boatModel = this.experience.resources.items.boatModel;
    this.churchModel = this.experience.resources.items.churchModel;

    // Get initial model from URL hash
    const hash = window.location.hash.replace("#", "");
    const initialModel = hash === "church" ? "church" : "boat";

    this.activeModel =
      initialModel === "boat" ? this.boatModel : this.churchModel;

    this.options = {
      model: initialModel,
      colorItemSize: initialModel === "boat" ? 4 : 3, // color is rgba for boat and rgb for church
    };

    // Uniforms
    this.size = uniform(0.05);
    this.influence = uniform(0.5);
    this.flowFieldStrength = uniform(2);
    this.flowFieldPositionFrequency = uniform(0.5);
    this.flowFieldTimeFrequency = uniform(0.3);
    this.decayFrequency = uniform(0.2);

    // Setup
    this.setFlowField();

    // Debug
    this.setDebug();
  }

  setFlowField() {
    const baseGeometry = {};
    baseGeometry.instance = this.activeModel.scene.children[0].geometry;
    baseGeometry.positionAttribute = baseGeometry.instance.attributes.position;
    baseGeometry.colorAttribute = baseGeometry.instance.attributes.color;
    baseGeometry.count = baseGeometry.instance.attributes.position.count;
    const material = new THREE.SpriteNodeMaterial();

    const basePositionBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(
        baseGeometry.positionAttribute.array,
        3
      ),
      "vec3",
      baseGeometry.count
    );

    const colorBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(
        baseGeometry.colorAttribute.array,
        this.options.colorItemSize
      ),
      "vec3",
      baseGeometry.count
    );

    const positionBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(
        new Float32Array(baseGeometry.count * 3),
        3
      ),
      "vec3",
      baseGeometry.count
    );

    const lifeBuffer = storage(
      new THREE.StorageInstancedBufferAttribute(
        new Float32Array(baseGeometry.count),
        1
      ),
      "float",
      baseGeometry.count
    );

    const init = Fn(() => {
      const basePosition = basePositionBuffer.element(instanceIndex);
      const position = positionBuffer.element(instanceIndex);
      const life = lifeBuffer.element(instanceIndex);

      position.assign(basePosition);
      life.assign(hash(instanceIndex));
    })();

    const initCompute = init.compute(baseGeometry.count);
    this.renderer.compute(initCompute);

    const update = Fn(() => {
      // Setup
      const elapsedTime = time.mul(0.2);
      const delta = deltaTime;

      // Buffers
      const basePosition = basePositionBuffer.element(instanceIndex);
      const position = positionBuffer.element(instanceIndex);
      const life = lifeBuffer.element(instanceIndex);

      // strength
      const remapedInfluence = this.influence.remap(0, 1, 1, -1);
      const strength = simplexNoise4d(
        vec4(
          basePosition.add(0).mul(this.flowFieldPositionFrequency),
          elapsedTime
        )
      ).smoothstep(remapedInfluence, 1);

      // Flowfield
      const flowfield = vec3(
        simplexNoise4d(
          vec4(
            position.add(0).mul(this.flowFieldPositionFrequency),
            elapsedTime
          )
        ),
        simplexNoise4d(
          vec4(
            position.add(1).mul(this.flowFieldPositionFrequency),
            elapsedTime
          )
        ),
        simplexNoise4d(
          vec4(
            position.add(2).mul(this.flowFieldPositionFrequency),
            elapsedTime
          )
        )
      ).normalize();

      position.addAssign(
        flowfield.mul(delta).mul(strength).mul(this.flowFieldStrength)
      );

      // Life
      const newLife = life.add(deltaTime.mul(this.decayFrequency));
      If(newLife.greaterThan(1), () => {
        position.assign(basePosition);
      });
      life.assign(newLife.mod(1));
    })();

    this.updateCompute = update.compute(baseGeometry.count);

    // Position
    material.positionNode = positionBuffer.toAttribute();

    // Color
    material.colorNode = Fn(() => {
      uv().sub(0.5).length().greaterThan(0.5).discard();

      return colorBuffer.element(instanceIndex);
    })();

    // Scale
    material.scaleNode = Fn(() => {
      const life = lifeBuffer.toAttribute();

      const scale = smoothstep(0, 0.1, life)
        .mul(smoothstep(1, 0.7, life))
        .mul(hash(instanceIndex).remap(0.25, 1).x)
        .mul(this.size);

      return scale;
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
        title: "Particles",
      });

      debugFolder
        .addBinding(this.options, "model", {
          label: "Model",
          options: {
            Boat: "boat",
            Church: "church",
          },
        })
        .on("change", (ev) => {
          this.options.model = ev.value;
          this.activeModel =
            ev.value === "boat" ? this.boatModel : this.churchModel;
          window.location.hash = ev.value;
          window.location.reload();
        });

      debugFolder.addBinding(this.size, "value", {
        label: "Size",
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder.addBinding(this.influence, "value", {
        label: "Flowfield Influence",
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder.addBinding(this.flowFieldStrength, "value", {
        label: "Flowfield Strength",
        min: 0,
        max: 10,
        step: 0.001,
      });

      debugFolder.addBinding(this.flowFieldPositionFrequency, "value", {
        label: "Flowfield Frequency",
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder.addBinding(this.flowFieldTimeFrequency, "value", {
        label: "Flowfield TimeFrequency",
        min: 0,
        max: 1,
        step: 0.001,
      });

      debugFolder.addBinding(this.decayFrequency, "value", {
        label: "Decay Frequency",
        min: 0,
        max: 1,
        step: 0.001,
      });
    }
  }

  update() {
    if (this.updateCompute && this.renderer) {
      this.renderer.compute(this.updateCompute);
    }
  }
}
