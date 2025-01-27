// Import necessary libraries
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Setup scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Load 3D Model
const loader = new GLTFLoader();
loader.load(
    '../LeePerrySmith.glb',
    (gltf) => {
        const model = gltf.scene;
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        scene.add(model);

        // Click Interactions
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        function onMouseClick(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(model.children, true);

            if (intersects.length > 0) {
                const clickedPart = intersects[0].object;
                displayInfo(clickedPart.name); // Replace with actual info retrieval
            }
        }

        window.addEventListener('click', onMouseClick);
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the model:', error);
    }
);

// Camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(0, 1, 5);
controls.update();

// Toolbar UI
const toolbar = document.createElement('div');
toolbar.style.position = 'absolute';
toolbar.style.top = '10px';
toolbar.style.left = '10px';
toolbar.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
toolbar.style.padding = '10px';
toolbar.style.borderRadius = '5px';

document.body.appendChild(toolbar);

const resetButton = document.createElement('button');
resetButton.innerText = 'Reset View';
resetButton.onclick = () => controls.reset();
toolbar.appendChild(resetButton);

const wireframeToggle = document.createElement('button');
wireframeToggle.innerText = 'Toggle Wireframe';
wireframeToggle.onclick = () => {
    scene.traverse((node) => {
        if (node.isMesh) {
            node.material.wireframe = !node.material.wireframe;
        }
    });
};
toolbar.appendChild(wireframeToggle);

// Pop-up for information
function displayInfo(partName) {
    const infoBox = document.getElementById('infoBox') || document.createElement('div');
    infoBox.id = 'infoBox';
    infoBox.style.position = 'absolute';
    infoBox.style.bottom = '10px';
    infoBox.style.left = '10px';
    infoBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoBox.style.color = 'white';
    infoBox.style.padding = '10px';
    infoBox.style.borderRadius = '5px';
    infoBox.innerHTML = `<strong>${partName}</strong>: Description about the part.`;
    document.body.appendChild(infoBox);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
