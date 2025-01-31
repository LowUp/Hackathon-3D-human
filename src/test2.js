import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, droneCamera, thirdPersonCamera, renderer, terrain, user, insetWidth, insetHeight, aspectRatio;
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

let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);

    let currentCamera = 'thirdPerson'; // Track current camera ('thirdPerson' or 'birdEye')
    
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);

    // Create third-person camera
    thirdPersonCamera = new THREE.PerspectiveCamera(155, aspectRatio, 0.1, 1000);
    
    // Create bird-eye camera (fixed above the scene)
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0); // Set initial position above the scene
    droneCamera.lookAt(0, 0, 0); // Look at the center of the scene
    
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
    // updateLabels();
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

function randomHexColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
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
            // child.material = new THREE.MeshBasicMaterial({ color: randomHexColor() });
            // child.position.set(Math.random(1000), Math.random(1000), Math.random(1000));
            // You can manipulate the child here, e.g., position, rotation, scale
            // child.position.set(1000, 2000, 3000); // Set to desired coordinates
            // chil
        }}
        );

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
            // user.rotation.y += 0.1;
            userDirection.set(-moveSpeed, 0, 0); // Left (move along the X-axis)
            break;
        case 'ArrowRight':
            // user.rotation.y -= 0.1;
            userDirection.set(moveSpeed, 0, 0); 
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

    user.position.x += userDirection.x; // Move the user left/right

    // Update camera position
    if (currentCamera === 'thirdPerson') {
        // Update third-person camera position
        thirdPersonCamera.position.set(
            user.position.x - Math.sin(user.rotation.y) * 5,
            user.position.y + 2,
            user.position.z - Math.cos(user.rotation.y) * 5
        );
        thirdPersonCamera.lookAt(user.position);
        camera = thirdPersonCamera;
    } else {
        // Bird-eye camera moves based on the user's position
        droneCamera.position.x = user.position.x;
        droneCamera.position.z = user.position.z;
        droneCamera.position.y = 50; // Keep bird-eye camera above the scene
        droneCamera.lookAt(user.position);
        camera = droneCamera;
    }
    
    // camera.position.set(
    //     user.position.x - Math.sin(user.rotation.y) * 2,
    //     user.position.y + 1,
    //     user.position.z - Math.cos(user.rotation.y) * 2
    // );
    // camera.lookAt(user.position);
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
