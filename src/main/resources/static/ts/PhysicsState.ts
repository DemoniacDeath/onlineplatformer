import Vector = require('./Vector');
import Rect = require('./Rect');
import Collision = require('./Collision');
import GameObject = require('./GameObjects/GameObject');

export = class PhysicsState {
    static gravityForce: number;

    gameObject: GameObject;
    gravityForce: number;
    gravity: boolean;
    still: boolean;
    colliders: GameObject[];
    velocity: Vector;

    constructor(gameObject: GameObject) {
        this.gameObject = gameObject;
        this.gravityForce = PhysicsState.gravityForce;
        this.gravity = false;
        this.still = true;
        this.colliders = [];
        this.velocity = Vector.zero();
    };

    change(dt: number) {
        if (this.gravity)
            this.velocity.y += this.gravityForce * dt;
        this.gameObject.frame.x += this.velocity.x * dt;
        this.gameObject.frame.y += this.velocity.y * dt;
        if (this.gravity) {
            // game.debugRuler(this.gameObject.frame.x, this.gameObject.frame.y, this.velocity.y/this.gravityForce*100);
            // console.log(this.velocity.y);
            // console.log(this.gameObject.frame.y);
            // console.log(dt);
        }
    };

    detectCollision(c: PhysicsState, dt: number) {
        if (this.still && c.still)
            return;//two still objects cannot collide (because we presume that they both do not move)

        let alreadyCollided = false;

        let i, len;
        i = 0;
        len = this.colliders.length;
        while (i < len) {
            if (this.colliders[i] === c.gameObject)
                alreadyCollided = true;
            i++;
        }
        if (!alreadyCollided) {
            i = 0;
            len = c.colliders.length;
            while (i < len) {
                if (c.colliders[i] === this.gameObject)
                    alreadyCollided = true;
            }
        }

        const center1 = this.gameObject.getGlobalPosition();
        const center2 = c.gameObject.getGlobalPosition();
        const overlapArea = Rect.overlapArea(
            center1.x, center1.y, this.gameObject.frame.width, this.gameObject.frame.height,
            center2.x, center2.y, c.gameObject.frame.width, c.gameObject.frame.height
        );
        if (overlapArea) {
            if (!alreadyCollided) {
                this.addCollider(c);
                this.enterCollision(c, overlapArea, dt);
            }
            this.collision(c, overlapArea, dt);
        } else if (alreadyCollided) {
            this.removeCollider(c);
            this.exitCollision(c, dt);
        }

        if (this.gameObject.isRemoved() || c.gameObject.isRemoved())
            this.removeCollider(c);
    };

    addCollider(collider: PhysicsState) {
        this.colliders.push(collider.gameObject);
        collider.colliders.push(this.gameObject);
    };

    removeCollider(collider: PhysicsState) {
        this.colliders.splice(this.colliders.indexOf(collider.gameObject), 1);
        collider.colliders.splice(this.colliders.indexOf(this.gameObject), 1);
    };

    collision(collider: PhysicsState, overlapArea: Vector, dt: number) {
        this.gameObject.handleCollision(new Collision(collider.gameObject, overlapArea), dt);
        collider.gameObject.handleCollision(new Collision(this.gameObject, overlapArea.copy().multiply(-1)), dt);
    };

    enterCollision(collider: PhysicsState, overlapArea: Vector, dt: number) {
        this.gameObject.handleEnterCollision(new Collision(collider.gameObject, overlapArea), dt);
        collider.gameObject.handleEnterCollision(new Collision(this.gameObject, overlapArea.copy().multiply(-1)), dt);
    };

    exitCollision(collider: PhysicsState, dt: number) {
        this.gameObject.handleExitCollision(collider.gameObject, dt);
        collider.gameObject.handleExitCollision(this.gameObject, dt);
    };
}