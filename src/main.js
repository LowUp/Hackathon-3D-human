import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

let scene, camera, droneCamera, thirdPersonCamera, renderer, terrain, user, insetWidth, insetHeight, aspectRatio, labelRenderer;
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
let labels = {}; // Store CSS2DObjects for labels

let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);

    let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Create third-person camera
    thirdPersonCamera = new THREE.PerspectiveCamera(105, aspectRatio, 0.1, 1000);
    
    // Create bird-eye camera (fixed above the scene)
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0); // Set initial position above the scene
    droneCamera.lookAt(0, 0, 0); // Look at the center of the scene
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create Label Renderer for 2D text
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    const amblight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(amblight);
    
    loadMainModel('../models/Bournemouth-Uni.glb');
    addUser();
    animate();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
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
                // Only push to model list if the object is a mesh
                modelList['2025'].push(child.name);
                
                if (Math.random(0, 1) < 0.5) {
                    modelList['2024'].push(child.name);
                }

                if (Math.random(0, 1) < 0.3) {
                    modelList['2023'].push(child.name);
                }

                // Change position of objects
                child.position.set(child.position.x + Math.random() * 2 -1, child.position.y, child.position.z + Math.random() * 2 - 1);

                // Create label for each object
                createLabel(child);

                models[child.name] = child;
            }
        });
        
        // Load initial models
        updateModels(2025);
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

// Create and attach a label for each model
function createLabel(object) {
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.innerText = object.name;
    labelDiv.style.color = 'white';
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    labelDiv.style.padding = '5px';
    labelDiv.style.borderRadius = '5px';
    labelDiv.style.fontSize = '12px';

    const label = new CSS2DObject(labelDiv);
    label.position.copy(object.position); // Match label position with object position
    
    labels[object.name] = label;
    scene.add(label);
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
            labels[name].visible = true;
            activeModels.add(name);
        }
    });
    updateLabels();
}

function updateLabels() {
    Object.values(labels).forEach(label => {
        const object = models[label.element.innerText];
        if (object) {
            label.position.copy(object.position); // Update label position to match object
            label.visible = object.visible; // Sync visibility with object
        }
    });
}

function addUser() {
    const userGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const userMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    user = new THREE.Mesh(userGeometry, userMaterial);
    user.position.set(1, 2, 3);
    scene.add(user);
    
    // camera.position.set(user.position.x, user.position.y + 1, user.position.z);
    // camera.lookAt(user.position.x, user.position.y, user.position.z + 1);
    // Set the initial camera positions
    thirdPersonCamera.position.set(user.position.x - 5, user.position.y + 2, user.position.z);
    thirdPersonCamera.lookAt(user.position);
    
    camera = thirdPersonCamera; // Set the default camera to third-person
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
            // userDirection.set(-moveSpeed, 0, 0); // Left (move along the X-axis)
            break;
        case 'ArrowRight':
            user.rotation.y -= 0.1;
            // userDirection.set(moveSpeed, 0, 0); 
            break;
        case ' ':
            toggleCamera(); // Toggle camera view on spacebar press
            break;
    }
}

function onKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        userDirection.set(0, 0, 0);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        userDirection.set(0, 0, 0);
    }
}

function toggleCamera() {
    currentCamera = currentCamera === 'thirdPerson' ? 'birdEye' : 'thirdPerson';
}

function animate() {
    requestAnimationFrame(animate);
    user.translateZ(userDirection.z);
    user.position.x += userDirection.x;

    if (currentCamera === 'thirdPerson') {
        thirdPersonCamera.position.set(
            user.position.x - Math.sin(user.rotation.y) * 5,
            user.position.y + 2,
            user.position.z - Math.cos(user.rotation.y) * 5
        );
        thirdPersonCamera.lookAt(user.position);
        camera = thirdPersonCamera;
    } else {
        droneCamera.position.set(user.position.x, 50, user.position.z);
        droneCamera.lookAt(user.position);
        camera = droneCamera;
    }
    
    updateLabels();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
