import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const loader = new GLTFLoader();
const scene = new THREE.Scene();
let camera, renderer, terrain, user;

scene.background = new THREE.Color(0xaaaaaa);
    
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

loader.load(
  '../models/Bournemouth-Uni.glb', // Replace with the path to your GLB file
  function (gltf) {
    scene.add(gltf.scene);
    // Optionally, center the model
    gltf.scene.position.set(0, 0, 0);

    // Traverse the scene to find and manipulate individual objects
    gltf.scene.traverse(function (child) {
      if (child.isMesh) {
        console.log('Mesh found:', child.name);
        // You can manipulate the child here, e.g., position, rotation, scale
        child.position.set(1, 2, 3); // Set to desired coordinates
    }
    });

    // Example: Accessing a specific object by name
    const specificObject = gltf.scene.getObjectByName('element317'); // Replace with your object's name
    if (specificObject) {
      // Locate the object by setting its position
      specificObject.position.set(1, 2, 3); // Set to desired coordinates
      console.log('Located Object:', specificObject.name, specificObject.position);
    } else {
      console.warn('Object with the specified name not found.');
    }
  },
  undefined,
  function (error) {
    console.error('An error happened while loading the GLB:', error);
  }
);

function animate() {
    requestAnimationFrame(animate);
    // controls.update();
    renderer.render(scene, camera);
}

animate();