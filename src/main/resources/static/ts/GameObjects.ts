import {GameObject} from "./GameObject";
import {Rect, Size, Vector} from "./Core";
import {CameraEvent, CameraEventType, EventBuffer, GameEvent, PlayerEvent, PlayerEventType} from "./Events";
import {Collision, PhysicsState} from "./Physics";
import {Animation} from "./Animation";
import {UIBar, UIText} from "./UI";
import {ConsumableData, PlayerData, RoomData, SolidData} from "./Model/GameData";
import {EventBufferTranslator, FilteringTranslator} from "./EventTranslators";

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

    static deserialize(data: ConsumableData, parent: GameObject | null): Consumable {
        return new Consumable(
            parent,
            Rect.deserialize(data.frame),
            data.consumablePowerSpeedBoost,
            data.consumablePowerJumpSpeedBoost);
    }
}

export class Player extends GameObject {
    clientId: string;
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
    private _jumping: boolean = false;
    private _movingLeft: boolean = false;
    private _movingRight: boolean = false;
    private _crouching: boolean = false;
    private _crouched: boolean;
    private _playerEventBufferFilteringTranslator: EventBufferTranslator<GameEvent, PlayerEvent>;

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

        this._playerEventBufferFilteringTranslator = new EventBufferTranslator(new FilteringTranslator(PlayerEvent));
    };

    get crouched(): boolean {
        return this._crouched;
    }

    set crouched(crouched: boolean) {
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

    get crouching(): boolean {return this._crouching}
    set crouching(crouching: boolean) {
        if (this._crouching == crouching) return;
        this._crouching = crouching;
        if (this.physics && !this.physics.gravity) {
            if (crouching)
                this.physics.velocity.y += this.speed;
            else
                this.physics.velocity.y -= this.speed;
        }

        this.crouched = crouching;
        this.detectAnimation();
    }

    get jumping(): boolean {return this._jumping}
    set jumping(jumping: boolean) {
        if (this._jumping == jumping) return;
        this._jumping = jumping;
        if (this.physics) {
            if (!this.physics.gravity) {
                this.physics.velocity.y += jumping ? -this.speed : this.speed;
            } else {
                if (jumping && !this.jumped) {
                    this.physics.velocity.y -= this.jumpSpeed;
                    this.jumped = true;
                }
            }
        }
        this.detectAnimation();
    }

    get movingLeft(): boolean {return this._movingLeft}
    set movingLeft(movingLeft: boolean) {
        if (this._movingLeft == movingLeft) return;
        this._movingLeft = movingLeft;
        if (this.physics) {
            this.physics.velocity.x += movingLeft ? -this.speed : this.speed;
        }
        if (movingLeft && !this.movingRight) {
            this.moveAnimation = this.moveAnimationLeft;
            this.crouchAnimation = this.crouchAnimationLeft;
            this.crouchMoveAnimation = this.crouchMoveAnimationLeft;
        }
        this.detectAnimation();
    }

    get movingRight(): boolean {return this._movingRight}
    set movingRight(movingRight: boolean) {
        if (this._movingRight == movingRight) return;
        this._movingRight = movingRight;
        if (this.physics) {
            this.physics.velocity.x += movingRight ? this.speed : -this.speed;
        }
        if (movingRight && !this.movingLeft) {
            this.moveAnimation = this.moveAnimationRight;
            this.crouchAnimation = this.crouchAnimationRight;
            this.crouchMoveAnimation = this.crouchMoveAnimationRight;
        }
        this.detectAnimation();
    }

    detectAnimation() {
        if (!this.movingLeft && !this.movingRight && !this.jumped && !this.crouched)
            this.animation = this.idleAnimation;
        if (!this.movingLeft && !this.movingRight && !this.jumped && this.crouched)
            this.animation = this.crouchAnimation;
        if ((this.movingLeft || this.movingRight) && !this.jumped && !this.crouched)
            this.animation = this.moveAnimation;
        if ((this.movingLeft || this.movingRight) && !this.jumped && this.crouched)
            this.animation = this.crouchMoveAnimation;
        if (this.jumped && this.crouched)
            this.animation = this.crouchAnimation;
        if (this.jumped && !this.crouched)
            this.animation = this.jumpAnimation;
    }

    handleEvents(events: EventBuffer<GameEvent>) {
        let gameEvents = this._playerEventBufferFilteringTranslator.translate(events);
        if (this.physics && PlayerEvent.bufferContainsType(gameEvents, PlayerEventType.CheatGravityToggle)) {
            this.physics.gravity = !this.physics.gravity;
            if (!this.physics.gravity) {
                this.jumped = true;
                this.physics.velocity = Vector.zero();
            }
        }
        if (!this.dead && this.physics && !gameEvents.isEmpty()) {
            let playerEvents = gameEvents as EventBuffer<PlayerEvent>;
            this.physics.velocity.x = 0;
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.MoveLeftStart)) {
                this.movingLeft = true;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.MoveLeftStop)) {
                this.movingLeft = false;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.MoveRightStart)) {
                this.movingRight = true;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.MoveRightStop)) {
                this.movingRight = false;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.JumpStart)) {
                this.jumping = true;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.JumpStop)) {
                this.jumping = false;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.CrouchStart)) {
                this.crouching = true;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.CrouchStop)) {
                this.crouching = false;
            }
            if (PlayerEvent.bufferContainsType(playerEvents, PlayerEventType.Idle)) {
                this.detectAnimation();
            }
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

    static deserialize(data: PlayerData, parent: GameObject | null): Player {
        let player = new Player(parent, Rect.deserialize(data.frame));
        player.clientId = data.clientId.id;
        player.crouched = data.crouched;
        player.dead = data.dead;
        player.health = data.health;
        player.jumpSpeed = data.jumpSpeed;
        player.jumped = data.jumped;
        player.maxPower = data.maxPower;
        player.power = data.power;
        player.speed = data.speed;
        player.won = data.won;
        return player;
    }
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

    static deserialize(data: SolidData, parent: GameObject | null): Solid {
        return new Solid(
            parent,
            Rect.deserialize(data.frame),
            data.damageVelocityThreshold,
            data.damageVelocityMultiplier)
    }
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

    static deserialize(data: RoomData, parent: GameObject | null): Room {
        return new Room(
            parent,
            Rect.deserialize(data.frame),
            data.width,
            data.damageVelocityThreshold,
            data.damageVelocityMultiplier)
    }
}