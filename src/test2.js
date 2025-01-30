import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, terrain, user, aspectRatio;
aspectRatio = window.innerWidth / window.innerHeight;

let models = {}; // Store individual child objects from the main model
let activeModels = new Set();
let modelList = {
    '2025': [],
    '2024': [],
    '2023': [],
};

let userDirection = new THREE.Vector3();
let moveSpeed = 0.5;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const amblight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(amblight);
    
    loadMainModel('../models/Bournemouth-Uni.glb');
    addUser();
    animate();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    setupUI();
}

function loadMainModel(path) {
    const loader = new GLTFLoader();
    loader.load(path, function(gltf) {
        terrain = gltf.scene;
        scene.add(terrain);
        
        // Store child objects by name in the models dictionary
        terrain.traverse(function(child) {
            if (child.isMesh) {
                console.log(child.name, child)
                modelList['2025'].push(child.name);
                
                if (Math.random(0, 1) < 0.5) {
                    modelList['2024'].push(child.name)
                } 

                if (Math.random(0, 1) < 0.3) {
                    modelList['2023'].push(child.name)
                }

                // modelList['2024'].push(child.name);
                models[child.name] = child;
                // child.visible = false; // Initially hide all objects
            }
        });
        
        updateModels(2025); // Load initial objects
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });
}

function setupUI() {
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

function updateModels(year) {
    activeModels.forEach(name => {
        if (models[name]) models[name].visible = false;
    });
    activeModels.clear();
    
    modelList[year].forEach(name => {
        if (models[name]) {
            models[name].visible = true;
            activeModels.add(name);
        }
    });
}

function addUser() {
    const userGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const userMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    user = new THREE.Mesh(userGeometry, userMaterial);
    user.position.set(1, 2, 3);
    scene.add(user);
    
    camera.position.set(user.position.x, user.position.y + 1, user.position.z);
    camera.lookAt(user.position.x, user.position.y, user.position.z + 1);
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
