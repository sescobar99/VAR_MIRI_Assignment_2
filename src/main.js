import * as THREE from 'three';
import { createDisplaySurfaces, createDisplaySurfaceTargets, createDisplaySurfaceScene } from './DisplaySetup';
import { createScene, createEyeScene, createLights } from './SceneSetup';
import { enableOrbitCamera, addDragControlToObjects, setupKeyboardControls, getLeftEyePosition, getRightEyePosition } from './Controls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SCALING_FACTOR } from './Constants';
// VR
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const tempPlane = new THREE.Plane();
const tempPoint = new THREE.Vector3();
const v_intersect = new THREE.Vector3();

// Global state and Three.js objects
let renderer, scene, camera;
let displaySurfaces, displaySurfaceScene, displaySurfaceTargets;
let eyeScene;
let orbitControl;
let showScene = true;

const draggableObjects = [];
//  VR
let vrActive = false;
let VRScene;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
let raycaster;
const raycasterReach = 200 * SCALING_FACTOR;
const intersected = [];
const tempMatrix = new THREE.Matrix4();
// The three js example used group for adding elements and then interacting with them
let group;


let gazeLineL, gazeLineR;
let teapotGeometry;
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


/**
 * 
 * @param { THREE.Scene } scene
 * @param { THREE.WebGLRenderer } renderer
*/
function createVR(scene, renderer) {
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

    createLights(scene);

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
    //  VR 
    if (vrActive) {
        cleanIntersected();
    }
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

    // Update parallax lines

    if (teapotGeometry && gazeLineL && gazeLineR) {
        // Get current positions
        const eyeLPos = getLeftEyePosition(eyeScene);
        const eyeRPos = getRightEyePosition(eyeScene);
        const teapotPos = teapotGeometry.getWorldPosition(new THREE.Vector3());
        const rayL = new THREE.Ray(eyeLPos, new THREE.Vector3().subVectors(teapotPos, eyeLPos).normalize());
        const rayR = new THREE.Ray(eyeRPos, new THREE.Vector3().subVectors(teapotPos, eyeRPos).normalize());
        const endPointL = findClosestHit(rayL, displaySurfaces);
        const endPointR = findClosestHit(rayR, displaySurfaces);

        // Update the line geometries to go from eye to wall
        gazeLineL.geometry.setFromPoints([eyeLPos, endPointL]);
        gazeLineR.geometry.setFromPoints([eyeRPos, endPointR]);

        // Tell three.js the geometry has changed
        gazeLineL.geometry.computeBoundingSphere();
        gazeLineR.geometry.computeBoundingSphere();
    }

    // 4. render eyes
    renderer.render(eyeScene, camera);




    // VR
    if (vrActive) {
        renderer.render(VRScene, camera);
        intersectObjects(controller1);
        intersectObjects(controller2);

    }
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
    // group = new THREE.Group();
    // scene.add(group);
    // group.add(scene.getObjectByName("Teapot"));
    // group.add(eyeScene.getObjectByName("Head"));

    // Load a GLTF/GLB model from the models/ folder
    const loader = new GLTFLoader();
    loader.load('./models/cake_anime_model_1.glb', (gltf) => {
        const model = gltf.scene;
        model.name = "cake";
        model.position.set(-80 * SCALING_FACTOR, -30 * SCALING_FACTOR, -80 * SCALING_FACTOR);
        model.scale.set(20 * SCALING_FACTOR, 20 * SCALING_FACTOR, 20 * SCALING_FACTOR);
        scene.add(model);
    }, undefined, (err) => {
        console.error('Model load error:', err);
    });

    gazeLineL = eyeScene.getObjectByName("LineL");
    gazeLineR = eyeScene.getObjectByName("LineR");
    teapotGeometry = scene.getObjectByName("Teapot");
    orbitControl = enableOrbitCamera(camera, renderer);


    draggableObjects.push(scene.getObjectByName("Torus"));
    draggableObjects.push(scene.getObjectByName("Teapot"));
    draggableObjects.push(eyeScene.getObjectByName("Head"));
    const cake = scene.getObjectByName("cake");
    if (cake) draggableObjects.push(cake);
    // console.log(scene)
    addDragControlToObjects(camera, renderer, orbitControl, draggableObjects);

    VRScene = new THREE.Scene();
    createVR(VRScene, renderer);

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



// VR Functions WIP
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
        // Crashing on object drop
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
    //  Taken from source code of three js: ...
    // * Checks all intersection between the ray and the object with or without the descendants
    //      * @remarks Intersections are returned sorted by distance, closest first
    //      * @remarks {@link Raycaster} delegates to the {@link Object3D.raycast | raycast} method of the passed object, when evaluating whether the ray intersects the object or not
    //  ...
    // return raycaster.intersectObjects(draggableObjects, false);
    // # TODO: revisar
    return raycaster.intersectObjects(dsraggableObjects, false);
    // return raycaster.intersectObjects(group.children, false);
}

// Different from raycaster.intersectObjects
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
// VR End


function findClosestHit(ray, surfaces) {
    let max_t = -Infinity;
    let hitPoint = null;

    for (const surface of surfaces) {
        tempPlane.setFromNormalAndCoplanarPoint(surface.normal_vector, surface.origin);
        const t = ray.distanceToPlane(tempPlane);

        // Only consider hits in front of the ray (t > 0)
        if (t > 0 && t !== null && Number.isFinite(t)) {
            ray.at(t, tempPoint);

            // Check bounds
            v_intersect.subVectors(tempPoint, surface.origin);
            const proj_u = v_intersect.dot(surface.u_hat);
            const proj_v = v_intersect.dot(surface.v_hat);
            if (proj_u >= 0 && proj_v >= 0 && proj_u <= surface.u.length() && proj_v <= surface.v.length()) {
                if (t > max_t) {
                    max_t = t;
                    hitPoint = tempPoint.clone();
                }
            }
        }
    }

    if (hitPoint) {
        // hit
        const epsilon = 200;
        return ray.at(max_t + epsilon, new THREE.Vector3());
        //return hitPoint;
    } else {
        return ray.at(10000, new THREE.Vector3());
    }
}


renderer.xr.addEventListener('sessionstart', function () {
    vrActive = true;
});