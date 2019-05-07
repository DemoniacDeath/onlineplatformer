import GameObject = require('./GameObject');
import Size = require('../Size');
import Rect = require('../Rect');

export = class Camera extends GameObject {
    originalSize: Size;

    constructor(parent: GameObject | null, frame: Rect) {
        super(parent, frame);

        this.originalSize = {width: frame.width, height: frame.height};
    };

    setSize(size: Size) {
        this.originalSize = size;
        this.frame.setSize(size);
    };

    handleKeyboardState(keys: Map<string, boolean>, dt: number) {
        if (keys.get('KeyZ')) {
            this.frame.width = this.originalSize.width * 2;
            this.frame.height = this.originalSize.height * 2;
        } else {
            this.frame.width = this.originalSize.width;
            this.frame.height = this.originalSize.height;
        }
        super.handleKeyboardState(keys, dt);
        return this;
    };
}
