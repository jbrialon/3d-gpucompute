import * as THREE from "three/webgpu";
import Experience from "./Experience";

export default class Renderer {
  constructor() {
    this.experience = new Experience();
    this.debug = this.experience.debug;
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;

    // Options
    this.options = {
      clearColor: 0x29191f,
      toneMapping: THREE.LinearToneMapping,
      toneMappingExposure: 1,
    };
  }

  async setInstance() {
    this.instance = new THREE.WebGPURenderer({
      canvas: this.canvas,
      forceWebGL: false,
      antialias: true,
      alpha: true,
    });

    await this.instance.init();

    THREE.ColorManagement.enabled = true;
    this.instance.outputColorSpace = THREE.SRGBColorSpace;

    this.instance.toneMapping = this.options.toneMapping;
    this.instance.toneMappingExposure = this.options.toneMappingExposure;
    this.instance.setClearColor(this.options.clearColor);

    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(this.sizes.pixelRatio);

    this.setDebug();
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder({
        title: "Experience",
      });
      // Tone Mapping
      this.debugFolder
        .addBinding(this.options, "clearColor", {
          label: "Background",
          view: "color",
        })
        .on("change", () => {
          this.instance.setClearColor(this.options.clearColor);
        });
    }
  }

  resize() {
    this.instance.setSize(this.sizes.width, this.sizes.height);
    this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 2));
  }

  update() {
    this.instance.render(this.scene, this.camera.instance);
  }
}
