import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls, model1, model2;

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
    
    loadModel();
    loadModel();
    animate();
    window.addEventListener('keydown', onKeyDown);
    
    const removeButton = document.createElement('button');
    removeButton.innerText = 'Remove Model';
    removeButton.style.position = 'absolute';
    removeButton.style.top = '10px';
    removeButton.style.left = '10px';
    document.body.appendChild(removeButton);
    removeButton.addEventListener('click', removeModel);
}

function loadModel() {
    const loader = new GLTFLoader();
    loader.load('../buildify_2.0.glb', function(gltf) {
        if (model1) {
            model2 = gltf.scene;
            scene.add(model2);
        }
        else {
            model1 = gltf.scene;
            scene.add(model1);
        }
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });
}

function removeModel() {
    if (model2) {
        scene.remove(model2);
        model2 = null;
    }
    else {
        scene.remove(model1);
        model1 = null;
    }
}

function onKeyDown(event) {
    if (!model2) return;
    const moveDistance = 0.8;
    switch(event.key) {
        case 'ArrowDown':
            model2.position.z -= moveDistance;
            break;
        case 'ArrowUp':
            model2.position.z += moveDistance;
            break;
        case 'ArrowRight':
            model2.position.x -= moveDistance;
            break;
        case 'ArrowLeft':
            model2.position.x += moveDistance;
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
