import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls, terrain, user;
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
    
    loadModel('terrain', '../models/buildify_2.0.glb');
    loadModel('model1', '../models/PooleGatewayBuilding.glb.glb');
    loadModel('model2', '../models/building_1.glb');
    addUser();
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

function addUser() {
    const userGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const userMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    user = new THREE.Mesh(userGeometry, userMaterial);
    user.position.set(0, 0.5, 0);
    scene.add(user);
}

function removeModel(name) {
    if (models[name]) {
        scene.remove(models[name]);
        delete models[name];
    }
}

function onKeyDown(event) {
    if (!user) return;
    const moveDistance = 0.8;
    switch(event.key) {
        case 'ArrowDown':
            user.position.z -= moveDistance;
            break;
        case 'ArrowUp':
            user.position.z += moveDistance;
            break;
        case 'ArrowRight':
            user.position.x -= moveDistance;
            break;
        case 'ArrowLeft':
            user.position.x += moveDistance;
            break;
    }
    camera.position.set(user.position.x, user.position.y + 2, user.position.z + 5);
    camera.lookAt(user.position);
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
