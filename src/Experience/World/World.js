import Experience from "../Experience";
import FlowField from "./FlowField";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // // Wait for resources to be loaded
    this.resources.on("ready", () => {
      // Setup
      this.flowfield = new FlowField();
    });
  }

  update() {
    if (this.flowfield) this.flowfield.update();
  }
}
