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

COLOR_FOW = '#1f1b1a';
COLOR_FILLSTYLE = COLOR_WHITE;
COLOR_WALL = COLOR_WHITE;
COLOR_WATER = COLOR_BLUE;

tileSize = {x: 24, y: 24};
// for tiled mode
SCALE_FACTOR = 3;

numTiles = 24;

game_state = {
  truesight: false,
  fov_enabled: false,
  scrollCamera: false,
  text_mode: true,
  fontSize: {size: tileSize.y*0.75, offset: tileSize.y*0.25},

  mode: "loading",
  depth: 1,
  initial_spawn: -1,
  startHP: 3,
  maxHp: 6
};

monsters = [];
spawners = [];

const fov = new Mrpas(numTiles, numTiles, (x, y) => tiles[x][y].passable);

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
};

function setupCanvas() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");
  ctx.fillStyle = COLOR_FILLSTYLE;

  canvas.width = tileSize.x*numTiles;
  canvas.height = tileSize.y*numTiles;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  // https://int10h.org/oldschool-pc-fonts/fontlist/font?ibm_ega_8x14#-
  ctx.font = game_state.fontSize.size+"px ega"; //calibri
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.imageSmoothingEnabled = false;

  window.requestAnimationFrame(draw);
}

setupCanvas();

//setInterval(draw, 15);