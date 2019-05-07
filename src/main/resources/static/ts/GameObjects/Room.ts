import GameObject = require('./GameObject');
import Solid = require('./Solid');
import Rect = require('../Rect');

export = class Room extends GameObject {
    private readonly width: number;
    ceiling: Solid;
    wallLeft: Solid;
    wallRight: Solid;
    floor: Solid;

    constructor(parent: GameObject | null,
                frame: Rect,
                width: number,
                damageVelocityThreshold: number,
                damageVelocityMultiplier: number
    ) {
        super(parent, frame);

        this.width = width;
        this.ceiling = new Solid(this, new Rect(
            0,
            -this.frame.height / 2 + this.width / 2,
            this.frame.width,
            this.width), damageVelocityThreshold, damageVelocityMultiplier);
        this.wallLeft = new Solid(this, new Rect(
            -this.frame.width / 2 + this.width / 2,
            0,
            this.width,
            this.frame.height - this.width * 2), damageVelocityThreshold, damageVelocityMultiplier);
        this.wallRight = new Solid(this, new Rect(
            this.frame.width / 2 - this.width / 2,
            0,
            this.width,
            this.frame.height - this.width * 2), damageVelocityThreshold, damageVelocityMultiplier);
        this.floor = new Solid(this, new Rect(
            0,
            this.frame.height / 2 - this.width / 2,
            this.frame.width,
            this.width), damageVelocityThreshold, damageVelocityMultiplier);
    };
}
