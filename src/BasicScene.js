import * as THREE from 'three';

export default class BasicScene {
  scene = undefined
  width = undefined
  height = undefined
  camera = undefined
  renderer = undefined
  controls = undefined
  container = undefined
  lastTime = 0
  callbacks = []

  constructor(props) {
    if (props?.container === undefined) {
      return;
    }

    this.height = props.container.clientHeight;
    this.width = props.container.clientWidth;

    // Set up threejs
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.width / this.height,
      0.01,
      5000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    THREE.ColorManagement.legacy = false;
    props.container.appendChild(this.renderer.domElement);

    // Set up the basic lighting for the scene
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    this.scene.add(directionalLight);

    this.render();

    props.container.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container?.clientWidth;
    this.height = this.container?.clientHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.renderer.render(this.scene, this.camera);
  }

  render(time) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    for (const callback of this.callbacks) {
      callback(delta);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((t) => this.render(t));
  }
}
