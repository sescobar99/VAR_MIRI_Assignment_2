import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';


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
    orbitControl.minDistance = 120;
    orbitControl.maxDistance = 50000;
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

    controls.addEventListener('hoveron', function (event) {
        orbitControl.enabled = false;
    });
    controls.addEventListener('hoveroff', function (event) {
        orbitControl.enabled = true;
    });
    controls.addEventListener('dragstart', function (event) {
        event.object.material.emissive.set(0xaaaaaa);
    });
    controls.addEventListener('dragend', function (event) {
        event.object.material.emissive.set(0x000000);
    });
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
                // const viewL = displaySurfaces[1].viewMatrix(new THREE.Vector3(50, 20, 100));
                // const viewR = displaySurfaces[2].viewMatrix(new THREE.Vector3(50, 20, 100));
                // const viewB = displaySurfaces[3].viewMatrix(new THREE.Vector3(50, 20, 100));

                console.log("View matrices:");
                console.log("Front:");
                console.log(viewF);
                // console.log("Left:");
                // console.log(viewL);
                // console.log("Right:");
                // console.log(viewR);
                // console.log("Bottom:");
                // console.log(viewB);
                break;
        }
    });
}