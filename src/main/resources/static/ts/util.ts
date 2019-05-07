function _d(t: any) {
    console.log(t)
}

function rand(a: number, b: number) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
const requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        function (callback: FrameRequestCallback) {
            window.setTimeout(callback, 1000 / 60);
        };
})().bind(window);

export {
    _d, rand, requestAnimFrame
}