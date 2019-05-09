import {Renderer} from 'Renderer';
import {RenderObject} from 'RenderObject';
import {Animation} from 'Animation';
import {PhysicsState} from 'Physics';
import {GameObject} from 'GameObject';
import {
    EventBuffer,
    GameEvent,
    KeyboardInputEvent,
    KeyDownInputEvent,
    KeyPressedInputEvent, KeyUpInputEvent,
    PlayerEvent,
    PlayerEventType
} from './Events';
import {requestAnimFrame} from "./util";
import {EventBufferTranslator, KeyboardInputToGameEventTranslator} from "./EventTranslators";
import {Rect, Vector} from "./Core";
import {UIBar, UIText} from "./UI";
import {Camera, Consumable, Player, Room, Solid} from "./GameObjects";
import {ConsumableData, GameData, GameObjectData, PlayerData, RoomData, SolidData} from "./Model/GameData";

class NetworkHandler {
    private webSocketConnection: WebSocket;

    constructor(private socketUrl: string) {}

    start(callbackFn: (gameData: GameData) => void) {
        this.webSocketConnection = new WebSocket(this.socketUrl);
        this.webSocketConnection.onopen = () => {

        };
        this.webSocketConnection.onmessage = (e) => {
            let gameData = new GameData(JSON.parse(e.data));
            callbackFn(gameData)
        };
    }

    public sendMessage(message: NetworkMessage) {
        this.webSocketConnection.send(message.getPayload());
    }
}

class NetworkMessage {
    constructor(public content: EventBuffer<GameEvent>) {}
    getPayload(): string {
        return JSON.stringify(this.content);
    }
}

export class Game {
    private gameCanvas: HTMLCanvasElement;
    private uiCanvas: HTMLCanvasElement;
    private resources: Map<string, HTMLImageElement>;
    private lastTick: number;
    private readonly renderer: Renderer;
    private readonly uiRenderer: Renderer;
    private readonly eventsBuffer: Map<string, KeyboardInputEvent>;
    private world: GameObject;
    private readonly camera: Camera;
    private readonly ui: GameObject;
    private deathText: UIText;
    private winText: UIText;
    private healthBarHolder: GameObject;
    private healthBar: UIBar;
    private powerBarHolder: GameObject;
    private powerBar: UIBar;
    private readonly socketUrl: string;
    private player: Player;
    private readonly inputEventBufferTranslator: EventBufferTranslator<KeyboardInputEvent, GameEvent>;
    private readonly networkHandler: NetworkHandler;
    private clientId: string;
    private debugText: UIText;

    constructor(gameCanvas: HTMLCanvasElement,
                uiCanvas: HTMLCanvasElement,
                resources: Map<string, HTMLImageElement>,
                socketUrl: string
    ) {
        this.gameCanvas = gameCanvas;
        this.uiCanvas = uiCanvas;
        this.resources = resources;
        this.socketUrl = socketUrl;

        this.renderer = new Renderer(gameCanvas);
        this.uiRenderer = new Renderer(uiCanvas);
        this.eventsBuffer = new Map();
        this.lastTick = 0;
        this.camera = new Camera(null, new Rect(0, 0, this.renderer.size.width, this.renderer.size.height));
        this.ui = new GameObject(null, new Rect(0, 0, this.renderer.size.width, this.renderer.size.height));

        this.inputEventBufferTranslator = new EventBufferTranslator(new KeyboardInputToGameEventTranslator());
        this.networkHandler = new NetworkHandler(this.socketUrl);
    }

    run() {
        this.inputEventBufferTranslator.noEventHandler = (result) => {
            result.push(new PlayerEvent(Date.now(), PlayerEventType.Idle));
            return result;
        };
        this.networkHandler.start((gameData: GameData) => {
            this.createWorld(gameData);
            this.lastTick = Date.now();
            this.gameTimerTick = this.gameTimerTick.bind(this);
            this.gameTimerTick();
        });
    }

