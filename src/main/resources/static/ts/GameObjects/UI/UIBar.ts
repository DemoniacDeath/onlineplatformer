import GameObject = require('../GameObject');
import Rect = require('../../Rect');
import Renderer = require('../../Renderer');
import Vector = require('../../Vector');
import Size = require('../../Size');

export = class UIBar extends GameObject {
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
