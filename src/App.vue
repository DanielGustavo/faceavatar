<template>
  <div class="container">
    <div>
      <video ref="video"/>
      <div id="scene" ref="scene" />
    </div>

    <div>
      <button @click="streamScreen">stream screen</button>
    </div>
  </div>
</template>

<script>
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

import BasicScene from './BasicScene';
import Avatar from './Avatar';

export default {
  name: 'App',
  data() {
    return {
      faceLandmarker: undefined,
      avatar: undefined
    }
  },
  methods: {
    async streamScreen() {
      const stream = await window.navigator.mediaDevices.getDisplayMedia({
        audio: false,
      });

      this.$refs.video.srcObject = stream;
      this.$refs.video.onloadedmetadata = () => {
        this.$refs.video.play();
      };

      const onVideoFrame = (time) => {
        this.detectFaceLandmarks(time);
        this.$refs.video.requestVideoFrameCallback(onVideoFrame);
      }

      this.$refs.video.requestVideoFrameCallback(onVideoFrame)
    },
    detectFaceLandmarks(time) {
      if (!this.faceLandmarker || !this.$refs.video) return;

      const landmarks = this.faceLandmarker.detectForVideo(this.$refs.video, time);

      const transformationMatrixes = landmarks.facialTransformationMatrixes;
      if (transformationMatrixes?.length > 0) {
        let matrix = new THREE.Matrix4().fromArray(transformationMatrixes[0].data);
        this?.avatar.applyMatrix(matrix, { scale: 40 });
      }

      const blendshapes = landmarks.faceBlendshapes[0]?.categories ?? [];
      if (blendshapes?.length > 0) {
        this?.avatar.updateBlendshapes(blendshapes);
      }
    },
  },
  mounted() {
    const scene = new BasicScene({
      container: this.$refs.scene,
    });
    scene.camera.position.y = 20;

    const avatar = new Avatar(
      'https://assets.codepen.io/9177687/raccoon_head.glb',
      scene.scene,
    )
    this.avatar = avatar;

    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromModelPath(vision,
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
      );
      await faceLandmarker.setOptions({
        baseOptions: {
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true
      });

      this.faceLandmarker = faceLandmarker;
    })()
  }
}
</script>

<style>
.container {
  display: flex;
  flex-direction: row;
}

button {
  margin-left: 8px;
}

video {
  width: 640px;
  background-color: black;
}

#scene {
  width: 640px;
  height: 320px;
}
</style>
