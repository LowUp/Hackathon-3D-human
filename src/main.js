import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, terrain, user;
let models = {}; // Dictionary to store models
let activeModels = new Set(); // Track currently active models
let modelList = {
    '2025': ['model2', 'model1', 'terrain'],
    '2024': ['model2', 'terrain'],
    '2023': ['terrain'],
};
let userDirection = new THREE.Vector3();
let moveSpeed = 0.2;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    
    loadModel('terrain', '../models/buildify_2.0.glb');
    loadModel('model1', '../models/PooleGatewayBuilding.glb');
    loadModel('model2', '../models/building_1.glb');
    addUser();
    animate();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
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
    
    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.bottom = '20px';
    sliderContainer.style.left = '50%';
    sliderContainer.style.transform = 'translateX(-50%)';
    sliderContainer.style.textAlign = 'center';
    document.body.appendChild(sliderContainer);

    const yearLabel = document.createElement('div');
    yearLabel.innerText = 'Year: 2025';
    yearLabel.style.fontSize = '20px';
    yearLabel.style.marginBottom = '10px';
    sliderContainer.appendChild(yearLabel);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 2023;
    slider.max = 2025;
    slider.value = 2025;
    slider.style.width = '300px';
    slider.style.cursor = 'pointer';
    sliderContainer.appendChild(slider);
    
    slider.addEventListener('input', () => {
        yearLabel.innerText = `Year: ${slider.value}`;
        updateModels(slider.value);
    });
}

function loadModel(name, path) {
    const loader = new GLTFLoader();
    loader.load(path, function(gltf) {
        models[name] = gltf.scene;
        scene.add(models[name]); // Load all models at initialization
        activeModels.add(name);
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
    
    camera.position.set(user.position.x, user.position.y + 1, user.position.z);
    camera.lookAt(user.position.x, user.position.y, user.position.z + 1);
}

function removeModel(name) {
    if (models[name] && scene.children.includes(models[name])) {
        scene.remove(models[name]);
        activeModels.delete(name);
    }
}

function addModel(name) {
    if (models[name] && !scene.children.includes(models[name])) {
        scene.add(models[name]);
        activeModels.add(name);
    }
}

function updateModels(year) {
    activeModels.forEach(model => scene.remove(models[model]));
    activeModels.clear();
    modelList[year].forEach(name => {
        if (models[name]) {
            scene.add(models[name]);
            activeModels.add(name);
        }
    });
}

function onKeyDown(event) {
    switch(event.key) {
        case 'ArrowDown':
            userDirection.set(0, 0, -moveSpeed);
            break;
        case 'ArrowUp':
            userDirection.set(0, 0, moveSpeed);
            break;
        case 'ArrowLeft':
            user.rotation.y += 0.1;
            break;
        case 'ArrowRight':
            user.rotation.y -= 0.1;
            break;
    }
}

function onKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        userDirection.set(0, 0, 0);
    }
}

function animate() {
    requestAnimationFrame(animate);
    user.translateZ(userDirection.z);
    
    camera.position.set(
        user.position.x - Math.sin(user.rotation.y) * 2,
        user.position.y + 1,
        user.position.z - Math.cos(user.rotation.y) * 2
    );
    camera.lookAt(user.position);
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
