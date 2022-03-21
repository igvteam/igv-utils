/**
 * Make the target element movable by clicking and dragging on the handle.  This is not a general purprose function,
 * it makes several options specific to igv dialogs, the primary one being that the
 * target is absolutely positioned in pixel coordinates

 */

import * as DOMUtils from './dom-utils.js'

let dragData;   // Its assumed we are only dragging one element at a time.

let bbox = undefined

function makeDraggable(target, handle, constraint) {
    if (constraint) {
        bbox = Object.assign({}, constraint)
    }
    handle.addEventListener('mousedown', dragStart.bind(target));
}


function dragStart(event) {

    event.stopPropagation();
    event.preventDefault();

    const pageCoords = DOMUtils.offset(this);
    const dragFunction = drag.bind(this);
    const dragEndFunction = dragEnd.bind(this);
    const computedStyle = getComputedStyle(this);
    const top = parseInt(computedStyle.top.replace("px", ""));
    const left = parseInt(computedStyle.left.replace("px", ""));

    dragData =
        {
            dragFunction: dragFunction,
            dragEndFunction: dragEndFunction,
            screenX: event.screenX,
            screenY: event.screenY,
            top: top,
            left: left
        };

    document.addEventListener('mousemove', dragFunction);
    document.addEventListener('mouseup', dragEndFunction);
    document.addEventListener('mouseleave', dragEndFunction);
    document.addEventListener('mouseexit', dragEndFunction);
}

function drag(event) {

    if (!dragData) {
        console.log("No drag data!");
        return;
    }
    event.stopPropagation();
    event.preventDefault();
    const dx = event.screenX - dragData.screenX;
    const dy = event.screenY - dragData.screenY;

    // const left = bbox ? Math.max(bbox.minX, dragData.left + dx) : dragData.left + dx
    const left = dragData.left + dx
    const  top = bbox ? Math.max(bbox.minY, dragData.top  + dy) : dragData.top  + dy

    this.style.left = `${ left }px`
    this.style.top  = `${  top }px`
}

function dragEnd(event) {

    if (!dragData) {
        console.log("No drag data!");
        return;
    }
    event.stopPropagation();
    event.preventDefault();

    const dragFunction = dragData.dragFunction;
    const dragEndFunction = dragData.dragEndFunction;
    document.removeEventListener('mousemove', dragFunction);
    document.removeEventListener('mouseup', dragEndFunction);
    document.removeEventListener('mouseleave', dragEndFunction);
    document.removeEventListener('mouseexit', dragEndFunction);
    dragData = undefined;
}

export default makeDraggable;
