import {
    BaseEvent,
    CameraEvent,
    CameraEventType,
    EventBuffer,
    GameEvent,
    KeyboardInputEvent,
    KeyDownInputEvent,
    KeyPressedInputEvent, KeyUpInputEvent,
    PlayerEvent,
    PlayerEventType
} from './Events';

export interface EventTranslator<F extends BaseEvent, T extends BaseEvent> {
    translate(from: F): T | null
}

export class KeyboardInputToGameEventTranslator implements EventTranslator<KeyboardInputEvent, GameEvent> {
    translate(from: KeyboardInputEvent): GameEvent | null  {
        if (from instanceof KeyDownInputEvent) {
            if (from.keyCode == "KeyG")
                return new PlayerEvent(from.time, PlayerEventType.CheatGravityToggle);
            if (
                from.keyCode == 'ArrowLeft' ||
                from.keyCode == 'KeyA'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveLeftStart);
            if (
                from.keyCode == 'ArrowRight' ||
                from.keyCode == 'KeyD'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveRightStart);
            if (
                from.keyCode == 'ArrowUp' ||
                from.keyCode == 'KeyW' ||
                from.keyCode == 'Space'
            )
                return new PlayerEvent(from.time, PlayerEventType.JumpStart);
            if (
                from.keyCode == 'ArrowDown' ||
                from.keyCode == 'KeyS' ||
                from.keyCode == 'ControlLeft'
            )
                return new PlayerEvent(from.time, PlayerEventType.CrouchStart);
        }
        if (from instanceof KeyUpInputEvent) {
            if (
                from.keyCode == 'ArrowLeft' ||
                from.keyCode == 'KeyA'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveLeftStop);
            if (
                from.keyCode == 'ArrowRight' ||
                from.keyCode == 'KeyD'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveRightStop);
            if (
                from.keyCode == 'ArrowUp' ||
                from.keyCode == 'KeyW' ||
                from.keyCode == 'Space'
            )
                return new PlayerEvent(from.time, PlayerEventType.JumpStop);
            if (
                from.keyCode == 'ArrowDown' ||
                from.keyCode == 'KeyS' ||
                from.keyCode == 'ControlLeft'
            )
                return new PlayerEvent(from.time, PlayerEventType.CrouchStop);
        }
        if (from instanceof KeyPressedInputEvent) {
            if (from.keyCode == "KeyZ")
                return new CameraEvent(from.time, CameraEventType.CameraZoom);
        }
        return null;
    }
}

export class FilteringTranslator<F extends GameEvent, T extends F> implements EventTranslator<F, T> {
    constructor(private type: new (...args: any[]) => T) {}
    translate(from: F): T | null {
        if (from instanceof this.type) {
            return from as T;
        }
        return null;
    }
}

export class EventBufferTranslator<F extends BaseEvent, T extends BaseEvent> {
    noEventHandler: (result: EventBuffer<T>) => EventBuffer<T>;
    get translator(): EventTranslator<F, T> {
        return this._translator;
    }

    constructor(private _translator: EventTranslator<F, T>) {}

    translate(fromBuffer: EventBuffer<F>): EventBuffer<T> {
        let toBuffer = new EventBuffer<T>([]);
        if (fromBuffer.isEmpty()) {
            if (!this.noEventHandler) return toBuffer;
            else return this.noEventHandler(toBuffer);
        }
        for (let event of fromBuffer) {
            let translatedEvent = this._translator.translate(event);
            if (translatedEvent) {
                toBuffer.push(translatedEvent);
            }
        }
        return toBuffer
    }
}