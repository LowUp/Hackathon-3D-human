import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; 

let scene, camera, droneCamera, thirdPersonCamera, renderer, terrain, user, slider, yearLabel, insetWidth, insetHeight, aspectRatio, labelRenderer, mixer, idle, walk, action_idle, action_walk, orbitCamera;
aspectRatio = window.innerWidth / window.innerHeight;

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

    let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Create third-person camera
    thirdPersonCamera = new THREE.PerspectiveCamera(105, aspectRatio, 0.1, 1000);
    
    // Create bird-eye camera (fixed above the scene)
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0); // Set initial position above the scene
    droneCamera.lookAt(0, 0, 0); // Look at the center of the scene

     // Create orbit camera
    orbitCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    orbitCamera.position.set(10, 10, 10); // Set an initial position


    
    // Initialize renderer first since it's needed for OrbitControls
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

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

    // Create Label Renderer for 2D text
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    const amblight = new THREE.AmbientLight(0xffffff, 1);
    amblight.position.set(1, 1, 1);
    scene.add(amblight);
    
    // loadMainModel('../models/bourne-final.glb');
    addUser();
    animate();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
    
    setupUI();
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
                // console.log("2025 " + modelList[2025].length)


                if (!building_list['2024'].includes(child.name)) {
                    modelList['2024'].push(child.name);
                    // console.log("2024 " + modelList[2024].length)
                }

                if (!building_list['2023'].includes(child.name)) {
                    modelList['2023'].push(child.name);
                    // console.log("2023 " + modelList[2023].length)
                }
                


                // Change position of objects
                child.position.set(Math.random(1, 10), Math.random(1, 10), Math.random(1, 10));

                // console.log(child.name, child, (building_list['2024'].includes('Allsebrook_Lecture_Theatre')))

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

    yearLabel = document.createElement('div');
    yearLabel.innerText = 'Year: 2025 | Camera: Third Person`';
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
        yearLabel.innerText = `Year: ${slider.value}`;
        updateModels(slider.value);
        updateYearLabel(); // Update the year label to reflect camera change
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
    const loader = new GLTFLoader();
    loader.load('../models/avatar.glb', function (gltf) {
        user = gltf.scene;
        user.scale.set(1, 1, 1);  // Set the scale to (1,1,1)
        user.position.set(1, 0, 3);
        scene.add(user);
        idle = gltf.animations[1];
        walk = gltf.animations[6]
        mixer = new THREE.AnimationMixer(user);
        action_walk = mixer.clipAction(walk);
        action_idle = mixer.clipAction(idle);
        // Load the default animation
        if (gltf.animations.length > 0) {
            action_idle.play();
        }

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
            // userDirection.set(-moveSpeed, 0, 0); // Left (move along the X-axis)
            break;
        case 'ArrowRight':
            user.rotation.y -= 0.1;
            // userDirection.set(moveSpeed, 0, 0); 
            break;
        case ' ':
            toggleCamera(); // Toggle camera view on spacebar press
            updateYearLabel(); 
            break;
    }
    // If the user is moving, update animation
    if (userDirection.length() > 0) {
        action_idle.stop(); 
        action_walk.play();  // Walk animation
    }
}

function onKeyUp(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {     
        userDirection.set(0, 0, 0);  // Stop moving when no arrow key is pressed
    }

    if (event.key === 'Shift') {
        isRunning = false;  // Stop running when Shift is released
    }

    // If no movement, switch to idle animation
    if (userDirection.length() === 0) {
        action_walk.stop();
        action_idle.play();
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
    updateYearLabel(); // Ensure UI updates with camera name
}

function animate() {
    requestAnimationFrame(animate);
    // user.translateZ(userDirection.z);
    // user.position.x += userDirection.x;
    if (user) {
        // Move user based on userDirection (keyboard input)
        user.translateX(userDirection.x);
        user.translateZ(userDirection.z);

        // Adjust camera position and make it follow the user
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

        if (mixer) mixer.update(0.01);
    }

    // if (currentCamera === 'thirdPerson') {
    //     thirdPersonCamera.position.set(
    //         user.position.x - Math.sin(user.rotation.y) * 5,
    //         user.position.y + 2,
    //         user.position.z - Math.cos(user.rotation.y) * 5
    //     );
    //     thirdPersonCamera.lookAt(user.position);
    //     camera = thirdPersonCamera;
    // } else {
    //     droneCamera.position.set(user.position.x, 50, user.position.z);
    //     droneCamera.lookAt(user.position);
    //     camera = droneCamera;
    // }
    
    updateLabels();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// window.addEventListener('resize', () => {
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(window.innerWidth, window.innerHeight);
// });

// init();

window.addEventListener('resize', () => {
    // Update all cameras' aspect ratios
    [thirdPersonCamera, droneCamera, orbitCamera].forEach(cam => {
        cam.aspect = window.innerWidth / window.innerHeight;
        cam.updateProjectionMatrix();
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
