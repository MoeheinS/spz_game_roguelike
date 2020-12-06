function inBounds(x,y){
  return x>0 && y>0 && x<numTiles-1 && y<numTiles-1;
}

function getTile(x, y){
  if( inBounds(x,y) ){
		return tiles[x][y];
  }else{
		return new Wall(x,y);
  }
}

function randomPassableTile(className){
  let tile;
  tryTo('get random passable tile', function(){
    let x = randomRange(0,numTiles-1);
    let y = randomRange(0,numTiles-1);
    tile = getTile(x, y);
    return tile.passable && !tile.monster && ( className ? tile.constructor.name == className : true );
  });
  return tile;
}

function randomTile(className){
  let tile;
  tryTo('get random tile', function(){
    let x = randomRange(1,numTiles-1);
    let y = randomRange(1,numTiles-1);
    tile = getTile(x, y);
    return ( className ? tile.constructor.name == className : true );
  });
  return tile;
}

function tryTo(description, callback, time){
  for(let timeout=( time ? time : 1000 );timeout>0;timeout--){
    if(callback()){
      return;
    }
  }
  throw 'Timeout while trying to '+description;
}

function randomRange(min, max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function shuffle(arr){
  let temp, r;
  for (let i = 1; i < arr.length; i++) {
    r = randomRange(0,i);
    temp = arr[i];
    arr[i] = arr[r];
    arr[r] = temp;
  }
  return arr;
}

function draw(){
  if( game_state.mode == "running" || game_state.mode == "dead" ){
    ctx.resetTransform();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if( game_state.scrollCamera ){
      ctx.transform(1, 0, 0, 1, 
        ((numTiles/2) - player.getDisplayX())*tileSize.x - game_state.camera_offset.x*tileSize.x, 
        ((numTiles/2) - player.getDisplayY())*tileSize.y - game_state.camera_offset.y*tileSize.y);
    }
    if( game_state.debug_mapper ){
      render_mouse();
    }
    for(let i=0;i<numTiles;i++){
      for(let j=0;j<numTiles;j++){
        getTile(i,j).draw();
      }
    }

    for(let i=0;i<monsters.length;i++){
      monsters[i].draw();
    }
    
    player.draw();

    // TODO: may move this to ui render function later
    if( game_state.interact_mode == 'camera' ){
      ctx.save();
      ctx.strokeStyle = COLOR_RED_PURPLE;
      ctx.strokeRect(
        player.getDisplayX()*tileSize.x + game_state.camera_offset.x*tileSize.x, 
        player.getDisplayY()*tileSize.y + game_state.camera_offset.y*tileSize.y,
        tileSize.x,
        tileSize.y
      );
      ctx.restore();
    }
  }else if( game_state.mode == "title" || game_state.mode == "loading" ){
    ctx.resetTransform();
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.save();
    ctx.fillText( 'Spuzlike', (numTiles/2)*tileSize.x + 0.5*tileSize.x, (numTiles/2)*tileSize.y);
    ctx.fillText( 'Press any key to play', (numTiles/2)*tileSize.x + 0.5*tileSize.x, (2+numTiles/2)*tileSize.y);
    ctx.restore();
  }
  window.requestAnimationFrame(draw);
}

function drawChar(ent, x, y, rect) {
  ctx.save();

  if( rect ){
    ctx.fillStyle = rect.fillStyle;
    ctx.fillRect(
      x*tileSize.x,
      y*tileSize.y,
      tileSize.x,
      tileSize.y
    );
  }

  ctx.fillStyle = ent.fillStyle;
  ctx.fillText( String.fromCharCode(ent.glyph), x*tileSize.x + 0.5*tileSize.x, y*tileSize.y+game_state.fontSize.offset, tileSize.y);
  // char.charCodeAt(0)
  ctx.restore();
}
function drawSprite(coords, x, y) {
  //(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  // if background is already part of the spritesheet, and the glyphs are transparent
  // you can use this to color the glyphs
  // ctx.fillStyle = COLOR_BLACK;
  // ctx.fillRect(
  //   x*tileSize.x,
  //   y*tileSize.y,
  //   tileSize.x,
  //   tileSize.y
  // );
  ctx.drawImage(
    ( coords.spritesheet ? coords.spritesheet : spritesheet ),
    coords.x,
    coords.y,
    ( coords.sx ? coords.sx : tileSize.x / SCALE_FACTOR ),
    ( coords.sy ? coords.sy : tileSize.y / SCALE_FACTOR ),
    x*tileSize.x,
    y*tileSize.y,
    ( coords.dx ? coords.dx : tileSize.x ),
    ( coords.dy ? coords.dy : tileSize.y )
  );
}

function tick() {
	for(let k=monsters.length-1;k>=0;k--){
		if(!monsters[k].dead){
			monsters[k].update();
    }
    // deprecated because splicing out now happens in the monster
    //else{
			//monsters.splice(k,1);
		//}
  }
  
  player.update();

  if(player.dead){    
    //flowControl('death');
    return game_state.mode = "dead";
  }

  spawnTicker();
}

function flowControl(state) {
  switch (state) {
    case 'title':
      game_state.mode = "title";
      break;
    case 'start':
      Message.wipe();
      game_state.mode = "running";
      game_state.depth = 1;
      startLevel(game_state.startHP);
      break;
    case 'death':
      game_state.mode = "dead";
      break;
    default:
      break;
  }
}

function startLevel(playerHP) {
  spawnRate = 15;              
  spawnCounter = spawnRate;  

  if( game_state.debug_mapper ){
    numTiles = Math.floor( ( numTiles-2 ) / 3 )+2;
    initMap(Floor);
  }else{
    levelgen_dw(numTiles*numTiles, false, (game_state.depth > 1));
    generateLevel();
  }

  player = new Player(randomPassableTile()); // {x: 0, y: 0}
  player.hp = playerHP;
  if( game_state.fov_enabled ){
    player.calcFov();
  }
}

function debug_toggle(p, v){
  console.log(p,v);
  switch (p) {
    case 'truesight':
      game_state.truesight = v;
      break;
    case 'fov':
      game_state.fov_enabled = v;
      break;
    case 'scroll':
      game_state.scrollCamera = v;
      break;
    case 'tiles':
      game_state.text_mode = v;
      tileSize = {x: ( v ? 24 : 24 ), y: ( v ? 24 : 32 )};
      SCALE_FACTOR = ( v ? 3 : 2 );
      break;
    case 'mapper':
      game_state.debug_mapper = v;
      break;
    default:
      break;
  }
}

function render_mouse(){
  ctx.save();
  ctx.strokeRect(game_state.debug_mouseCoords.x*tileSize.x, game_state.debug_mouseCoords.y*tileSize.y, tileSize.x, tileSize.y);
  ctx.restore();
}
function debug_painter(e){
  var i = game_state.debug_mouseCoords.x;
  var j = game_state.debug_mouseCoords.y;

  if( !inBounds(i,j) ){
    return;
  }

  switch (e.key) {
    case 'x': // export
      var tileExport = [];
      //console.log(tiles);
      for (let c = 1; c < tiles.length-1; c++) {
        tileExport[c-1] = [];
        for (let r = 1; r < tiles[c].length-1; r++) {
          tileExport[c-1].push(tiles[c][r].constructor.name);
          //console.log(tiles[c][r])
        }
        //console.warn('end of column!');
      }
      //console.log(tileExport);
      document.querySelector('.container__json').value = JSON.stringify(tileExport);
      break;
    case 'w': // wall
      tiles[i][j] = new Wall(i,j);
      break;
    case 's': 
      tiles[i][j] = new SpawnerWall(i,j);
      break;
    case 'c': 
      tiles[i][j] = new Chest(i,j);
      break;
    case '.': 
      tiles[i][j] = new Stairs_down(i,j);
      break;
    case ',': 
      tiles[i][j] = new Stairs_up(i,j);
      break;
    case 'p': 
      tiles[i][j] = new Pit(i,j);
      break;
    case 't': 
      tiles[i][j] = new Trap(i,j);
      break;
    // case 'g': 
    //   tiles[i][j] = new Generator(i,j);
    //   break;
    case 'h': 
      tiles[i][j] = new Hazard(i,j);
      break;
    case 'm': 
      tiles[i][j] = new Mud(i,j);
      break;
    case 'a': // AQUA
      tiles[i][j] = new Water(i,j);
      break;
    default:
      tiles[i][j] = new Floor(i,j);
      break;
  }
}

function transpose(matrix) {
  let result = [];
    for(let i = 0; i < matrix[0].length; i++) {
        let row = matrix.map(e => e[i]).reverse();
        result.push(row);
    }
    return result;
}

function randomUID() {
  return '_' + Math.random().toString(36).substr(2, 9);
}
class Message {
  constructor(message) {
    this.message = message;
    game_state.message_history.unshift(message);
    console.warn(message);
  }
  static latest() {
    console.log(game_state.message_history[0]);
    return game_state.message_history[0];
  }
  static list() {
    console.table(game_state.message_history);
    return game_state.message_history;
  }
  static wipe() {
    game_state.message_history = [];
  }
}
