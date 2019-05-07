import GameObject = require('./GameObject');
import PhysicsState = require('../PhysicsState');
import Rect = require('../Rect');

export = class Consumable extends GameObject {
    speedBoost: number;
    jumpSpeedBoost: number;

    constructor(parent: GameObject | null, frame: Rect, speedBoost: number, jumpSpeedBoost: number) {
        super(parent, frame);

        this.physics = new PhysicsState(this);

        this.speedBoost = speedBoost;
        this.jumpSpeedBoost = jumpSpeedBoost;
    };
}
