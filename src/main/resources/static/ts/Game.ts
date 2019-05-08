import {Renderer} from 'Renderer';
import {RenderObject} from 'RenderObject';
import {Animation} from 'Animation';
import {PhysicsState} from 'Physics';
import {GameObject} from 'GameObject';
import {EventBuffer, GameEvent, KeyboardInputEvent, KeyDownInputEvent, KeyPressedInputEvent} from './Events';
import {rand, requestAnimFrame} from "./util";
import {EventBufferTranslator, KeyboardInputEventTranslator} from "./EventTranslators";
import {Rect, Vector} from "./Core";
import {UIBar, UIText} from "./UI";
import {Camera, Consumable, Player, Room, Solid} from "./GameObjects";

export class Game {
    private gameCanvas: HTMLCanvasElement;
    private uiCanvas: HTMLCanvasElement;
    private resources: Map<string, HTMLImageElement>;
    private lastTick: number;
    private readonly renderer: Renderer;
    private readonly uiRenderer: Renderer;
    private readonly eventsBuffer: Map<string, KeyboardInputEvent>;
    private readonly world: GameObject;
    private readonly camera: Camera;
    private readonly ui: GameObject;
    private readonly gridSquareSize = 40;
    private readonly gravityForce = 33 * this.gridSquareSize;
    private readonly itemChance = 0.16;
    private readonly worldWidth = 40;
    private readonly worldHeight = 30;
    private readonly damageVelocityThreshold = 22.5 * this.gridSquareSize;
    private readonly damageVelocityMultiplier = 0.4 / this.gridSquareSize;
    private readonly speed = 7.8 * this.gridSquareSize;
    private readonly jumpSpeed = 15 * this.gridSquareSize;
    private readonly consumablePowerSpeedBoost = 0.06 * this.gridSquareSize;
    private readonly consumablePowerJumpSpeedBoost = 0.06 * this.gridSquareSize;
    private deathText: UIText;
    private winText: UIText;
    private healthBarHolder: GameObject;
    private healthBar: UIBar;
    private powerBarHolder: GameObject;
    private powerBar: UIBar;
    private readonly socketUrl: string;
    private player: Player;
    private debugText: UIText;
    private readonly inputEventBufferTranslator: EventBufferTranslator<KeyboardInputEvent, GameEvent>;

    constructor(gameCanvas: HTMLCanvasElement,
                uiCanvas: HTMLCanvasElement,
                resources: Map<string, HTMLImageElement>,
                socketUrl: string
    ) {
        this.gameCanvas = gameCanvas;
        this.uiCanvas = uiCanvas;
        this.resources = resources;
        this.socketUrl = socketUrl;

        PhysicsState.gravityForce = this.gravityForce;

        this.renderer = new Renderer(gameCanvas);
        this.uiRenderer = new Renderer(uiCanvas);
        this.eventsBuffer = new Map();
        this.lastTick = 0;
        this.world = new GameObject(null, new Rect(0, 0, this.worldWidth * this.gridSquareSize, this.worldHeight * this.gridSquareSize));
        this.camera = new Camera(this.world, new Rect(0, 0, this.renderer.size.width, this.renderer.size.height));
        this.ui = new GameObject(null, new Rect(0, 0, this.renderer.size.width, this.renderer.size.height));

        this.inputEventBufferTranslator = new EventBufferTranslator(new KeyboardInputEventTranslator());
    }

