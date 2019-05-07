import GameObject = require('./GameObject');
import PhysicsState = require('../PhysicsState');
import Vector = require('../Vector');
import Consumable = require('./Consumable');
import Rect = require('../Rect');
import Size = require('../Size');
import Animation = require('../Animation');
import UIBar = require('./UI/UIBar');
import UIText = require('./UI/UIText');
import Collision = require('../Collision');

export = class Player extends GameObject {
    speed: number;
    jumpSpeed: number;
    power: number;
    maxPower: number;
    jumped: boolean;
    health: number;
    dead: boolean;
    won: boolean;
    originalSize: Size;
    idleAnimation: Animation | null;
    jumpAnimation: Animation | null;
    moveAnimation: Animation | null;
    moveAnimationLeft: Animation | null;
    moveAnimationRight: Animation | null;
    crouchAnimation: Animation | null;
    crouchAnimationLeft: Animation | null;
    crouchAnimationRight: Animation | null;
    crouchMoveAnimation: Animation | null;
    crouchMoveAnimationLeft: Animation | null;
    crouchMoveAnimationRight: Animation | null;
    winText: UIText | null;
    deathText: UIText | null;
    healthBar: UIBar | null;
    powerBar: UIBar | null;
    private _crouched: boolean;

    constructor(parent: GameObject | null, frame: Rect) {
        super(parent, frame);

        this.speed = 0;
        this.jumpSpeed = 0;
        this.power = 0;
        this.maxPower = 0;
        this.jumped = false;
        this.health = 100;
        this.dead = false;
        this.won = false;
        this.originalSize = this.frame.getSize();
        this.physics = new PhysicsState(this);
        this.physics.gravity = true;
        this.physics.still = false;
        this.idleAnimation = null;
        this.jumpAnimation = null;
        this.moveAnimation = null;
        this.moveAnimationLeft = null;
        this.moveAnimationRight = null;
        this.crouchAnimation = null;
        this.crouchAnimationLeft = null;
        this.crouchAnimationRight = null;
        this.crouchMoveAnimation = null;
        this.crouchMoveAnimationLeft = null;
        this.crouchMoveAnimationRight = null;
        this.winText = null;
        this.deathText = null;
        this.healthBar = null;
        this.powerBar = null;

        this._crouched = false;

    };

    isCrouched() {
        return this._crouched;
    };

    setCrouched(crouched: boolean) {
        if (crouched && !this._crouched) {
            this._crouched = true;
            this.frame.y += Math.round(this.originalSize.height / 4);
            this.frame.height = Math.round(this.originalSize.height / 2);
        } else if (!crouched && this._crouched) {
            this._crouched = false;
            this.frame.y -= Math.round(this.originalSize.height / 4);
            this.frame.height = Math.round(this.originalSize.height);
        }
    };

    keyDown(key: string) {
        if (this.physics && key === 'KeyG') {
            this.physics.gravity = !this.physics.gravity;
            if (!this.physics.gravity) {
                this.jumped = true;
                this.physics.velocity = Vector.zero();
            }
        }
        super.keyDown(key);
        return this;
    };

    handleKeyboardState(keys: Map<string, boolean>, dt: number) {
        if (!this.dead && this.physics) {
            let sitDown = false;
            let moveLeft = false;
            let moveRight = false;
            const moveVector = Vector.zero();
            const speed = this.speed * dt;
            if (keys.get('ArrowLeft') || keys.get('KeyA')) {
                moveVector.x -= speed;
                moveLeft = true;
            }
            if (keys.get('ArrowRight') || keys.get('KeyD')) {
                moveVector.x += speed;
                moveRight = true;
            }
            if (keys.get('ArrowUp') || keys.get('KeyW') || keys.get('Space')) {
                if (!this.physics.gravity) {
                    moveVector.y -= speed;
                } else {
                    if (!this.jumped) {
                        this.physics.velocity.y -= this.jumpSpeed;
                        this.jumped = true;
                    }
                }
            }
            if (keys.get('ArrowDown') || keys.get('KeyS') || keys.get('ControlLeft')) {
                if (!this.physics.gravity)
                    moveVector.y += speed;
                else
                    sitDown = true;
            }
            this.setCrouched(sitDown);

            if (moveLeft && !moveRight) {
                this.moveAnimation = this.moveAnimationLeft;
                this.crouchAnimation = this.crouchAnimationLeft;
                this.crouchMoveAnimation = this.crouchMoveAnimationLeft;
            }
            if (moveRight && !moveLeft) {
                this.moveAnimation = this.moveAnimationRight;
                this.crouchAnimation = this.crouchAnimationRight;
                this.crouchMoveAnimation = this.crouchMoveAnimationRight;
            }

            if (!moveLeft && !moveRight && !this.jumped && !this.isCrouched())
                this.animation = this.idleAnimation;
            if (!moveLeft && !moveRight && !this.jumped && this.isCrouched())
                this.animation = this.crouchAnimation;
            if ((moveLeft || moveRight) && !this.jumped && !this.isCrouched())
                this.animation = this.moveAnimation;
            if ((moveLeft || moveRight) && !this.jumped && this.isCrouched())
                this.animation = this.crouchMoveAnimation;
            if (this.jumped && this.isCrouched())
                this.animation = this.crouchAnimation;
            if (this.jumped && !this.isCrouched())
                this.animation = this.jumpAnimation;

            this.frame.x += Math.round(moveVector.x);
            this.frame.y += Math.round(moveVector.y);
        }
        super.handleKeyboardState(keys, dt);
        return this;
    };

    handleEnterCollision(collision: Collision) {
        if (collision.collider instanceof Consumable) {
            this.power += 1;
            if (this.powerBar)
                this.powerBar.setValue(this.power / this.maxPower * 100);
            collision.collider.remove();
            this.speed += collision.collider.speedBoost;
            this.jumpSpeed += collision.collider.jumpSpeedBoost;
            if (this.power >= this.maxPower)
                this.win();
        }
    };

    handleExitCollision(collider: GameObject) {
        if (this.physics && !this.physics.colliders.length)
            this.jumped = true;
    };

    handleCollision(collision: Collision) {
        if (!this.physics) return;
        if (collision.collider.isRemoved()) return;//prevent consumable jump
        if (Math.abs(collision.collisionVector.x) > Math.abs(collision.collisionVector.y))
            if (collision.collisionVector.y > 0 && this.jumped && this.physics.gravity)
                this.jumped = false;
    };

    dealDamage(damage: number) {
        if (!this.won) {
            this.health -= damage;
            if (this.healthBar)
                this.healthBar.setValue(this.health);
            if (this.health < 0)
                this.die();
        }
    };

    die() {
        this.dead = true;
        if (this.deathText)
            this.deathText.visible = true;
    };

    win() {
        this.won = true;
        if (this.winText)
            this.winText.visible = true;
    };
}
