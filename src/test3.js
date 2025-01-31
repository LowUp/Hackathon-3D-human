import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Import OrbitControls

// Global variables
let scene, camera, droneCamera, thirdPersonCamera, orbitCamera, renderer, terrain, user, insetWidth, insetHeight, aspectRatio;
aspectRatio = window.innerWidth / window.innerHeight;

let models = {}; // Dictionary to store models

let activeModels = new Set(); // Track currently active models
let modelList = {
        '2024': [
          'element007 Mesh',
          'Block_2_17-24_2 Mesh',
          'Talbot_House_1 Mesh',
          'element015_1 Mesh',
          'element299 Mesh'
        ],
        '2023': [
          'Allsebrook_Lecture_Theatre_1 Mesh',
          'Christchurch_House_2 Mesh',
          'element316 Mesh',
          'North_Light_Studios001_2 Mesh',
          'element015_2 Mesh',
          'Block_1_1-16_1 Mesh',
          'element012_2 Mesh',
          'element347 Mesh',
          'North_Light_Studios002_1 Mesh',
          'Weymouth_House_1 Mesh',
          'Kimmeridge_House_2 Mesh',
          'element299 Mesh',
          'Sport_BU_2 Mesh',
          'element154_1 Mesh',
          'North_Light_Studios_1 Mesh',
          'Library_(Arts_University_Bournemouth)_2 Mesh',
          'element153_2 Mesh',
          'element353 Mesh',
          'element015_2 Mesh',
          'DESIGN_&_ENGINEERING_INNOVATION_CENTRE_2 Mesh'
        ]
      
};

let userDirection = new THREE.Vector3();
let moveSpeed = 1;

let currentCamera = 'thirdPerson'; // Can be 'thirdPerson', 'birdEye', or 'orbit'

// Declare yearLabel and slider globally
let yearLabel, slider;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);
    
    // Initialize renderer first since it's needed for OrbitControls
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // Initialize all cameras
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    
    // Create third-person camera
    thirdPersonCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    
    // Create bird-eye camera (fixed above the scene)
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0); // Set initial position above the scene
    droneCamera.lookAt(0, 0, 0); // Look at the center of the scene
    
    // Create orbit camera
    orbitCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    orbitCamera.position.set(10, 10, 10); // Set an initial position
    
    // Initialize OrbitControls for the orbitCamera
    let orbitControls = new OrbitControls(orbitCamera, renderer.domElement);
    orbitControls.enableDamping = true; // Enable smooth damping
    orbitControls.dampingFactor = 0.05;
    orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 100;
    orbitControls.maxPolarAngle = Math.PI / 2; // Limit to prevent flipping
    
    // Store controls for later use
    scene.userData.orbitControls = orbitControls;
    
    const amblight = new THREE.AmbientLight(0xffffff, 1);
    amblight.position.set(1, 1, 1);
    scene.add(amblight);
    
    // loadModel('terrain', '../models/bourne-final.glb');
    addUser();
    animate();
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    // UI for model removal
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
    
    // Add Camera Toggle Button
    const cameraButton = document.createElement('button');
    cameraButton.innerText = 'Toggle Camera';
    cameraButton.style.position = 'absolute';
    cameraButton.style.top = '10px';
    cameraButton.style.left = '120px'; // Position next to the remove button
    document.body.appendChild(cameraButton);
    cameraButton.addEventListener('click', () => {
        toggleCamera();
        updateYearLabel(); // Update the year label to reflect camera change
    });
    
    // Slider for year selection
    const sliderContainer = document.createElement('div');
    sliderContainer.style.position = 'absolute';
    sliderContainer.style.bottom = '20px';
    sliderContainer.style.left = '50%';
    sliderContainer.style.transform = 'translateX(-50%)';
    sliderContainer.style.textAlign = 'center';
    document.body.appendChild(sliderContainer);

    yearLabel = document.createElement('div');
    yearLabel.innerText = `Year: 2025 | Camera: Third Person`;
    yearLabel.style.fontSize = '20px';
    yearLabel.style.marginBottom = '10px';
    sliderContainer.appendChild(yearLabel);

    slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 2023;
    slider.max = 2025;
    slider.value = 2025;
    slider.style.width = '300px';
    slider.style.cursor = 'pointer';
    sliderContainer.appendChild(slider);
    
    slider.addEventListener('input', () => {
        updateModels(slider.value);
        updateYearLabel(); // Update the label when the slider is moved
    });
    
   
}
 // Helper function to capitalize first letter
 function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Update year label function
