import Game = require("Game");

type ImageResourceDefinition = { url: string, width: number, height: number }

const resources = new Map([
    ['move', <ImageResourceDefinition>{url: 'img/move.png', width: 40, height: 480}],
    ['move_l', <ImageResourceDefinition>{url: 'img/move_l.png', width: 40, height: 480}],
    ['brick', <ImageResourceDefinition>{url: 'img/brick.png', width: 40, height: 40}],
    ['crouch', <ImageResourceDefinition>{url: 'img/crouch.png', width: 40, height: 40}],
    ['crouch_l', <ImageResourceDefinition>{url: 'img/crouch_l.png', width: 40, height: 40}],
    ['idle', <ImageResourceDefinition>{url: 'img/idle.png', width: 40, height: 80}],
    ['jump', <ImageResourceDefinition>{url: 'img/jump.png', width: 40, height: 80}],
]);

const loadResources = function (
    resourceDefinitions: Map<string, ImageResourceDefinition>,
    mainCallback: ((resources: Map<string, HTMLImageElement>) => void)
) {
    const resources = new Map<string, HTMLImageElement>();
    resourceDefinitions.forEach((resourceDefinition, key) => {
        const url = resourceDefinition.url;
        const image = new Image();
        image.width = resourceDefinition.width;
        image.height = resourceDefinition.height;
        image.onload = function (key, image) {
            return function () {
                resources.set(key, image);
                if (resources.size == resourceDefinitions.size)
                    mainCallback(resources);
            };
        }(key, image);
        image.src = url;
    });
};

loadResources(resources, function (resources) {
    const gameCanvas = <HTMLCanvasElement>document.getElementById('game');
    const uiCanvas = <HTMLCanvasElement>document.getElementById('ui');
    const setCanvasSize = function (canvas: HTMLCanvasElement) {
        const style = window.getComputedStyle(canvas);
        const width = style.width || "0";
        const height = style.height || "0";
        canvas.width = ~~width.replace('px', '');
        canvas.height = ~~height.replace('px', '');
    };
    setCanvasSize(gameCanvas);
    setCanvasSize(uiCanvas);
    const game = new Game(gameCanvas, uiCanvas, resources,
        ((window.location.protocol === "https:" ? "wss:" : "ws:") +
            "//" + window.location.host + window.location.pathname + "/ws")
    );
    game.run();
    document.addEventListener("keydown", function (e) {
        game.keyDown(e);
    }, false);
    document.addEventListener("keyup", function (e) {
        game.keyUp(e);
    }, false);
    window.addEventListener("resize", function () {
        setCanvasSize(gameCanvas);
        setCanvasSize(uiCanvas);
        game.resize();
    });
});
