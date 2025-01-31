import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, droneCamera, thirdPersonCamera, renderer, terrain, user, mixer, idle, walk, action_idle, action_walk;
let aspectRatio = window.innerWidth / window.innerHeight;
let models = {};
let activeModels = new Set();
let modelList = {
    '2025': [],
    '2024': [],
    '2023': [],
};
let userDirection = new THREE.Vector3();
let moveSpeed = 0.5; // Walking speed
let currentCamera = 'thirdPerson';

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa);

    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    thirdPersonCamera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    droneCamera = new THREE.PerspectiveCamera(90, aspectRatio, 0.01, 1000);
    droneCamera.position.set(0, 50, 0);
    droneCamera.lookAt(0, 0, 0);

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
    window.addEventListener('resize', onWindowResize);

    setupUI();
}

function loadMainModel(path) {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
        terrain = gltf.scene;
        scene.add(terrain);

        terrain.traverse(function (child) {
            if (child.isMesh) {
                modelList['2025'].push(child.name);
                if (Math.random() < 0.5) modelList['2024'].push(child.name);
                if (Math.random() < 0.3) modelList['2023'].push(child.name);
                models[child.name] = child;
            }
        });

        updateModels(2025);
    }, undefined, function (error) {
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
    switch (event.key) {
        case 'ArrowDown':
            userDirection.set(0, 0, -moveSpeed);
            break;
        case 'ArrowUp': 
            userDirection.set(0, 0, moveSpeed);
            break;
        case 'ArrowRight':
            userDirection.set(-moveSpeed, 0, 0);
            break;
        case 'ArrowLeft':
            userDirection.set(moveSpeed, 0, 0);
            break;
    }

    // If the user is moving, update animation
    if (userDirection.length() > 0) {
        action_idle.stop(); 
        action_walk.play();  // Walk animation
    }

    //updateAnimation();
}

function onKeyUp(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {     
        userDirection.set(0, 0, 0);  // Stop moving when no arrow key is pressed
    }

    // If no movement, switch to idle animation
    if (userDirection.length() === 0) {
        action_walk.stop();
        action_idle.play();
    }
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

        if (mixer) mixer.update(0.01);
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    aspectRatio = window.innerWidth / window.innerHeight;
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
