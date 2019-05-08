export class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(vector: Vector): Vector {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    multiply(scalar: number): Vector {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    copy(): Vector {
        return new Vector(this.x, this.y);
    }

    static add(vector: Vector, vector2: Vector): Vector {
        return vector.copy().add(vector2);
    }

    static multiply(vector: Vector, scalar: number): Vector {
        return vector.copy().multiply(scalar);
    }

    static zero(): Vector {
        return new Vector(0, 0);
    }
}

export class Size {
    width: number;
    height: number;

    constructor(w: number, h: number) {
        this.width = w;
        this.height = h;
    }
}

export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = Math.abs(w) || 0;
        this.height = Math.abs(h) || 0;
    };

    getCenter() {
        return new Vector(this.x, this.y);
    };

    setCenter(center: Vector) {
        this.x = center.x;
        this.y = center.y;
    };

    getSize() {
        return {width: this.width, height: this.height};
    };

    setSize(size: Size) {
        this.width = size.width;
        this.height = size.height;
    };

    copy() {
        return new Rect(this.x, this.y, this.width, this.height);
    };

    static overlapArea(
        firstX: number,
        firstY: number,
        firstW: number,
        firstH: number,
        secondX: number,
        secondY: number,
        secondW: number,
        secondH: number
    ) {
        const x1 = firstX - firstW / 2;
        const x2 = secondX - secondW / 2;
        const X1 = x1 + firstW;
        const X2 = x2 + secondW;
        const y1 = firstY - firstH / 2;
        const y2 = secondY - secondH / 2;
        const Y1 = y1 + firstH;
        const Y2 = y2 + secondH;

        const diffX1 = X1 - x2;
        const diffX2 = x1 - X2;
        const diffY1 = Y1 - y2;
        const diffY2 = y1 - Y2;

        if (diffX1 > 0 &&
            diffX2 < 0 &&
            diffY1 > 0 &&
            diffY2 < 0) {
            return new Vector(
                (Math.abs(diffX1) < Math.abs(diffX2) ? diffX1 : diffX2),
                (Math.abs(diffY1) < Math.abs(diffY2) ? diffY1 : diffY2)
            );
        }
        return false;
    };
}