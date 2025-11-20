import * as THREE from 'three';
import { createDisplaySurfaces, createDisplaySurfaceTargets, createDisplaySurfaceScene } from './DisplaySetup';
import { createScene, createEyeScene } from './SceneSetup';
import { enableOrbitCamera, addDragControlToObjects, setupKeyboardControls, getLeftEyePosition, getRightEyePosition } from './Controls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SCALING_FACTOR } from './Constants';

const tempPlane = new THREE.Plane();
const tempPoint = new THREE.Vector3();
const v_intersect = new THREE.Vector3();

// Global state and Three.js objects
let renderer, scene, camera;
let displaySurfaces, displaySurfaceScene, displaySurfaceTargets;
let eyeScene;
let orbitControl;
let showScene = true;
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

