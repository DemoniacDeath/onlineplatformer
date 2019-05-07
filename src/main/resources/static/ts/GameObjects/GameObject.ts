import Vector = require('../Vector');
import Rect = require('../Rect');
import Animation = require('../Animation');
import RenderObject = require('../RenderObject');
import PhysicsState = require('../PhysicsState');
import Renderer = require('../Renderer');
import Size = require('../Size');
import Collision = require('../Collision');

export = class GameObject {
    frame: Rect;
    parent: GameObject | null;
    children: GameObject[];
    renderObject: RenderObject | null;
    physics: PhysicsState | null;
    animation: Animation | null;
    visible: boolean;
    private _removed: boolean;

    constructor(parent: GameObject | null, frame: Rect) {
        this.frame = frame;
        this.parent = parent;
        this.children = [];
        this.renderObject = null;
        this.physics = null;
        this.animation = null;
        this.visible = true;
        this._removed = false;
        if (this.parent)
            this.parent.addChild(this);
    };

    isRemoved() {
        return this._removed;
    };

    remove() {
        this._removed = true;
        if (this.parent) {
            this.parent.removeChild(this);
        }
        return this;
    };

    addChild(child: GameObject) {
        if (child.parent && child.parent != this)
            child.parent.removeChild(child);
        this.children.push(child);
        child.parent = this;
        return this;
    };

    removeChild(child: GameObject) {
        let index: number = this.children.indexOf(child);
        if (~index)
            this.children.splice(index, 1);
        console.log(index);
        return this;
    };

    getGlobalPosition(): Vector {
        if (!this.parent) {
            return this.frame.getCenter();
        } else {
            const globalPosition = this.parent.getGlobalPosition();
            return new Vector(this.frame.x + globalPosition.x, this.frame.y + globalPosition.y);
        }
    };

    animate(ticks: number) {
        if (this.animation)
            this.renderObject = this.animation.animate(ticks);
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++].animate(ticks);
        return this;
    };

    render(renderer: Renderer,
           localBasis: Vector,
           cameraPosition: Vector,
           cameraSize: Size,
           noScaleCaching: boolean = false
    ) {
        if (this.visible && this.renderObject)
            this.renderObject.render(renderer, new Vector(this.frame.x + localBasis.x, this.frame.y + localBasis.y), this.frame.getSize(), cameraPosition, cameraSize, noScaleCaching);
        const newBasis = new Vector(
            localBasis.x + this.frame.x,
            localBasis.y + this.frame.y
        );
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++].render(renderer, newBasis, cameraPosition, cameraSize);
        return this;
    };

    keyDown(key: string) {
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++].keyDown(key);
        return this;
    };

    handleKeyboardState(keys: Map<string, boolean>, dt: number) {
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++].handleKeyboardState(keys, dt);
        return this;
    };

    processPhysics(dt: number) {
        if (this.physics)
            this.physics.change(dt);
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++].processPhysics(dt);
        return this;
    };

    detectCollisions(dt: number) {
        const allColliders: GameObject[] = [];
        this._collectColliders(allColliders);

        const len = allColliders.length;
        let i = 0;
        while (i < len) {
            let j = i + 1;
            while (j < len) {
                allColliders[i].physics!.detectCollision(allColliders[j].physics!, dt);
                ++j;
            }
            ++i;
        }
        return this;
    };

    _collectColliders(allColliders: GameObject[]) {
        if (this.physics)
            allColliders.push(this);
        let i = 0;
        const len = this.children.length;
        while (i < len)
            this.children[i++]._collectColliders(allColliders);
    };

    handleCollision(collision: Collision, dt: number) {
    }

    handleEnterCollision(collision: Collision, dt: number) {
    }

    handleExitCollision(collider: GameObject, dt: number) {
    }
}
