import $ from './igvjs/vendor/jquery-3.3.1.slim.js';
import { DomUtils } from '../node_modules/igv-ui/dist/igv-ui.js';
import {appleCrayonPalette} from "./igvjs/util/colorPalletes.js";
import IGVColor from "./igvjs/igv-color.js";

function createColorSwatchSelector($genericContainer, colorHandler, defaultColor) {

    let appleColors = Object.values(appleCrayonPalette);

    if (defaultColor && !(typeof defaultColor === 'function')) {

        // Remove 'snow' color.
        appleColors.splice(11, 1);

        // Add default color.
        appleColors.unshift(IGVColor.rgbToHex(defaultColor));
    }

    for (let color of appleColors) {

        let $swatch = $('<div>', {class: 'igv-color-swatch'});
        $genericContainer.append($swatch);

        $swatch.css('background-color', color);

        if ('white' === color) {
            // do nothing
            console.log('-');
        } else {

            $swatch.hover(() => {
                    $swatch.get(0).style.borderColor = color;
                },
                () => {
                    $swatch.get(0).style.borderColor = 'white';
                });

            $swatch.on('click.trackview', (event) => {
                event.stopPropagation();
                colorHandler(color);
            });

            $swatch.on('touchend.trackview', (event) => {
                event.stopPropagation();
                colorHandler(color);
            });

        }

    }

}

/**
 * Translate the mouse coordinates for the event to the coordinates for the given target element
 * @param e
 * @param target
 * @returns {{x: number, y: number}}
 */
function translateMouseCoordinates(e, target) {

    var $target = $(target),
        posx,
        posy;

    if (undefined === $target.offset()) {
        console.log('translateMouseCoordinates - $target.offset() is undefined.');
    }

    const coords = DomUtils.pageCoordinates(e);

    posx = coords.x - $target.offset().left;
    posy = coords.y - $target.offset().top;

    return {x: posx, y: posy}
}

export { translateMouseCoordinates, createColorSwatchSelector }

