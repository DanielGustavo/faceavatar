import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default class Avatar {
  scene = undefined
  loader = new GLTFLoader();
  gltf = undefined
  root = undefined
  morphTargetMeshes = [];
  url = undefined;

  constructor(url, scene, position) {
    if (!url || !scene) {
      return;
    }

    this.url = url;
    this.scene = scene;
    this.loadModel(position);
  }

  loadModel(position) {
    if (!this.url) {
      return;
    }

    const onLoadModel = (gltf) => {
      if (this.gltf) {
        // Reset GLTF and morphTargetMeshes if a previous model was loaded.
        this.gltf.scene.remove();
        this.morphTargetMeshes = [];
      }

      this.gltf = gltf;
      this.scene.add(gltf.scene);
      this.init(gltf);

      if (position) {
        this.gltf.scenes[0]?.position.set(...position)
      }

      console.log('loaded')
    }

    function onLoadingModel(progress) {
      console.log(
        "Loading model...",
        100.0 * (progress.loaded / progress.total),
        "%"
      )
    }

    this.loader.load(
      this.url,
      onLoadModel,
      onLoadingModel,
      (error) => console.error('loadModel error', error),
    );
  }

  init(gltf) {
    gltf.scene.traverse((object) => {
      // Register first bone found as the root
      if (object?.isBone && !this.root) {
        this.root = object;
      }

      if (!object?.isMesh) {
        return;
      }

      const mesh = object;
      // Reduce clipping when model is close to camera.
      mesh.frustumCulled = false;

      const doesntIncludesMorphableTargets = !mesh.morphTargetDictionary || !mesh.morphTargetInfluences
      if (doesntIncludesMorphableTargets) return;

      this.morphTargetMeshes.push(mesh);
    });
  }

  updateBlendshapes(blendshapes) {
    for (const mesh of this.morphTargetMeshes) {
      const doesntIncludeMorphableTargets = !mesh.morphTargetDictionary || !mesh.morphTargetInfluences
      if (doesntIncludeMorphableTargets) continue;
      
      blendshapes.forEach(({ categoryName: name, score: value }) => {
        const blendshapeIsInMesh = Object.keys(mesh.morphTargetDictionary).includes(name);

        if (blendshapeIsInMesh) {
          const idx = mesh.morphTargetDictionary[name];
          mesh.morphTargetInfluences[idx] = value;
        }
      })
    }
  }

  applyMatrix(
    matrix,
    matrixRetargetOptions
  ) {
    const { scale = 1 } = matrixRetargetOptions || {};
    if (!this.gltf) return;

    matrix.scale(new THREE.Vector3(scale, scale, scale));
    this.gltf.scene.matrixAutoUpdate = false;

    this.gltf.scene.matrix.copy(matrix);
  }

  offsetRoot(offset, rotation) {
    if (!this.root) return;

    this.root.position.copy(offset);

    if (!rotation) return;

    let offsetQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rotation.x, rotation.y, rotation.z)
    );

    this.root.quaternion.copy(offsetQuat);
  }
}