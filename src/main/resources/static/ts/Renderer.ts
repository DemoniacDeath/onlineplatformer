import {Texture} from "./RenderObject";

export class Renderer {
    private context: CanvasRenderingContext2D;
    size: { width: any; height: any };

    constructor(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d")!;
        this.size = {width: canvas.width, height: canvas.height};
    };

    clear() {
        this.context.beginPath();
        this.context.clearRect(0, 0, this.size.width, this.size.height);
    };

    drawImage(
        texture: Texture,
        x: number,
        y: number,
        width: number,
        height: number
    ) {
        if (typeof x === 'undefined') x = 0;
        if (typeof y === 'undefined') y = 0;
        if (typeof width === 'undefined') width = texture.width;
        if (typeof height === 'undefined') height = texture.height;

        this.context.drawImage(texture, 0, 0, texture.width, texture.height, x, y, width, height);
    };

    static textureFromColor(color: string): HTMLCanvasElement {
        const texture = Renderer.createTexture(1, 1);
        const ctx = texture.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return texture;
    };

    static createTexture(width: number = 0, height: number = 0): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };

    static cloneTexture(
        texture: Texture,
        width: number = 0,
        height: number = 0
    ): HTMLCanvasElement {
        if (texture instanceof HTMLImageElement) {
            if (width == 0) width = texture.width;
            if (height == 0) height = texture.height;
        }
        const newTexture = Renderer.createTexture(width, height);
        const renderer = new Renderer(newTexture);
        renderer.drawImage(texture, 0, 0, width, height);
        return newTexture;
    };
}