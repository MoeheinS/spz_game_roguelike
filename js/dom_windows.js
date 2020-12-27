function dragElement(elem) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (elem.querySelector('.window__title')) {
    /* if present, the title is where you move the DIV from:*/
    elem.querySelector('.window__title').onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elem.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    document.querySelector('.container__windows').appendChild(e.target.parentNode);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elem.style.top = (elem.offsetTop - pos2) + "px";
    elem.style.left = (elem.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

for( let d of document.querySelectorAll('.draggable') ){
  dragElement(d);
}

function createWindow() {
  let template = document.querySelector('#template__window');
  let clone = template.content.firstElementChild.cloneNode(true);//.querySelector('.draggable');
      clone.id = `w${document.querySelectorAll('.draggable').length+1}`;
  document.querySelector('.container__windows').appendChild(clone);
  for( let d of document.querySelectorAll('.draggable') ){
    dragElement(d);
  }
}