function updateYearLabel() {
    yearLabel.innerText = `Year: ${slider.value} | Camera: ${capitalizeFirstLetter(getCameraName(currentCamera))}`;
}

// Function to get human-readable camera name
function getCameraName(cameraKey) {
    switch(cameraKey) {
        case 'thirdPerson':
            return 'Third Person';
        case 'birdEye':
            return 'Bird Eye';
        case 'orbit':
            return 'Orbit';
        default:
            return 'Unknown';
    }
}

function loadModel(name, path) {
    const loader = new GLTFLoader();
    loader.load(path, function(gltf) {
        models[name] = gltf.scene;
        scene.add(models[name]); // Load all models at initialization
        activeModels.add(name);

        // Traverse the scene to find and manipulate individual objects
        gltf.scene.traverse(function (child) {
            if (child.isMesh) {
                console.log('Mesh found:', child.name, child);
                // Add any mesh-specific logic here
            }
        });

        // Example: Accessing a specific object by name
        const specificObject = gltf.scene.getObjectByName('Allsebrook_Lecture_Theatre_2'); // Replace with your object's name
        if (specificObject) {
            // Locate the object by setting its position
            // specificObject.position.set(1, 2, 3); // Set to desired coordinates
            console.log('Located Object:', specificObject.name, specificObject.position);
            // scene.remove(specificObject.name);
        } else {
            console.warn('Object with the specified name not found.');
        }

    }, undefined, function(error) {
        console.error(`Error loading model ${name}:`, error);
    });
}

function addUser() {
    const userGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const userMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    user = new THREE.Mesh(userGeometry, userMaterial);
    user.position.set(1, 2, 3);
    scene.add(user);
    
    // Set the initial camera positions
    thirdPersonCamera.position.set(user.position.x - 5, user.position.y + 2, user.position.z);
    thirdPersonCamera.lookAt(user.position);
    
    camera = thirdPersonCamera; // Set the default camera to third-person
}

function removeModel(name) {
    if (models[name] && scene.children.includes(models[name])) {
        scene.remove(models[name]);
        activeModels.delete(name);
    }
}

function updateModels(year) {
    activeModels.forEach(model => scene.remove(models[model]));
    activeModels.clear();
    modelList[year].forEach(modelInfo => {
        const modelName = modelInfo.name;
        if (models[modelName]) {
            scene.add(models[modelName]);
            activeModels.add(modelName);
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
            userDirection.set(-moveSpeed, 0, 0); // Left (move along the X-axis)
            break;
        case 'ArrowRight':
            userDirection.set(moveSpeed, 0, 0); // Right (move along the X-axis)
            break;
        case ' ':
            toggleCamera(); // Toggle camera view on spacebar press
            updateYearLabel(); // Update the year label to reflect camera change
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
    if (currentCamera === 'thirdPerson') {
        currentCamera = 'birdEye';
    } else if (currentCamera === 'birdEye') {
        currentCamera = 'orbit';
    } else {
        currentCamera = 'thirdPerson';
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    // Update user movement
    user.translateZ(userDirection.z);
    user.position.x += userDirection.x; // Move the user left/right

    // Update camera positions based on the current camera
    if (currentCamera === 'thirdPerson') {
        // Update third-person camera position
        thirdPersonCamera.position.set(
            user.position.x - Math.sin(user.rotation.y) * 5,
            user.position.y + 2,
            user.position.z - Math.cos(user.rotation.y) * 5
        );
        thirdPersonCamera.lookAt(user.position);
        camera = thirdPersonCamera;
    } else if (currentCamera === 'birdEye') {
        // Bird-eye camera follows the user
        droneCamera.position.x = user.position.x;
        droneCamera.position.z = user.position.z;
        droneCamera.position.y = 50; // Keep bird-eye camera above the scene
        droneCamera.lookAt(user.position);
        camera = droneCamera;
    } else if (currentCamera === 'orbit') {
        // Orbit camera remains independent
        camera = orbitCamera;
        scene.userData.orbitControls.update(); // Update OrbitControls
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    // Update all cameras' aspect ratios
    [thirdPersonCamera, droneCamera, orbitCamera].forEach(cam => {
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.updateProjectionMatrix();
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
