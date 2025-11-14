import * as THREE from 'three';
// import { printMatrix4 } from './utils/print.js';

// WIP: Santiago


/**
 * @class DisplaySurface
 * Defines a single rectangular display surface in the CAVE environment.
 */
export class DisplaySurface {
    /**
     * @param {string} name - Name of the surface (e.g., "Front").
     * @param {THREE.Vector3} origin - Origin (bottom-left corner) of the surface.
     * @param {THREE.Vector3} u_vector - Vector defining the U (width) direction and magnitude.
     * @param {THREE.Vector3} v_vector - Vector defining the V (height) direction and magnitude.
     */
    constructor(name, origin, u_vector, v_vector) {
        this.name = name;
        this.origin = origin;
        this.u = u_vector;
        this.v = v_vector;
        this.u_hat = this.u.clone().normalize();
        this.v_hat = this.v.clone().normalize();

        // Workaround for Old ThreeJS API
        let normal_vector = (new THREE.Vector3().crossVectors(this.u, this.v)).normalize();
        // console.log(this.name);
        // console.log(normal_vector);
        this.normal_vector = normal_vector.addScalar(0);
        // console.log(this.normal_vector);
        this.upVector = this.v.clone().normalize();


    }

    /**
     * Creates the View Matrix for a given eye position.
     * @param {THREE.Vector3} eye - The eye position in world coordinates.
     * @returns {THREE.Matrix4} The view matrix.
     */
    viewMatrix(eye) {
        // const target = eye.clone().projectOnPlane(this.normal_vector.clone())
        // Project eye onto the display
        // - Vector from a point in the plane to eye. 
        // const vector = new THREE.Vector3().subVectors(eye.clone(), this.origin.clone());
        // - Project vector onto the normal
        // const vector_projection = this.normal_vector.clone().projectOnVector(vector.clone());

        // let rotation = new THREE.Matrix4();
        // rotation = rotation.lookAt(eye, target, this.upVector); // this lookAt version creates only a rotation matrix
        
        const rotation = new THREE.Matrix4().set(
            this.u_hat.x, this.v_hat.x, this.normal_vector.x, 0,
            this.u_hat.y, this.v_hat.y, this.normal_vector.y, 0,
            this.u_hat.z, this.v_hat.z, this.normal_vector.z, 0,
            0, 0, 0, 1
        );
        const translate = new THREE.Matrix4().makeTranslation(-eye.x, -eye.y, -eye.z);
        return new THREE.Matrix4().multiplyMatrices(rotation, translate);
    }


    /**
     * Creates the Projection Matrix for a given eye position (P).
     * @param {THREE.Vector3} eye - The eye position in world coordinates.
     * @param {number} znear - The near clipping distance.
     * @param {number} zfar - The far clipping distance.
     * @returns {THREE.Matrix4} The projection matrix.
     */
    projectionMatrix(eye, znear, zfar) {
        // to be written by you!

        var left = -1;
        var right = 1;
        var bottom = -1;
        var top = 1;
        return new THREE.Matrix4().makePerspective(left, right, top, bottom, znear, zfar);
    }
}
