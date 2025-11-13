import * as THREE from 'three';
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js"
/**
 * Creates and adds ambient and point lights to a scene.
 * @param {THREE.Scene} scn - The scene to add lights to.
 */
export function createLights(scn) {

    // Ambient light intensity set to 0.4
    const ambientLight = new THREE.AmbientLight(0x888888, 0.4);
    scn.add(ambientLight);

    // Point light intensity is 0.8
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.z += 200;
    scn.add(pointLight);
}

/**
 * Creates the main scene with a teapot.
 * @returns {THREE.Scene} The main scene object.
 */
export function createScene() {
    const scene = new THREE.Scene();

    const geometry = new TeapotGeometry(40, 15);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const teapot = new THREE.Mesh(geometry, material);
    teapot.name = "Teapot";
    teapot.position.z -= 70;
    scene.add(teapot);

    createLights(scene);

    return scene;
}

/**
 * Creates the head and eye spheres scene.
 * @returns {{eyeScene: THREE.Scene, eyeCenter: THREE.Vector3}} The eye scene and the center position.
 */
export function createEyeScene() {
    const IPD = 6.8;
    const eyeCenter = new THREE.Vector3(50, 20, 50);
    // eye positions relative to the head
    const eyeL = new THREE.Vector3(-IPD / 2, 10, -6);
    const eyeR = new THREE.Vector3(+IPD / 2, 10, -6);

    let eyeScene = new THREE.Scene();

    // add sphere representing head
    let geometry = new THREE.SphereGeometry(10, 32, 22);
    let material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const head = new THREE.Mesh(geometry, material);
    head.name = "Head";
    head.position.set(eyeCenter.x, eyeCenter.y, eyeCenter.z);
    eyeScene.add(head);

    // add spheres representing L/R eyes
    geometry = new THREE.SphereGeometry(3, 32, 22);
    material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    let sphere = new THREE.Mesh(geometry, material);
    sphere.name = "EyeL";
    sphere.position.set(eyeL.x, eyeL.y, eyeL.z);
    head.add(sphere);

    geometry = new THREE.SphereGeometry(3, 32, 22);
    material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    sphere = new THREE.Mesh(geometry, material);
    sphere.name = "EyeR";
    sphere.position.set(eyeR.x, eyeR.y, eyeR.z);
    head.add(sphere);

    createLights(eyeScene);

    return { eyeScene, eyeCenter };
}
