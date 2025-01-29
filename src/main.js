import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls, terrain;
let models = {}; // Dictionary to store models

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    loadModel('terrain', '../buildify_2.0.glb');
    loadModel('model1', '../building_1.glb');
    loadModel('model2', '../building_1.glb');
    animate();
    window.addEventListener('keydown', onKeyDown);
    
    const removeButton = document.createElement('button');
    removeButton.innerText = 'Remove Model';
    removeButton.style.position = 'absolute';
    removeButton.style.top = '10px';
    removeButton.style.left = '10px';
    document.body.appendChild(removeButton);
    removeButton.addEventListener('click', () => {
        const modelName = prompt('Enter model name to remove:');
        removeModel(modelName);
    });
}

function loadModel(name, path) {
    const loader = new GLTFLoader();
    loader.load(path, function(gltf) {
        models[name] = gltf.scene;
        scene.add(models[name]);
    }, undefined, function(error) {
        console.error(`Error loading model ${name}:`, error);
    });
}

function removeModel(name) {
    if (models[name]) {
        scene.remove(models[name]);
        delete models[name];
    }
}

function onKeyDown(event) {
    if (!models['model2']) return;
    const moveDistance = 0.8;
    switch(event.key) {
        case 'ArrowDown':
            models['model2'].position.z -= moveDistance;
            break;
        case 'ArrowUp':
            models['model2'].position.z += moveDistance;
            break;
        case 'ArrowRight':
            models['model2'].position.x -= moveDistance;
            break;
        case 'ArrowLeft':
            models['model2'].position.x += moveDistance;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
