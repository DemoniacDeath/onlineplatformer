import {Renderer} from './Renderer';
import {Texture} from "./Texture";
import {Rect, Size, Vector} from "./Core";

export class RenderObject {
    private readonly texture: Texture;
    private readonly cachedScaledTextures: Map<string, Texture>;

    constructor(texture: Texture) {
        this.texture = texture;
        this.cachedScaledTextures = new Map();
    };

    render(renderer: Renderer,
           position: Vector,
           size: Size,
           cameraPosition: Vector,
           cameraSize: Size,
           noScaleCaching: boolean
    ) {
        if (!Rect.overlapArea(position.x, position.y, size.width, size.height, cameraPosition.x, cameraPosition.y, cameraSize.width, cameraSize.height))
            return;
        const renderPosition = new Vector(
            Math.round(position.x - size.width / 2 - cameraPosition.x + cameraSize.width / 2),
            Math.round(position.y - size.height / 2 - cameraPosition.y + cameraSize.height / 2)
        );
        const x = Math.round(renderer.size.width * (renderPosition.x / cameraSize.width));
        const y = Math.round(renderer.size.height * (renderPosition.y / cameraSize.height));
        const width = Math.round(renderer.size.width * (size.width / cameraSize.width));
        const height = Math.round(renderer.size.height * (size.height / cameraSize.height));
        const texture = noScaleCaching ? this.texture : this.getScaledTexture(width, height);
        renderer.drawImage(texture, x, y, width, height);
    };

    getScaledTexture(width: number, height: number): Texture {
        if (width == this.texture.width && height == this.texture.height)
            return this.texture;
        const scaleKey = width + ',' + height;
        if (!this.cachedScaledTextures.has(scaleKey)) {
            this.cachedScaledTextures.set(scaleKey, Renderer.cloneTexture(this.texture, width, height));
        }
        return this.cachedScaledTextures.get(scaleKey)!;
    };

    static fromColor(color: string) {
        return new RenderObject(Renderer.textureFromColor(color));
    };

    static fromImage(image: HTMLImageElement) {
        return new RenderObject(Renderer.cloneTexture(image));
    };
}
