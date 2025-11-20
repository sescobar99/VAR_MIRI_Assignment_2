import * as THREE from 'three';
import { TeapotGeometry } from "three/examples/jsm/geometries/TeapotGeometry.js"
import { SCALING_FACTOR } from './Constants';
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
    pointLight.position.z += 200 * SCALING_FACTOR;
    scn.add(pointLight);
}

/**
 * Creates the main scene with a teapot.
 * @returns {THREE.Scene} The main scene object.
 */
export function createScene() {
    const scene = new THREE.Scene();

    const geometry = new TeapotGeometry(40 * SCALING_FACTOR, 15);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const teapot = new THREE.Mesh(geometry, material);
    teapot.name = "Teapot";
    teapot.position.z -= 70 * SCALING_FACTOR;
    scene.add(teapot);

    const torusGeometry = new THREE.TorusGeometry(30 * SCALING_FACTOR, 10 * SCALING_FACTOR, 16, 100);
    const torus = new THREE.Mesh(torusGeometry, material.clone());
    torus.name = "Torus";
    torus.position.set(120 * SCALING_FACTOR, -30 * SCALING_FACTOR, -100 * SCALING_FACTOR);
    torus.material.color.set(0xFFE4C4);
    torus.rotation.x = Math.PI / 2;
    scene.add(torus);
    createLights(scene);

    return scene;
}

/**
 * Creates the head and eye spheres scene.
 * @returns {{eyeScene: THREE.Scene, eyeCenter: THREE.Vector3}} The eye scene and the center position.
 */
export function createEyeScene() {
    const IPD = 6.8 * SCALING_FACTOR;
    const eyeCenter = new THREE.Vector3(50 * SCALING_FACTOR, 20 * SCALING_FACTOR, 50 * SCALING_FACTOR);
    // eye positions relative to the head
    const eyeL = new THREE.Vector3(-IPD / 2, 10 * SCALING_FACTOR, -6 * SCALING_FACTOR);
    const eyeR = new THREE.Vector3(+IPD / 2, 10 * SCALING_FACTOR, -6 * SCALING_FACTOR);

    let eyeScene = new THREE.Scene();

    // add sphere representing head
    let geometry = new THREE.SphereGeometry(10 * SCALING_FACTOR, 32, 22);
    let material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
    const head = new THREE.Mesh(geometry, material);
    head.name = "Head";
    head.position.set(eyeCenter.x, eyeCenter.y, eyeCenter.z);
    eyeScene.add(head);

    // add spheres representing L/R eyes
    geometry = new THREE.SphereGeometry(3 * SCALING_FACTOR, 32, 22);
    material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    let sphere = new THREE.Mesh(geometry, material);
    sphere.name = "EyeL";
    sphere.position.set(eyeL.x, eyeL.y, eyeL.z);
    head.add(sphere);

    geometry = new THREE.SphereGeometry(3 * SCALING_FACTOR, 32, 22);
    material = new THREE.MeshPhongMaterial({ color: 0x0000ff });
    sphere = new THREE.Mesh(geometry, material);
    sphere.name = "EyeR";
    sphere.position.set(eyeR.x, eyeR.y, eyeR.z);
    head.add(sphere);

    // Create parallax lines
    const lineMaterialL = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const lineMaterialR = new THREE.LineBasicMaterial({ color: 0x0000ff });

    // Create dummy geometry to start (will be updated in animate)
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
    const lineGeoL = new THREE.BufferGeometry().setFromPoints(points);
    const lineGeoR = new THREE.BufferGeometry().setFromPoints(points);

    const gazeLineL = new THREE.Line(lineGeoL, lineMaterialL);
    gazeLineL.name = "LineL";
    const gazeLineR = new THREE.Line(lineGeoR, lineMaterialR);
    gazeLineR.name = "LineR";

    eyeScene.add(gazeLineL);
    eyeScene.add(gazeLineR);
    // ----
    createLights(eyeScene);

    return { eyeScene, eyeCenter };
}
