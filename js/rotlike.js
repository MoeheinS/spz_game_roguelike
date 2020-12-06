console.log('sup');

// constants
const COLOR_YELLOW = '#f8b312';
const COLOR_BLUE = '#0f8897';
const COLOR_BLACK = '#130e03';
const COLOR_WHITE = '#f8f7ea';

const COLOR_RED = '#cd003b';
const COLOR_GREEN = '#b7fe27';
const COLOR_GREEN_NEON = '#d7fd12';
const COLOR_RED_PURPLE = '#d30047';
const COLOR_FUCHSIA = '#ff3993';

COLOR_FOW = '#2a2524';//'#1f1b1a';
COLOR_FILLSTYLE = COLOR_WHITE;
COLOR_WALL = COLOR_WHITE;
COLOR_WATER = COLOR_BLUE;

tileSize = {x: 24, y: 24};
// for tiled mode
SCALE_FACTOR = 3;

numTiles = 26;

game_state = {

  debug_mapper: false,
  debug_mouseCoords: {x: 0, y: 0},

  truesight: false,
  fov_enabled: false,
  scrollCamera: false,
  camera_offset: {x: 0, y: 0},
  text_mode: true,
  fontSize: {size: tileSize.y*0.75, offset: tileSize.y*0.25},

  mode: "loading",
  interact_mode: "player",
  depth: 1,
  initial_spawn: -1,
  startHP: 3,
  maxHp: 6,

  message_history: []
};

monsters = [];
spawners = [];

const fov = new Mrpas(numTiles, numTiles, (x, y) => tiles[x][y].transparent);

spritesheet = new Image();
spritesheet.src = './assets/12x16_b.png';
// spritesheet.onload = showTitle; // flowControl('title')?

document.querySelector("html").onkeydown = function(e){
  switch (game_state.mode) {
    case 'loading':
    case 'title':
      flowControl('start');
      break;
    case 'dead':
      flowControl('title');
      break;
    case 'running':
      player.inputHandler(e);
      break;
    default:
      break;
  }
  if( game_state.debug_mapper ){
    debug_painter(e);
  }
};

document.querySelector("canvas").onmousemove = function(e){
  var mouseCoord = {};
      mouseCoord.x = Math.floor(e.offsetX/tileSize.x);
      mouseCoord.y = Math.floor(e.offsetY/tileSize.y);

  if( game_state.debug_mouseCoords.x != mouseCoord.x || game_state.debug_mouseCoords.y != mouseCoord.y ){
    game_state.debug_mouseCoords.x = mouseCoord.x;
    game_state.debug_mouseCoords.y = mouseCoord.y
    //console.log(game_state.debug_mouseCoords);
  }
};
document.querySelector("canvas").onmouseup = function(e){
  console.table(getTile(game_state.debug_mouseCoords.x, game_state.debug_mouseCoords.y));
};

function setupCanvas() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  ctx.fillStyle = COLOR_FILLSTYLE;

  let resize = Math.min( window.innerWidth, window.innerHeight );
  // optional: tile to fill screen
  //numTiles = Math.floor(resize / 24);

  canvas.width = tileSize.x*numTiles;
  canvas.height = tileSize.y*numTiles;

  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  // optional: resize canvas to fill screen
  //canvas.style.width = resize+'px';
  //canvas.style.height = resize+'px';

  // https://int10h.org/oldschool-pc-fonts/fontlist/font?ibm_ega_8x14#-
  ctx.font = game_state.fontSize.size+"px ega"; //calibri
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.imageSmoothingEnabled = false;

  window.requestAnimationFrame(draw);
}

setupCanvas();

//setInterval(draw, 15);