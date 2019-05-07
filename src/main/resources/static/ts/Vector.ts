export = class Vector {
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
