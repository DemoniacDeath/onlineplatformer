import {
    BaseEvent,
    CameraEvent,
    CameraEventType,
    EventBuffer,
    GameEvent,
    KeyboardInputEvent,
    KeyDownInputEvent,
    KeyPressedInputEvent,
    NetEvent,
    PlayerEvent,
    PlayerEventType,
    PlayerMovementEvent,
    PlayerMovementEventType
} from './Events';

export interface EventTranslator<F extends BaseEvent, T extends BaseEvent> {
    translate(from: F): T | null
}

export class KeyboardInputToGameEventTranslator implements EventTranslator<KeyboardInputEvent, GameEvent> {
    translate(from: KeyboardInputEvent): GameEvent | null  {
        if (from instanceof KeyDownInputEvent && from.keyCode == "KeyG")
            return new PlayerEvent(from.time, PlayerEventType.CheatGravityToggle);
        if (from instanceof KeyPressedInputEvent) {
            if (from.keyCode == "KeyZ")
                return new CameraEvent(from.time, CameraEventType.CameraZoom);
            if (
                from.keyCode == 'ArrowLeft' ||
                from.keyCode == 'KeyA'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveLeft);
            if (
                from.keyCode == 'ArrowRight' ||
                from.keyCode == 'KeyD'
            )
                return new PlayerEvent(from.time, PlayerEventType.MoveRight);
            if (
                from.keyCode == 'ArrowUp' ||
                from.keyCode == 'KeyW' ||
                from.keyCode == 'Space'
            )
                return new PlayerEvent(from.time, PlayerEventType.Jump);
            if (
                from.keyCode == 'ArrowDown' ||
                from.keyCode == 'KeyS' ||
                from.keyCode == 'ControlLeft'
            )
                return new PlayerEvent(from.time, PlayerEventType.Crouch);
        }
        return null;
    }
}

export class GameToNetEventTranslator implements EventTranslator<GameEvent, NetEvent> {
    translate(from: GameEvent): NetEvent | null {
        if (from instanceof PlayerEvent) {
            if (from.type === PlayerEventType.Idle)
                return new PlayerMovementEvent(from.time, PlayerMovementEventType.Idle);
            if (from.type === PlayerEventType.MoveLeft)
                return new PlayerMovementEvent(from.time, PlayerMovementEventType.MoveLeft);
            if (from.type === PlayerEventType.MoveRight)
                return new PlayerMovementEvent(from.time, PlayerMovementEventType.MoveRight);
            if (from.type === PlayerEventType.Jump)
                return new PlayerMovementEvent(from.time, PlayerMovementEventType.Jump);
            if (from.type === PlayerEventType.Crouch)
                return new PlayerMovementEvent(from.time, PlayerMovementEventType.Crouch);
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