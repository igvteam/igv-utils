import * as DOMUtils from './dom-utils.js'
import {createIcon} from "./icons.js";
import {appleCrayonPalette} from "./colorPalettes.js"
import makeDraggable from "./draggable.js"

function attachDialogCloseHandlerWithParent(parent, closeHandler) {

    var container = document.createElement("div");
    parent.appendChild(container);
    container.appendChild(createIcon("times"));
    container.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeHandler()
    });
}

function createColorSwatchSelector(container, colorHandler, defaultColors) {

    const hexColorStrings = Object.values(appleCrayonPalette);

    for (let hexColorString of hexColorStrings) {
        const swatch = DOMUtils.div({ class: 'igv-ui-color-swatch' });
        container.appendChild(swatch);
        decorateSwatch(swatch, hexColorString, colorHandler)
    }

    if (defaultColors) {
        for (let hexColorString of defaultColors) {
            const swatch = DOMUtils.div({ class: 'igv-ui-color-swatch' });
            container.appendChild(swatch);
            decorateSwatch(swatch, hexColorString, colorHandler)
        }
    }

}

const decorateSwatch = (swatch, hexColorString, colorHandler) => {

    swatch.style.backgroundColor = hexColorString;

    swatch.onmouseenter = () => swatch.style.borderColor = hexColorString;
    swatch.onmouseenter = () => swatch.style.borderColor = 'white';


    swatch.addEventListener('click', event => {
        event.stopPropagation();
        colorHandler(hexColorString);
    });

    swatch.addEventListener('touchend', event => {
        event.stopPropagation();
        colorHandler(hexColorString);
    });

}

function rgbToHex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
}



export {attachDialogCloseHandlerWithParent, createColorSwatchSelector, makeDraggable}

