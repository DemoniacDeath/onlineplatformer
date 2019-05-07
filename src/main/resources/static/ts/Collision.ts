import GameObject = require("./GameObjects/GameObject");
import Vector = require("./Vector");

export = class Collision {
    collider: GameObject;
    collisionVector: Vector;

    constructor(collider: GameObject, collisionVector: Vector) {
        this.collider = collider;
        this.collisionVector = collisionVector;
    };
}
