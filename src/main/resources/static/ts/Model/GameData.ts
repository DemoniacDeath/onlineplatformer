function makeGameObjectData(data: {type: string}): GameObjectData {
    switch (data.type) {
        case "Room":
            return new RoomData(data);
        case "Solid":
            return new SolidData(data);
        case "Consumable":
            return new ConsumableData(data);
        case "Player":
            return new PlayerData(data);
        case "GameObject":
        default:
            return new GameObjectData(data);
    }
}

export type ClientIdData = {
    id: string;
}

export type VectorData = {
    x: number;
    y: number;
}

export type SizeData = {
    width: number;
    height: number;
}

export type RectData = {
    center: VectorData;
    size: SizeData;
}

export class PhysicsStateData {
    gravity: boolean;
    gravityForce: number;
    still: boolean;
    velocity: VectorData;
    colliders: [];
}

export class GameObjectData {
    type: string;
    children: GameObjectData[] = [];
    frame: RectData;
    removed: boolean;
    physics: PhysicsStateData | null;
    constructor(_data: {}) {
        let data = _data as GameObjectData;
        this.type = data.type;
        this.frame = data.frame;
        this.removed = data.removed;
        this.physics = data.physics;
        if (data.children) {
            for (let child of data.children) {
                this.children.push(makeGameObjectData(child));
            }
        }
    }
}

export class RoomData extends GameObjectData {
    width: number;
    damageVelocityThreshold: number;
    damageVelocityMultiplier: number;
    constructor(_data: {}) {
        super(_data);
        let data = _data as RoomData;
        this.width = data.width;
        this.damageVelocityThreshold = data.damageVelocityThreshold;
        this.damageVelocityMultiplier = data.damageVelocityMultiplier;
    }
}

export class SolidData extends GameObjectData {
    damageVelocityThreshold: number;
    damageVelocityMultiplier: number;
    constructor(_data: {}) {
        super(_data);
        let data = _data as SolidData;
        this.damageVelocityThreshold = data.damageVelocityThreshold;
        this.damageVelocityMultiplier = data.damageVelocityMultiplier;
    }
}

export class ConsumableData extends GameObjectData {
    consumablePowerSpeedBoost: number;
    consumablePowerJumpSpeedBoost: number;
    constructor(_data: {}) {
        super(_data);
        let data = _data as ConsumableData;
        this.consumablePowerSpeedBoost = data.consumablePowerSpeedBoost;
        this.consumablePowerJumpSpeedBoost = data.consumablePowerJumpSpeedBoost;
    }
}

export class PlayerData extends GameObjectData {
    clientId: ClientIdData;
    crouched: boolean;
    dead: boolean;
    health: number;
    jumpSpeed: number;
    jumped: boolean;
    maxPower: number;
    power: number;
    speed: number;
    won: boolean;
    constructor(_data: {}) {
        super(_data);
        let data = _data as PlayerData;
        this.clientId = data.clientId;
        this.crouched = data.crouched;
        this.dead = data.dead;
        this.health = data.health;
        this.jumpSpeed = data.jumpSpeed;
        this.jumped = data.jumped;
        this.maxPower = data.maxPower;
        this.power = data.power;
        this.speed = data.speed;
        this.won = data.won;
    }
}

export class GameData {
    clientId: ClientIdData;
    world: GameObjectData;
    constructor(data: {clientId: ClientIdData, world: GameObjectData}) {
        this.clientId = data.clientId as ClientIdData;
        this.world = new GameObjectData(data.world);
    }
}
