import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

let scene, camera, droneCamera, thirdPersonCamera, renderer, terrain, user, labelRenderer, mixer, idle, walk, action_idle, action_walk;
let aspectRatio = window.innerWidth / window.innerHeight;

let models = {}; // Store individual child objects from the main model
let activeModels = new Set();
let modelList = {
    '2025': [],
    '2024': [],
    '2023': [],
};

let building_list = {
    '2024': [
      'element007',
      'Block_2_17-24_2',
      'Talbot_House_1',
      'element015_1',
      'element299',
    ],
    '2023': [
      'Allsebrook_Lecture_Theatre_1',
      'Christchurch_House_2',
      'element316',
      'North_Light_Studios001_2',
      'element015_2',
      'Block_1_1-16_1',
      'element012_2',
      'element347',
      'North_Light_Studios002_1',
      'Weymouth_House_1',
      'Kimmeridge_House_2',
      'element299',
      'Sport_BU_2',
      'element154_1',
      'North_Light_Studios_1',
      'Library_(Arts_University_Bournemouth)_2',
      'element153_2',
      'element353',
      'element015_2',
      'DESIGN_&_ENGINEERING_INNOVATION_CENTRE_2'
    ]
  
};

let userDirection = new THREE.Vector3();
let moveSpeed = 0.5;
let labels = {}; // Store CSS2DObjects for labels

let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);

    // Initialize Perspective Cameras
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Create third-person camera
    thirdPersonCamera = new THREE.PerspectiveCamera(105, aspectRatio, 0.1, 1000);
    
    // Create bird-eye camera (fixed above the scene)
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0); // Set initial position above the scene
    droneCamera.lookAt(0, 0, 0); // Look at the center of the scene
    
    // Initialize WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create Label Renderer for 2D text
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    // Add Ambient Light
    const amblight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(amblight);
    
    // Load the main model
    loadMainModel('../models/bourne-final.glb');

    // Add the user avatar
    addUser();

    // Start the animation loop
    animate();

    // Add Event Listeners
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
    // Setup the UI elements
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
                // Add to modelList['2025']
                modelList['2025'].push(child.name);
                // console.log("2025 " + modelList['2025'].length)

                // Add to modelList['2024'] if not in building_list['2024']
                if (!building_list['2024'].includes(child.name)) {
                    modelList['2024'].push(child.name);
                    // console.log("2024 " + modelList['2024'].length)
                }

                // Add to modelList['2023'] if not in building_list['2023']
                if (!building_list['2023'].includes(child.name)) {
                    modelList['2023'].push(child.name);
                    // console.log("2023 " + modelList['2023'].length)
                }

                // Randomize position (optional, remove if not needed)
                child.position.set(
                    Math.random() * 10 - 5, // Random X between -5 and 5
                    0,                      // Assuming Y=0 is ground level
                    Math.random() * 10 - 5  // Random Z between -5 and 5
                );

                // Create label for each object
                createLabel(child);

                // Store the child in models dictionary
                models[child.name] = child;
            }
        });
        
        // Load initial models for the default year
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

// Updated createLabel function to position labels on the roofs
function createLabel(object) {
    // Ensure the object has a geometry to calculate the bounding box
    if (!object.geometry) return;

    // Compute the bounding box of the object
    const bbox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxY = bbox.max.y;

    // Create the label div
    const labelDiv = document.createElement('div');
    labelDiv.className = 'label';
    labelDiv.innerText = object.name;
    labelDiv.style.color = 'white';
    labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    labelDiv.style.padding = '5px';
    labelDiv.style.borderRadius = '5px';
    labelDiv.style.fontSize = '12px';
    labelDiv.style.whiteSpace = 'nowrap'; // Prevent label from wrapping

    // Create the CSS2DObject for the label
    const label = new CSS2DObject(labelDiv);

    // Position the label at the top of the building with an offset
    label.position.set(0, maxY + 2, 0); // Adjust the Y-offset as needed
    object.add(label); // Attach the label to the object

    // Store the label in the labels dictionary
    labels[object.name] = label;
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
    // Hide all currently active models
    activeModels.forEach(name => {
        if (models[name]) models[name].visible = false;
    });
    activeModels.clear();
    
    // Show models corresponding to the selected year
    modelList[year].forEach(name => {
        if (models[name]) {
            models[name].visible = true;
            labels[name].visible = true;
            activeModels.add(name);
        }
    });
    
    // Update labels' visibility
    updateLabels();
}

function updateLabels() {
    // Since labels are attached to objects, we only need to manage their visibility
    activeModels.forEach(name => {
        if (labels[name]) {
            labels[name].visible = models[name].visible;
        }
    });
}

function addUser() {
    const loader = new GLTFLoader();
    loader.load('../models/avatar.glb', function (gltf) {
        user = gltf.scene;
        user.scale.set(1, 1, 1);  // Set the scale to (1,1,1)
        user.position.set(1, 0, 3);
        scene.add(user);
        
        // Assuming the animations are correctly indexed
        idle = gltf.animations[1];
        walk = gltf.animations[6];
        mixer = new THREE.AnimationMixer(user);
        action_walk = mixer.clipAction(walk);
        action_idle = mixer.clipAction(idle);
        
        // Play the idle animation by default
        if (gltf.animations.length > 0) {
            action_idle.play();
        }

        // Initialize the third-person camera position
        thirdPersonCamera.position.set(user.position.x - 5, user.position.y + 2, user.position.z);
        thirdPersonCamera.lookAt(user.position);
        camera = thirdPersonCamera;
    }, undefined, function (error) {
        console.error('Error loading avatar:', error);
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
        case ' ':
            toggleCamera(); // Toggle camera view on spacebar press
            break;
    }
    // If the user is moving, update animation
    if (userDirection.length() > 0) {
        action_idle.stop(); 
        action_walk.play();  // Play walk animation
    }
}

function onKeyUp(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {     
        userDirection.set(0, 0, 0);  // Stop moving when no arrow key is pressed
    }

    if (event.key === 'Shift') {
        isRunning = false;  // Stop running when Shift is released (if implemented)
    }

    // If no movement, switch to idle animation
    if (userDirection.length() === 0) {
        action_walk.stop();
        action_idle.play();
    }
}

function toggleCamera() {
    currentCamera = currentCamera === 'thirdPerson' ? 'birdEye' : 'thirdPerson';
}

function animate() {
    requestAnimationFrame(animate);
    
    if (user) {
        // Move user based on userDirection (keyboard input)
        user.translateX(userDirection.x);
        user.translateZ(userDirection.z);

        // Adjust camera position and make it follow the user
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

        // Update animations
        if (mixer) mixer.update(0.01);
    }

    // Update labels' visibility based on active models
    updateLabels();

    // Render the scene with the active camera
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

init();
