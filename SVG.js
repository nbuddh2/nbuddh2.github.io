window.onload = () => {
    const svg1 = document.getElementById("rectangle");
    svg1.onclick = (evt) => {
        if (svg1.animationsPaused()) {
            svg1.unpauseAnimations();
        }
        else {
            svg1.pauseAnimations();
        }
    };
    const svg2 = document.getElementById("circle");
    svg2.onclick = (evt) => {
        if (svg2.animationsPaused()) {
            svg2.unpauseAnimations();
        }
        else {
            svg2.pauseAnimations();
        }
    };
    const svg3 = document.getElementById("star");
    svg3.onclick = (evt) => {
        if (svg3.animationsPaused()) {
            svg3.unpauseAnimations();
        }
        else {
            svg3.pauseAnimations();
        }
    };
}