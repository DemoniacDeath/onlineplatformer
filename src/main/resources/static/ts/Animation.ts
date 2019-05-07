import Rect = require('./Rect');
import Renderer = require('./Renderer');
import RenderObject = require('./RenderObject');
import {Texture} from "./Texture";

export = class Animation {
    static _speedScale = 1000;
    private readonly speed: number;
    private startTick: number;
    private readonly frames: RenderObject[];

    constructor(speed: number, frames: RenderObject[], startTick: number) {
        this.speed = speed;
        this.startTick = startTick || Animation.getTicks();
        this.frames = frames || [];
    };

    animate(ticks: number) {
        if (ticks - this.startTick >= this.frames.length * this.speed * Animation._speedScale)
            this.startTick = ticks;
        const frameIndex = ~~((ticks - this.startTick) / (this.speed * Animation._speedScale));
        return this.frames[frameIndex];
    };

    static getTicks() {
        return Date.now();
    };

    static withSingleRenderObject(renderObject: RenderObject, ticks: number = 0) {
        ticks = ticks || Animation.getTicks();

        return new Animation(1, [renderObject], ticks);
    };

    static withSpeedAndTwoColors(speed: number, color1: string, color2: string, ticks: number = 0) {
        ticks = ticks || Animation.getTicks();

        return new Animation(speed, [
            RenderObject.fromColor(color1),
            RenderObject.fromColor(color2)
        ], ticks);
    };

    static withSpeedAndImage(speed: number,
                             image: Texture,
                             width: number,
                             height: number,
                             framesNumber: number,
                             ticks: number = 0
    ) {
        ticks = ticks || Animation.getTicks();

        const frames = [];
        const rect = new Rect(0, 0, width, height);

        for (let i = 0; i < framesNumber; i++) {
            const texture = Renderer.createTexture(width, height);
            const ctx = texture.getContext("2d")!;
            ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
            frames.push(new RenderObject(texture));

            rect.y = i * rect.height;
        }
        return new Animation(speed, frames, ticks);
    };
}
