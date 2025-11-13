import * as THREE from 'three';


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
        this.normal = (this.u.cross(this.v.normalize())).normalize();
        // console.log(this.name)
        // console.log(this.normal)
    }

    // upVectorRegular = new THREE.Vector3(0, 1, 0)
    // upVectorFloor = new THREE.Vector3(0, 0, -1)
    /**
     * Creates the View Matrix for a given eye position.
     * @param {THREE.Vector3} eye - The eye position in world coordinates.
     * @returns {THREE.Matrix4} The view matrix.
     */


    viewMatrix(eye) {

        // let normal = this.u.normalize().cross(this.v.normalize())
        // let target = normal
        // console.log(normal)
        
        // let target = eye.projectOnPlane(this.normal)
        console.log(target)
        // eye.mi
        // this.nor
        var target = new THREE.Vector3(0, 0, -1);
        // const upVector = this.name == "Floor" ? this.upVectorFloor :this.upVectorRegular;
        // const upVector = this.upVectorFloor;
        const upVector = this.upVectorRegular;
        // console.log(upVector)
        var mat = new THREE.Matrix4();
        mat = mat.lookAt(eye, target, upVector); // this lookAt version creates only a rotation matrix
        var translate = new THREE.Matrix4().makeTranslation(-eye.x, -eye.y, -eye.z);
        mat = mat.multiplyMatrices(mat, translate);
        mat
        return mat;
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
