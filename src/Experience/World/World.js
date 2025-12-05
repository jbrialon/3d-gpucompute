import Experience from "../Experience";
import FlowField from "./FlowField";
import Loader from "./Loader";
export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // // Wait for resources to be loaded
    this.loader = new Loader();
    this.resources.on("ready", () => {
      // Setup
      this.flowfield = new FlowField();

      this.loader.hideLoader();
    });
  }

  update() {
    if (this.flowfield) this.flowfield.update();
  }
}
