import {GameObject} from "./GameObject";
import {Rect, Size, Vector} from "./Core";
import {Renderer} from "./Renderer";
import {RenderObject} from "./RenderObject";

export class UIBar extends GameObject {
    private _value: number;
    private _originalFrame: Rect;

    constructor(parent: GameObject | null, frame: Rect) {
        super(parent, frame);

        this._value = 100;
        this._originalFrame = frame.copy();

    };

    getValue() {
        return this._value;
    };

    setValue(value: number) {
        if (value > 100) value = 100;
        if (value < 0) value = 0;
        this._value = value;

        this.frame.x = this._originalFrame.x + this._originalFrame.width * ((value - 100) / 200);
        this.frame.width = this._originalFrame.width / 100 * value;
    };

    resetOriginalFrame(frame: Rect) {
        this._originalFrame = frame;
    };

    render(renderer: Renderer,
           localBasis: Vector,
           cameraPosition: Vector,
           cameraSize: Size,
           noScaleCaching: boolean = true
    ) {
        super.render(renderer, localBasis, cameraPosition, cameraSize, noScaleCaching);
        return this;
    };
}

export class UIText extends GameObject {
    private _text: string;
    private _color: string;
    private _font: string;

    get font(): string {
        return this._font;
    }

    set font(value: string) {
        this._font = value;
        this.createRenderObject()
    }

    get color(): string {
        return this._color;
    }

    set color(value: string) {
        this._color = value;
        this.createRenderObject()
    }

    get text(): string {
        return this._text;
    }

    set text(value: string) {
        this._text = value;
        this.createRenderObject()
    }

    constructor(parent: GameObject | null,
                frame: Rect,
                text: string,
                color: string,
                font: string
    ) {
        super(parent, frame);

        this._text = text;
        this._color = color;
        this._font = font;
        this.createRenderObject();
    };

    createRenderObject() {
        const texture = Renderer.createTexture(1, this.frame.height);
        const ctx = texture.getContext("2d")!;
        ctx.font = this._font;
        texture.width = ctx.measureText(this._text).width;
        this.frame.width = texture.width;
        ctx.font = this._font;
        ctx.fillStyle = this._color;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(this._text, 0, 0);
        this.renderObject = new RenderObject(texture);
    };
}