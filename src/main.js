import * as THREE from 'three';
import { createDisplaySurfaces, createDisplaySurfaceTargets, createDisplaySurfaceScene } from './DisplaySetup';
import { createScene, createEyeScene } from './SceneSetup';
import { enableOrbitCamera, addDragControlToObjects, setupKeyboardControls, getLeftEyePosition, getRightEyePosition } from './Controls';
import { SCALING_FACTOR } from './Constants';

// Global state and Three.js objects
let renderer, scene, camera;
let displaySurfaces, displaySurfaceScene, displaySurfaceTargets;
let eyeScene;
let orbitControl;
let showScene = true;

// Helper function to create the camera used for texture rendering
function cameraFromViewProj(view, proj) {
    const cam = camera.clone();
    const inv = new THREE.Matrix4();
    inv.copy(view).invert();
    // Set position and rotation from inverted view matrix
    cam.position.set(inv.elements[12], inv.elements[13], inv.elements[14]);
    cam.setRotationFromMatrix(view);
    cam.projectionMatrix = proj.clone();
    return cam;
}

/**
 * Initialize the Renderer.
 */
function createRenderer() {
    renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

/**
 * Initializes the main camera.
 */
function createCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(100 * SCALING_FACTOR, 100 * SCALING_FACTOR, 300 * SCALING_FACTOR);
    camera.lookAt(0, 0, 0);
}

// refresh function
const animate = function () {
    const gl = renderer.getContext();
    requestAnimationFrame(animate);

    // 1. render scene objects
    renderer.setClearColor(0x808080);
    renderer.clear();
    if (showScene)
        renderer.render(scene, camera);

    // 2. render scene objects onto a texture, for each target
    for (let [index, displaySurface] of displaySurfaces.entries()) {
        renderer.setRenderTarget(displaySurfaceTargets[index]);
        renderer.setClearColor(0x404040);
        renderer.clear();

        // left eye on RED channel
        gl.colorMask(1, 0, 0, 0);
        const eyeL = getLeftEyePosition(eyeScene);
        const viewL = displaySurface.viewMatrix(eyeL);
        const projL = displaySurface.projectionMatrix(eyeL, 1 * SCALING_FACTOR, 10000 * SCALING_FACTOR);
        const leftCamera = cameraFromViewProj(viewL, projL);
        renderer.render(scene, leftCamera);

        // right eye on GREEN, BLUE channels
        gl.colorMask(0, 1, 1, 0);
        const eyeR = getRightEyePosition(eyeScene);
        const viewR = displaySurface.viewMatrix(eyeR);
        const projR = displaySurface.projectionMatrix(eyeR, 1 * SCALING_FACTOR, 10000 * SCALING_FACTOR);
        const rightCamera = cameraFromViewProj(viewR, projR);
        renderer.clearDepth();
        renderer.render(scene, rightCamera);

        gl.colorMask(1, 1, 1, 0);
    }
    // restore state
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x000000);

    // 3. render display surfaces as (textured) quads
    renderer.render(displaySurfaceScene, camera);

    // 4. render eyes
    renderer.render(eyeScene, camera);



};

// --- Initialization Block ---
function init() {
    createRenderer();
    createCamera();

    displaySurfaces = createDisplaySurfaces();
    displaySurfaceTargets = createDisplaySurfaceTargets(displaySurfaces);

    displaySurfaceScene = new THREE.Scene(); // Initialize scene for surfaces
    createDisplaySurfaceScene(displaySurfaces, displaySurfaceTargets, displaySurfaceScene);

    const eyeSceneSetup = createEyeScene(); // Setup eye scene and get eyeCenter
    eyeScene = eyeSceneSetup.eyeScene;

    scene = createScene();

    orbitControl = enableOrbitCamera(camera, renderer);
    addDragControlToObjects(scene, eyeScene, camera, renderer, orbitControl);

    // Black magic to deliver the state
    setupKeyboardControls(camera, eyeScene, { get showScene() { return showScene; }, set showScene(val) { showScene = val; } }, displaySurfaces);

    // Change to allow VR
    animate();
}

init();

// Resize renderer when resizing webpage
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