    createWorld(gameData: GameData) {
        this.clientId = gameData.clientId.id;
        let processGameObjectChildrenData = (gameObjectData: GameObjectData, gameObject: GameObject) => {
            for (let childData of gameObjectData.children) {
                processGameObjectData(childData, gameObject);
            }
        };
        let processGameObjectData = (gameObjectData: GameObjectData, parent: GameObject | null): GameObject | null => {
            if (gameObjectData.removed) return null;
            let gameObject: GameObject;
            if (gameObjectData instanceof PlayerData) {
                let player = Player.deserialize(gameObjectData, parent);
                gameObject = player;
                if (gameObjectData.clientId.id == this.clientId) {
                    this.player = player;
                }
            } else if (gameObjectData instanceof RoomData) {
                let room = gameObject = Room.deserialize(gameObjectData, parent);
                room.ceiling.renderObject
                    = room.floor.renderObject
                    = room.wallLeft.renderObject
                    = room.wallRight.renderObject
                    = RenderObject.fromColor('#000');
            } else if (gameObjectData instanceof SolidData) {
                gameObject = Solid.deserialize(gameObjectData, parent);
                gameObject.renderObject = RenderObject.fromImage(this.resources.get("brick")!)
            } else if (gameObjectData instanceof ConsumableData) {
                gameObject = Consumable.deserialize(gameObjectData, parent);
                gameObject.renderObject = RenderObject.fromColor("#0f0");
            } else {
                gameObject = GameObject.deserialize(gameObjectData, parent);
            }
            if (gameObjectData.physics) {
                gameObject.physics = PhysicsState.deserialize(gameObjectData.physics, gameObject);
            }
            processGameObjectChildrenData(gameObjectData, gameObject);
            return gameObject;
        };
        this.world = processGameObjectData(gameData.world, null)!;
        if (!this.player) {
            throw Error("Could not initialize player");
        }
        this.player.idleAnimation = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("idle")!));
        this.player.moveAnimationRight = Animation.withSpeedAndImage(1 / 15, this.resources.get("move")!, 40, 80, 6);
        this.player.moveAnimationLeft = Animation.withSpeedAndImage(1 / 15, this.resources.get("move_l")!, 40, 80, 6);
        this.player.moveAnimation = this.player.moveAnimationRight;
        this.player.jumpAnimation = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("jump")!));
        this.player.crouchAnimationRight = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch")!));
        this.player.crouchAnimationLeft = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch_l")!));
        this.player.crouchAnimation = this.player.crouchAnimationRight;
        this.player.crouchMoveAnimationRight = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch")!));
        this.player.crouchMoveAnimationLeft = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch_l")!));
        this.player.crouchMoveAnimation = this.player.crouchMoveAnimationRight;
        this.player.animation = this.player.idleAnimation;
        this.player.addChild(this.camera);

        this.deathText = new UIText(this.ui, new Rect(0, 0, 0, 60), "You died! Game over!", '#f00', "48px monospace");
        this.deathText.visible = false;

        this.winText = new UIText(this.ui, new Rect(0, 0, 0, 60), "Congratulations! You won!", '#0f0', "48px monospace");
        this.winText.visible = false;

        this.healthBarHolder = new GameObject(this.ui, new Rect(
            -this.uiRenderer.size.width / 2 + 64,
            -this.uiRenderer.size.height / 2 + 10,
            120, 12));
        this.healthBarHolder.renderObject = RenderObject.fromColor('#000');

        this.healthBar = new UIBar(this.ui, new Rect(
            -this.uiRenderer.size.width / 2 + 64,
            -this.uiRenderer.size.height / 2 + 10,
            116, 8));
        this.healthBar.renderObject = RenderObject.fromColor('#f00');
        this.healthBar.setValue(100);

        this.powerBarHolder = new GameObject(this.ui, new Rect(
            this.uiRenderer.size.width / 2 - 64,
            -this.uiRenderer.size.height / 2 + 10,
            120, 12));
        this.powerBarHolder.renderObject = RenderObject.fromColor('#000');

        this.powerBar = new UIBar(this.ui, new Rect(
            this.uiRenderer.size.width / 2 - 64,
            -this.uiRenderer.size.height / 2 + 10,
            116, 9));
        this.powerBar.renderObject = RenderObject.fromColor('#0f0');
        this.powerBar.setValue(0);

        this.player.deathText = this.deathText;
        this.player.winText = this.winText;
        this.player.healthBar = this.healthBar;
        this.player.powerBar = this.powerBar;

        this.debugText = new UIText(this.ui, new Rect(0, 0, 0, 60), " ", '#088', "28px monospace")
    }

    gameTimerTick() {
        const ticks = Date.now();
        let dt = (ticks - this.lastTick) / 1000;
        const dtThrottle = 0.033;
        dt = (dt > dtThrottle) ? dtThrottle : dt;//prevent some freaky glitches with running out of the walls
        this.lastTick = ticks;

        this.world.animate(Animation.getTicks());

        this.renderer.clear();
        this.world.render(this.renderer, this.world.frame.getCenter(), this.camera.getGlobalPosition(), this.camera.frame.getSize());

        this.uiRenderer.clear();
        this.ui.render(this.uiRenderer, this.ui.frame.getCenter(), Vector.zero(), this.camera.originalSize);

        let gameEvents = this.inputEventBufferTranslator.translate(
            new EventBuffer(
                Array.from(this.eventsBuffer.values())
            ));
        this.world.handleEvents(gameEvents)
            .processPhysics(dt)
            .detectCollisions(dt)
        ;

        this.debugText.text = ""
            + (this.player.crouching ? "C":"")
            + (this.player.jumping ? "J":"")
            + (this.player.movingLeft ? "L":"")
            + (this.player.movingRight ? "R":"");


        requestAnimFrame(() => {
            this.gameTimerTick()
        });
    }

    keyDown(e: KeyboardEvent) {
        if (this.eventsBuffer.has("KeyPressedInputEvent: " + e.code)) return;
        this.eventsBuffer.set("KeyPressedInputEvent: " + e.code, new KeyPressedInputEvent(Date.now(), e.code));
        this.eventsBuffer.set("KeyDownInputEvent: " + e.code, new KeyDownInputEvent(Date.now(), e.code));
        let gameEvents = this.inputEventBufferTranslator.translate(
            new EventBuffer(Array.from(this.eventsBuffer.values()))
        );
        this.world.handleEvents(gameEvents);
        this.eventsBuffer.delete("KeyDownInputEvent: " + e.code);
        this.networkHandler.sendMessage(new NetworkMessage(gameEvents));
    }

    keyUp(e: KeyboardEvent) {
        if (!this.eventsBuffer.has("KeyPressedInputEvent: " + e.code)) return;
        this.eventsBuffer.delete("KeyPressedInputEvent: " + e.code);
        this.eventsBuffer.set("KeyUpInputEvent: " + e.code, new KeyUpInputEvent(Date.now(), e.code));
        let gameEvents = this.inputEventBufferTranslator.translate(
            new EventBuffer(Array.from(this.eventsBuffer.values()))
        );
        this.world.handleEvents(gameEvents);
        this.eventsBuffer.delete("KeyUpInputEvent: " + e.code);
        this.networkHandler.sendMessage(new NetworkMessage(gameEvents));
    }

    resize() {
        this.renderer.size = {width: this.gameCanvas.width, height: this.gameCanvas.height};
        this.uiRenderer.size = {width: this.uiCanvas.width, height: this.uiCanvas.height};
        this.camera.setSize(this.renderer.size);
        this.ui.frame.setSize(this.renderer.size);
        const healthBarNewCenter = new Vector(
            -this.uiRenderer.size.width / 2 + 64,
            -this.uiRenderer.size.height / 2 + 10);
        const powerBarNewCenter = new Vector(
            this.uiRenderer.size.width / 2 - 64,
            -this.uiRenderer.size.height / 2 + 10);
        this.healthBar.frame.setCenter(healthBarNewCenter);
        this.healthBarHolder.frame.setCenter(healthBarNewCenter);
        this.healthBar.resetOriginalFrame(new Rect(
            -this.uiRenderer.size.width / 2 + 64,
            -this.uiRenderer.size.height / 2 + 10,
            116, 8));
        this.healthBar.setValue(this.healthBar.getValue());
        this.powerBar.frame.setCenter(powerBarNewCenter);
        this.powerBarHolder.frame.setCenter(powerBarNewCenter);
        this.powerBar.resetOriginalFrame(new Rect(
            this.uiRenderer.size.width / 2 - 64,
            -this.uiRenderer.size.height / 2 + 10,
            116, 8));
        this.powerBar.setValue(this.powerBar.getValue());
    }
}

