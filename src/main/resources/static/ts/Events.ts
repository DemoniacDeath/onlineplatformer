export abstract class BaseEvent {
    get time(): number {
        return this._time;
    }
    protected constructor(private readonly _time: number) {

    }
}

export abstract class KeyboardInputEvent extends BaseEvent {
    get keyCode(): string {
        return this._keyCode;
    }
    constructor(_time: number, private readonly _keyCode: string) {
        super(_time)
    }
}

export class KeyDownInputEvent extends KeyboardInputEvent {

}

export class KeyUpInputEvent extends KeyboardInputEvent {

}

export class KeyPressedInputEvent extends KeyboardInputEvent {

}

export abstract class GameEvent extends BaseEvent {

}

export enum CameraEventType {
    CameraZoom,
}

export class CameraEvent extends GameEvent {
    get type(): CameraEventType {
        return this._type;
    }
    constructor(_time: number, private _type: CameraEventType) {
        super(_time);
    }
}

export enum PlayerEventType {
    Idle,
    MoveLeftStart,
    MoveRightStart,
    JumpStart,
    CrouchStart,
    MoveLeftStop,
    MoveRightStop,
    JumpStop,
    CrouchStop,
    CheatGravityToggle,
}

export class PlayerEvent extends GameEvent {
    get type(): PlayerEventType {
        return this._type;
    }
    constructor(_time: number, private _type: PlayerEventType) {
        super(_time);
    }
    static bufferContainsType(events: EventBuffer<PlayerEvent>, types: PlayerEventType[] | PlayerEventType) {
        return events.contains(PlayerEvent, (e: PlayerEvent) => {
            if (types instanceof Array) {
                return !!~types.indexOf(e.type);
            } else {
                return e.type === types;
            }
        });
    }
}

export class EventBuffer<T extends BaseEvent> implements Iterable<T>{

    constructor(private _events: T[]) {
    }

    filter<R extends T> (t: Function, predicate: (event: R) => boolean): EventBuffer<R> {
        let filteredEvents: R[] = [];
        for (let i in this._events) {
            let event = this._events[i];
            if (event instanceof t &&
                predicate(event as R)
            ) filteredEvents.push(event as R);
        }
        return new EventBuffer(filteredEvents);
    }

    contains<R extends T> (t: Function, predicate: (event: R) => boolean): boolean {
        return !this.filter(t, predicate).isEmpty();
    }

    isEmpty(): boolean {
        return !this._events.length;
    }

    push(event: T) {
        this._events.push(event);
    }

    pushBuffer<R extends T>(events: EventBuffer<R>) {
        for (let event of events) {
            this.push(event)
        }
    }

    pop(): T | undefined {
        return this._events.pop();
    }

    clear() {
        this._events = [];
    }

    [Symbol.iterator](): Iterator<T> {
        return this._events[Symbol.iterator]();
    }

    forEach(func: (event: T) => void) {
        this._events.forEach(func);
    }
}