function dragElement(elem) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (elem.querySelector('.window__title')) {
    /* if present, the title is where you move the DIV from:*/
    elem.querySelector('.window__title__text').onmousedown = dragMouseDown;
    elem.querySelector('.draggable__after').onmousedown = resizeMouseDown;
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

    document.querySelector('.container__windows').appendChild(e.target.closest('.draggable'));
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

  // similar but for resizing
  function resizeMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeResizeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementResizeDrag;
  }

  function elementResizeDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new dimensions:
    elem.style.width = Math.max( elem.offsetWidth - pos1 , 200 ) + "px";
    elem.style.height = Math.max( elem.offsetHeight - pos2, 60 ) + "px";
  }

  function closeResizeDragElement() {
    /* stop resizing when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function toggleWindowBody(e) {
  e.closest('.draggable').classList.toggle('closedWindow');
}

function createWindow(id, title) {
  let template = document.querySelector('#template__window');
  let clone = template.content.firstElementChild.cloneNode(true);//.querySelector('.draggable');
      clone.id = id || `w${document.querySelectorAll('.draggable').length+1}`;
      clone.querySelector('.window__title__text').innerText = title || `w${document.querySelectorAll('.draggable').length+1}`;
  document.querySelector('.container__windows').appendChild(clone);
  initWindowDragging();
  return clone;
}
dom_messageWindow = createWindow('window__messages', 'Message history');
dom_characterWindow = createWindow('window__player', 'Character');

function initWindowDragging(){
  for( let d of document.querySelectorAll('.draggable') ){
    dragElement(d);
  }
}
initWindowDragging();

class Tooltip {
  constructor() {
    var el = document.querySelector('#tooltip');
     
    el.style.width = `${tileSize.x}px`;
    el.style.height = `${tileSize.y}px`;

    this.el = el;
  }

  updateDOM(tile) {
    this.el.style.top = `${tile.y * tileSize.y}px`;
    this.el.style.left = `${tile.x * tileSize.x}px`;

    let monsterInfo = false;
    if(tile.monster){
      monsterInfo = ( tile.monster.isPlayer ? 'You' : tile.monster.constructor.name );
    }

    this.el.querySelector('.tooltip__info').innerHTML = 
    `${( monsterInfo ? monsterInfo : '')}
    ${( monsterInfo ? '<hr>' : '')}
    ${tile.constructor.name}`;
  }

  resetDOM() {
    this.el.style.top = `${-tileSize.y}px`;
    this.el.style.left = `${-tileSize.x}px`;
    this.el.querySelector('.tooltip__info').innerHTML = '';
  }
}
const dom_tooltip = new Tooltip();
