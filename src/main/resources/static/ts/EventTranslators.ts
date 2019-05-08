import {
    CameraEvent,
    CameraEventType,
    BaseEvent,
    KeyboardInputEvent,
    KeyDownInputEvent,
    KeyPressedInputEvent,
    PlayerEvent,
    PlayerEventType, EventBuffer, GameEvent
} from './Events';

export interface EventTranslator<F extends BaseEvent, T extends BaseEvent> {
    translate(from: F): T | null
}

export class KeyboardInputEventTranslator implements EventTranslator<KeyboardInputEvent, GameEvent> {
    translate(from: BaseEvent): BaseEvent | null  {
        if (!(from instanceof KeyboardInputEvent)) return null;
        if (from instanceof KeyDownInputEvent && from.keyCode == "KeyG")
            return new PlayerEvent(Date.now(), PlayerEventType.CheatGravityToggle);
        if (from instanceof KeyPressedInputEvent) {
            if (from.keyCode == "KeyZ")
                return new CameraEvent(Date.now(), CameraEventType.CameraZoom);
            if (
                from.keyCode == 'ArrowLeft' ||
                from.keyCode == 'KeyA'
            )
                return new PlayerEvent(Date.now(), PlayerEventType.MoveLeft);
            if (
                from.keyCode == 'ArrowRight' ||
                from.keyCode == 'KeyD'
            )
                return new PlayerEvent(Date.now(), PlayerEventType.MoveRight);
            if (
                from.keyCode == 'ArrowUp' ||
                from.keyCode == 'KeyW' ||
                from.keyCode == 'Space'
            )
                return new PlayerEvent(Date.now(), PlayerEventType.Jump);
            if (
                from.keyCode == 'ArrowDown' ||
                from.keyCode == 'KeyS' ||
                from.keyCode == 'ControlLeft'
            )
                return new PlayerEvent(Date.now(), PlayerEventType.Crouch);
        }
        return null;
    }
}

export class EventBufferTranslator<F extends BaseEvent, T extends BaseEvent> {
    constructor(private _translator: EventTranslator<F, T>) {
    }

    translate(fromBuffer: EventBuffer<F>): EventBuffer<T> {
        let toBuffer = new EventBuffer<T>([]);
        for (let event of fromBuffer) {
            let translatedEvent = this._translator.translate(event);
            if (translatedEvent) {
                toBuffer.push(translatedEvent);
            }
        }
        return toBuffer
    }
}