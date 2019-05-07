import Renderer = require('../../Renderer');
import RenderObject = require('../../RenderObject');
import GameObject = require('../GameObject');
import Rect = require('../../Rect');

export = class UIText extends GameObject {
    private readonly text: string;
    private readonly color: string;
    private readonly font: string;

    constructor(parent: GameObject | null,
                frame: Rect,
                text: string,
                color: string,
                font: string
    ) {
        super(parent, frame);

        this.text = text;
        this.color = color;
        this.font = font;
        this.createRenderObject();
    };

    createRenderObject() {
        const texture = Renderer.createTexture(1, this.frame.height);
        const ctx = texture.getContext("2d")!;
        ctx.font = this.font;
        texture.width = ctx.measureText(this.text).width;
        this.frame.width = texture.width;
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(this.text, 0, 0);
        this.renderObject = new RenderObject(texture);
    };
}