    createWorld() {
        const player = new Player(this.world, new Rect(
            0,
            this.world.frame.height / 4,
            this.gridSquareSize,
            2 * this.gridSquareSize));
        this.player = player;
        player.speed = this.speed;
        player.jumpSpeed = this.jumpSpeed;
        player.idleAnimation = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("idle")!));
        player.moveAnimationRight = Animation.withSpeedAndImage(1 / 15, this.resources.get("move")!, 40, 80, 6);
        player.moveAnimationLeft = Animation.withSpeedAndImage(1 / 15, this.resources.get("move_l")!, 40, 80, 6);
        player.moveAnimation = player.moveAnimationRight;
        player.jumpAnimation = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("jump")!));
        player.crouchAnimationRight = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch")!));
        player.crouchAnimationLeft = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch_l")!));
        player.crouchAnimation = player.crouchAnimationRight;
        player.crouchMoveAnimationRight = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch")!));
        player.crouchMoveAnimationLeft = Animation.withSingleRenderObject(RenderObject.fromImage(this.resources.get("crouch_l")!));
        player.crouchMoveAnimation = player.crouchMoveAnimationRight;
        player.animation = player.idleAnimation;
        player.addChild(this.camera);

        const room = new Room(this.world, new Rect(0, 0, this.world.frame.width, this.world.frame.height), this.gridSquareSize, this.damageVelocityThreshold, this.damageVelocityMultiplier);
        room.ceiling.renderObject = RenderObject.fromColor('#000');
        room.wallLeft.renderObject = RenderObject.fromColor('#000');
        room.wallRight.renderObject = RenderObject.fromColor('#000');
        room.floor.renderObject = RenderObject.fromColor('#000');

        const count = ~~(this.worldWidth * this.worldHeight * this.itemChance);
        // var count = 0;
        let powerCount = ~~(count / 2);
        player.maxPower = powerCount;
        const x = this.worldWidth - 2;
        const y = this.worldHeight - 2;
        let rndX, rndY;
        const takenX: number[] = [];
        const takenY: number[] = [];
        for (let i = 0; i < count; i++) {
            let taken = false;
            do {
                taken = false;
                rndX = rand(0, x - 1);
                rndY = rand(0, y - 1);
                for (let j = 0; j <= i; j++) {
                    if (rndX == takenX[j] && rndY == takenY[j]) {
                        taken = true;
                        break;
                    }
                }
            } while (taken);

            takenX[i] = rndX;
            takenY[i] = rndY;

            const rect = new Rect(
                this.world.frame.width / 2 - this.gridSquareSize * 1.5 - rndX * this.gridSquareSize,
                this.world.frame.height / 2 - this.gridSquareSize * 1.5 - rndY * this.gridSquareSize,
                this.gridSquareSize,
                this.gridSquareSize);

            let gameObject;
            if (powerCount > 0) {
                gameObject = new Consumable(this.world, rect, this.consumablePowerSpeedBoost, this.consumablePowerJumpSpeedBoost);
                gameObject.renderObject = RenderObject.fromColor('#0f0');
                powerCount--;
            } else {
                gameObject = new Solid(this.world, rect, this.damageVelocityThreshold, this.damageVelocityMultiplier);
                gameObject.renderObject = RenderObject.fromImage(this.resources.get("brick")!);
            }
        }

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

        this.debugText = new UIText(this.ui, new Rect(
            0,
            -this.uiRenderer.size.height / 2 + 10,
            80, 12
        ), "DEBUG", "#080", "12px monospace");
        this.debugText.visible = false;

        player.deathText = this.deathText;
        player.winText = this.winText;
        player.healthBar = this.healthBar;
        player.powerBar = this.powerBar;
    }

    run() {
        this.createWorld();
        this.lastTick = Date.now();
        this.gameTimerTick = this.gameTimerTick.bind(this);
        this.gameTimerTick();
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

        this.world.handleEvents(this.inputEventBufferTranslator.translate(
            new EventBuffer(
                Array.from(this.eventsBuffer.values()
                )
            )))
            .processPhysics(dt)
            .detectCollisions(dt)
        ;

        requestAnimFrame(() => {
            this.gameTimerTick()
        });
    }

    keyDown(e: KeyboardEvent) {
        this.eventsBuffer.set(e.code, new KeyPressedInputEvent(Date.now(), e.code));
        this.world.handleEvents(
            this.inputEventBufferTranslator.translate(
                new EventBuffer([
                    new KeyDownInputEvent(Date.now(), e.code)
                ])
            )
        );
    }

    keyUp(e: KeyboardEvent) {
        this.eventsBuffer.delete(e.code);
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

