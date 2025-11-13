import * as THREE from 'three';
import { DisplaySurface } from './DisplaySurface';
import { createLights } from './SceneSetup';

// Used internally by createDisplaySurfaceTargets()
const TEXTURE_SIZE = 1024; // texture resolution

/**
 * Creates the DisplaySurface objects representing the CAVE screens.
 * @returns {DisplaySurface[]} An array of DisplaySurface objects.
 */
export function createDisplaySurfaces() {
    // The name must be kept that way -> coupled with createDisplaySurfaceScene()
    const displaySurfaces = [];
    // FRONT SCREEN
    const frontScreen = new DisplaySurface("Front",
        new THREE.Vector3(-150.0, -150.0, -150.0),
        new THREE.Vector3(300.0, 0.0, 0.0),
        new THREE.Vector3(0.0, 300.0, 0.0));
    displaySurfaces.push(frontScreen);

    // LEFT SCREEN
    const leftScreen = new DisplaySurface("Left",
        new THREE.Vector3(-150.0, -150.0, 150.0),
        new THREE.Vector3(0.0, 0.0, -300.0),
        new THREE.Vector3(0.0, 300.0, 0.0));
    displaySurfaces.push(leftScreen);

    // to be completed by you (Right, Floor, etc.)
    // TODO: Completed

    // RIGHT SCREEN
    const rightScreen = new DisplaySurface("Right",
        new THREE.Vector3(150.0, -150.0, -150.0),
        new THREE.Vector3(0.0, 0.0, 300.0),
        new THREE.Vector3(0.0, 300.0, 0.0));
    displaySurfaces.push(rightScreen);

    // FLOOR SCREEN
    var floorScreen = new DisplaySurface("Floor",
        new THREE.Vector3(-150.0, -150.0, 150.0),
        new THREE.Vector3(300.0, 0.0, 0.0),
        new THREE.Vector3(0.0, 0.0, -300.0));
    displaySurfaces.push(floorScreen);


    return displaySurfaces;
}

/**
 * Creates WebGLRenderTargets (textures) for the display surfaces.
 * @param {DisplaySurface[]} displaySurfaces - Array of DisplaySurface objects.
 * @returns {THREE.WebGLRenderTarget[]} Array of render targets.
 */
export function createDisplaySurfaceTargets(displaySurfaces) {
    const displaySurfaceTargets = [];

    for (const v of displaySurfaces)
        displaySurfaceTargets.push(new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE));

    return displaySurfaceTargets;
}

/**
 * Creates a scene with 3D objects representing the display surfaces.
 * @param {DisplaySurface[]} displaySurfaces - Array of DisplaySurface objects.
 * @param {THREE.WebGLRenderTarget[]} displaySurfaceTargets - Array of textures for the surfaces.
 * @param {THREE.Scene} displaySurfaceScene - The scene to add surfaces to.
 */
export function createDisplaySurfaceScene(displaySurfaces, displaySurfaceTargets, displaySurfaceScene) {
    // Add display surfaces
    for (const [index, displaySurface] of displaySurfaces.entries()) {
        const origin = displaySurface.origin;
        const u = displaySurface.u;
        const v = displaySurface.v;

        const geometry = new THREE.BoxGeometry(u.length(), v.length(), 0.01);
        const material = new THREE.MeshPhongMaterial({ map: displaySurfaceTargets[index].texture });
        const cube = new THREE.Mesh(geometry, material);
        cube.name = displaySurface.name;

        // Apply rotation based on surface name
        if (displaySurface.name === "Left")
            cube.rotation.y = Math.PI / 2;

        if (displaySurface.name === "Right")
            cube.rotation.y = - Math.PI / 2;

        if (displaySurface.name === "Floor") {
            cube.rotation.x = Math.PI / 2;
            cube.rotation.z = Math.PI;

        }

        const uHalf = u.clone().multiplyScalar(0.5);
        const vHalf = v.clone().multiplyScalar(0.5);
        const center = new THREE.Vector3().addVectors(origin, uHalf);
        center.add(vHalf);
        cube.position.set(center.x, center.y, center.z);

        displaySurfaceScene.add(cube);
    }

    createLights(displaySurfaceScene);
}