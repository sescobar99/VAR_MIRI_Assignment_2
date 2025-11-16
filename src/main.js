import * as THREE from 'three';
import { createDisplaySurfaces, createDisplaySurfaceTargets, createDisplaySurfaceScene } from './DisplaySetup';
import { createScene, createEyeScene } from './SceneSetup';
import { enableOrbitCamera, addDragControlToObjects, setupKeyboardControls, getLeftEyePosition, getRightEyePosition } from './Controls';
import { SCALING_FACTOR } from './Constants';
// VR
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

// Global state and Three.js objects
let renderer, scene, camera;
let displaySurfaces, displaySurfaceScene, displaySurfaceTargets;
let eyeScene;
let orbitControl;
let showScene = true;

const draggableObjects = [];
//  VR
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const raycasterReach = 70 * SCALING_FACTOR;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
let controls, group;

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

    // Changes needed for this to work in vr
    renderer.xr.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));
    // Included in the dragging example
    // renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.shadowMap.enabled = true;

}


function createVR() {
    // controllers
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);
    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    // Visualization
    const controllerModelFactory = new XRControllerModelFactory();
    controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);
    controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    // Raycaster
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, - 1)]);
    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = raycasterReach;
    controller1.add(line.clone());
    controller2.add(line.clone());
    raycaster = new THREE.Raycaster();

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
    // requestAnimationFrame(animate);
    //  VR version 
    // renderer.setAnimationLoop(animate);
    // renderer.setAnimationLoop(function () {

    //     renderer.render(scene, camera);

    // });

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


    // // VR
    // cleanIntersected();

    // intersectObjects(controller1);
    // intersectObjects(controller2);
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


    draggableObjects.push(scene.getObjectByName("Teapot"));
    draggableObjects.push(eyeScene.getObjectByName("Head"));
    addDragControlToObjects(camera, renderer, orbitControl, draggableObjects);
    createVR();

    // Black magic to deliver the state
    setupKeyboardControls(camera, eyeScene, { get showScene() { return showScene; }, set showScene(val) { showScene = val; } }, displaySurfaces);

    // Change to allow VR
    // animate();
    renderer.setAnimationLoop(animate);
}

init();

// Resize renderer when resizing webpage
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});



// VR Functions
function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.b = 1;
        controller.attach(object);
        controller.userData.selected = object;
    }
}

function onSelectEnd(event) {
    const controller = event.target;
    if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        group.attach(object);
        controller.userData.selected = undefined;
    }
}

// Takes the VR controller's position and orientation, calculates the
//  direction that is being pointed, and checks which objects are being hit
// by the controller's ray
function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, - 1).applyMatrix4(tempMatrix);
    // Quede loco, en el ejemplo lo usan asi pero parece que raycaster ya viene con esto
    // y aun asi creamos nuestra propia func con el mismo nombre
    return raycaster.intersectObjects(draggableObjects, false);
}

function intersectObjects(controller) {
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;
    const line = controller.getObjectByName('line');
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);
        line.scale.z = intersection.distance;
    } else {
        line.scale.z = raycasterReach;
    }
}
function cleanIntersected() {
    while (intersected.length) {
        const object = intersected.pop();
        object.material.emissive.r = 0;
    }
}

