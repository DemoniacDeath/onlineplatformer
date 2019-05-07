import GameObject = require('./GameObject');
import PhysicsState = require('../PhysicsState');
import Player = require('./Player');
import Rect = require('../Rect');
import Collision = require('../Collision');

export = class Solid extends GameObject {
    private readonly damageVelocityThreshold: number;
    private readonly damageVelocityMultiplier: number;

    constructor(parent: GameObject | null,
                frame: Rect,
                damageVelocityThreshold: number,
                damageVelocityMultiplier: number
    ) {
        super(parent, frame);

        this.physics = new PhysicsState(this);
        this.damageVelocityThreshold = damageVelocityThreshold;
        this.damageVelocityMultiplier = damageVelocityMultiplier;
    };

    handleEnterCollision(collision: Collision) {
        if (collision.collider instanceof Player &&
            collision.collider.physics &&
            collision.collider.physics.velocity.y > this.damageVelocityThreshold
        )
            collision.collider.dealDamage(
                Math.round(
                    Math.pow(
                        collision.collider.physics.velocity.y - this.damageVelocityThreshold / 2,
                        2) *
                    this.damageVelocityMultiplier *
                    this.damageVelocityMultiplier
                ))
            ;
    };

    handleCollision(collision: Collision) {
        if (!collision.collider.physics) return;
        if (Math.abs(collision.collisionVector.x) < Math.abs(collision.collisionVector.y)) {
            collision.collider.frame.x += collision.collisionVector.x;
            collision.collider.physics.velocity.x = 0;
        } else {
            collision.collider.frame.y += collision.collisionVector.y;
            collision.collider.physics.velocity.y = 0;
        }
    };
}
