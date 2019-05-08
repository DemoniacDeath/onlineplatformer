import {GameObject} from "./GameObject";
import {Rect, Size, Vector} from "./Core";
import {CameraEvent, CameraEventType, EventBuffer, GameEvent, PlayerEvent, PlayerEventType} from "./Events";
import {Collision, PhysicsState} from "./Physics";
import {Animation} from "./Animation";
import {UIBar, UIText} from "./UI";

export class Camera extends GameObject {
    originalSize: Size;

    constructor(parent: GameObject | null, frame: Rect) {
        super(parent, frame);

        this.originalSize = {width: frame.width, height: frame.height};
    };

    setSize(size: Size) {
        this.originalSize = size;
        this.frame.setSize(size);
    };

    handleEvents(events: EventBuffer<GameEvent>) {
        if (events.contains(CameraEvent, (e: CameraEvent) => {return e.type == CameraEventType.CameraZoom})) {
            this.frame.width = this.originalSize.width * 2;
            this.frame.height = this.originalSize.height * 2;
        } else {
            this.frame.width = this.originalSize.width;
            this.frame.height = this.originalSize.height;
        }
        super.handleEvents(events);
        return this;
    };
}

export class Consumable extends GameObject {
    speedBoost: number;
    jumpSpeedBoost: number;

    constructor(parent: GameObject | null, frame: Rect, speedBoost: number, jumpSpeedBoost: number) {
        super(parent, frame);

        this.physics = new PhysicsState(this);

        this.speedBoost = speedBoost;
        this.jumpSpeedBoost = jumpSpeedBoost;
    };
}

export class Player extends GameObject {
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
    private _lastTick: number = 0;

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

    handleEvents(events: EventBuffer<GameEvent>) {
        const ticks = Date.now();
        let dt = this._lastTick - ticks;
        dt = Math.min(dt, 0.033);
        this._lastTick = ticks;
        if (this.physics && events.contains(PlayerEvent, (e: PlayerEvent) => {
            return e.type === PlayerEventType.CheatGravityToggle;
        })) {
            this.physics.gravity = !this.physics.gravity;
            if (!this.physics.gravity) {
                this.jumped = true;
                this.physics.velocity = Vector.zero();
            }
        }
        if (!this.dead && this.physics) {
            let sitDown = false;
            let moveLeft = false;
            let moveRight = false;
            const moveVector = Vector.zero();
            const speed = this.speed * dt;
            if (events.contains(PlayerEvent, (e: PlayerEvent) => {
                return e.type === PlayerEventType.MoveLeft
            })) {
                moveVector.x -= speed;
                moveLeft = true;
            }
            if (events.contains(PlayerEvent, (e: PlayerEvent) => {
                return e.type === PlayerEventType.MoveRight
            })) {
                moveVector.x += speed;
                moveRight = true;
            }
            if (events.contains(PlayerEvent, (e: PlayerEvent) => {
                return e.type === PlayerEventType.Jump
            })) {
                if (!this.physics.gravity) {
                    moveVector.y -= speed;
                } else {
                    if (!this.jumped) {
                        this.physics.velocity.y -= this.jumpSpeed;
                        this.jumped = true;
                    }
                }
            }
            if (events.contains(PlayerEvent, (e: PlayerEvent) => {
                return e.type === PlayerEventType.Crouch
            })) {
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
        super.handleEvents(events);
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

export class Solid extends GameObject {
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

export class Room extends GameObject {
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