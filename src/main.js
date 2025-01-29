import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let scene, camera, renderer, controls, model;

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
    var temp_arr = []
    const loader = new GLTFLoader();
    loader.load('../hintze_hall.glb', function(gltf) {
        model = gltf.scene;
        temp_arr = [gltf.scene, gltf.scene]
        // for (let i = 0; i < temp_arr.length; i++) {
        //     scene.add(temp_arr[i]);
        // }
        scene.add(model);
    }, undefined, function(error) {
        console.error('Error loading model:', error);
    });
}

function removeModel() {
    if (model) {
        // console.log(temp_arr)
        // scene.remove(temp_arr.shift());
        scene.remove(model);
        model = null;
    }
}

function onKeyDown(event) {
    if (!model) return;
    const moveDistance = 0.8;
    switch(event.key) {
        case 'ArrowDown':
            model.position.z -= moveDistance;
            break;
        case 'ArrowUp':
            model.position.z += moveDistance;
            break;
        case 'ArrowRight':
            model.position.x -= moveDistance;
            break;
        case 'ArrowLeft':
            model.position.x += moveDistance;
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
