import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { printMatrix4 } from './utils/print.js';
import { SCALING_FACTOR } from './Constants';


/**
 * Gets the world position of the left eye.
 * @param {THREE.Scene} eyeScene - The scene containing the head/eyes.
 * @returns {THREE.Vector3} The world position of the left eye.
 */
export function getLeftEyePosition(eyeScene) {
    const eye = eyeScene.getObjectByName("EyeL");
    return eye.getWorldPosition(new THREE.Vector3());
}

/**
 * Gets the world position of the right eye.
 * @param {THREE.Scene} eyeScene - The scene containing the head/eyes.
 * @returns {THREE.Vector3} The world position of the right eye.
 */
export function getRightEyePosition(eyeScene) {
    const eye = eyeScene.getObjectByName("EyeR");
    return eye.getWorldPosition(new THREE.Vector3());
}

/**
 * Enables OrbitControls for scene navigation.
 * @param {THREE.Camera} camera - The camera to control.
 * @param {THREE.Renderer} renderer - The renderer's DOM element for event listeners.
 * @returns {OrbitControls} The OrbitControls instance.
 */
export function enableOrbitCamera(camera, renderer) {
    const orbitControl = new OrbitControls(camera, renderer.domElement);
    orbitControl.minDistance = 120 * SCALING_FACTOR;
    orbitControl.maxDistance = 50000 * SCALING_FACTOR;
    return orbitControl;
}

/**
 * Adds drag controls to the teapot and head objects.
 * @param {THREE.Scene} scene - The main scene.
 * @param {THREE.Scene} eyeScene - The head/eye scene.
 * @param {THREE.Camera} camera - The main camera.
 * @param {THREE.Renderer} renderer - The main renderer.
 * @param {OrbitControls} orbitControl - The orbit controls instance to disable/enable.
 */
export function addDragControlToObjects(scene, eyeScene, camera, renderer, orbitControl) {
    const objects = [];
    objects.push(scene.getObjectByName("Teapot"));
    objects.push(eyeScene.getObjectByName("Head"));

    const controls = new DragControls(objects, camera, renderer.domElement);

    // --- Define Named Functions for Drag Control ---
    // We define these as named functions so we can explicitly remove/re-add them later.
    function onDragStart(event) {
        orbitControl.enabled = false;
        event.object.material.emissive.set(0xaaaaaa);
    }

    function onDragEnd(event) {
        orbitControl.enabled = true;
        event.object.material.emissive.set(0x000000);
    }

    // Attach initial listeners for desktop/mobile use
    controls.addEventListener('dragstart', onDragStart);
    controls.addEventListener('dragend', onDragEnd);

}

/**
 * Sets up the keyboard event listener for CAVE controls.
 * @param {THREE.Camera} camera - The main camera.
 * @param {THREE.Scene} eyeScene - The scene containing the eyes.
 * @param {object} state - Global state object with 'showScene'.
 * @param {DisplaySurface[]} displaySurfaces - Array of DisplaySurface objects for testing.
 */
export function setupKeyboardControls(camera, eyeScene, state, displaySurfaces) {
    window.addEventListener('keydown', function (event) {
        switch (event.code) {
            case 'KeyL':
                const eyeL = getLeftEyePosition(eyeScene);
                camera.position.set(eyeL.x, eyeL.y, eyeL.z);
                break;

            case 'KeyR':
                const eyeR = getRightEyePosition(eyeScene);
                camera.position.set(eyeR.x, eyeR.y, eyeR.z);
                break;

            case 'KeyS':
                state.showScene = !state.showScene;
                break;

            case 'KeyT':
                // Test view matrices
                const viewF = displaySurfaces[0].viewMatrix(new THREE.Vector3(50, 20, 100));
                const viewL = displaySurfaces[1].viewMatrix(new THREE.Vector3(50, 20, 100));
                const viewR = displaySurfaces[2].viewMatrix(new THREE.Vector3(50, 20, 100));
                const viewFloor = displaySurfaces[3].viewMatrix(new THREE.Vector3(50, 20, 100));

                console.log("View matrices:");
                printMatrix4(viewF, "Front");
                // console.log(viewF);
                printMatrix4(viewL, "Left");
                // console.log(viewL);
                printMatrix4(viewR, "Right");
                // console.log(viewR);
                printMatrix4(viewFloor, "Floor");
                // console.log(viewFloor);
                console.log(displaySurfaces);
                // break;

                // Test projection transform 
                const debug_eye = new THREE.Vector3(50, 20, 100);
                const debug_znear = 0.1;
                const debug_zfar = 100;
                const transformF = displaySurfaces[0].projectionMatrix(debug_eye, debug_znear, debug_zfar);
                const transformL = displaySurfaces[1].projectionMatrix(debug_eye, debug_znear, debug_zfar);
                const transformR = displaySurfaces[2].projectionMatrix(debug_eye, debug_znear, debug_zfar);
                const transformFloor = displaySurfaces[3].projectionMatrix(debug_eye, debug_znear, debug_zfar);
                console.log("Transform matrices:");
                printMatrix4(transformF, "Front", 4);
                printMatrix4(transformL, "Left", 4);
                printMatrix4(transformR, "Right", 4);
                printMatrix4(transformFloor, "Floor", 4);

                break;
        }
    });
}