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

function debounce(callback, wait) {
  let timeout;
  return (...args) => {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => callback.apply(context, args), wait);
  };
}



function drawTitleScreen(){
  ctx.save();

  ctx.fillText( 'Spuzlike', 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                //(numTiles/2)*tileSize.y
                2*tileSize.y
              );
  ctx.fillText( 'Press any key to play', 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                //(2+numTiles/2)*tileSize.y
                4*tileSize.y
              );
  
  ctx.font = 4*game_state.fontSize.size+"px ega";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.fillText( '@', 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (numTiles/2)*tileSize.y
              );


  ctx.font = 1.5*game_state.fontSize.size+"px ega";
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  ctx.strokeStyle = COLOR_YELLOW;
  ctx.lineWidth = 0.75*game_state.fontSize.size;
  ctx.strokeText( '3', 
                  (-2+(numTiles/2))*tileSize.x + 0.5*tileSize.x, 
                  (-1+numTiles/2)*tileSize.y
                );
  ctx.fillText( '3', 
                (-2+(numTiles/2))*tileSize.x + 0.5*tileSize.x, 
                (-1+numTiles/2)*tileSize.y
              );

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  ctx.font = 0.75*game_state.fontSize.size+"px ega";
  ctx.fillText( 'You', 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (3+numTiles/2)*tileSize.y
              );
  ctx.fillText( 'health', 
                (1+(numTiles/2))*tileSize.x + 0.5*tileSize.x, 
                (-1+numTiles/2)*tileSize.y
              );

  ctx.fillText( `W / ${String.fromCharCode(9650)}`, 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (-3+numTiles/2)*tileSize.y
              );
  ctx.fillText( `S / ${String.fromCharCode(9660)}`, 
                (numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (5+numTiles/2)*tileSize.y
              );
  ctx.fillText( `A / ${String.fromCharCode(9668)}`, 
                (-5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (1+numTiles/2)*tileSize.y
              );
  ctx.fillText( `D / ${String.fromCharCode(9658)}`, 
                (5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (1+numTiles/2)*tileSize.y
              );
  
  ctx.fillText( `U`, 
                (-5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (-3+numTiles/2)*tileSize.y
              );
  ctx.fillText( `I`, 
                (5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (-3+numTiles/2)*tileSize.y
              );
  ctx.fillText( `J`, 
                (-5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (5+numTiles/2)*tileSize.y
              );
  ctx.fillText( `K`, 
                (5+numTiles/2)*tileSize.x + 0.5*tileSize.x, 
                (5+numTiles/2)*tileSize.y
              );

  ctx.restore();
}

function drawCamera(){
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

function flowControl(state) {
  switch (state) {
    case 'title':
      game_state.mode = "title";
      break;
    case 'start':
      player = new Player({x: 0, y: 0});
      Message.wipe();
      game_state.mode = "running";
      game_state.depth = 1;
      game_state.depth_max = 1;
      startLevel(game_state.startHP, false, true);
      break;
    case 'death':
      game_state.mode = "dead";
      break;
    default:
      break;
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
    case 'mapper':
      game_state.debug_mapper = v;
      break;
    case 'resizeCanvas':
      game_state.resizeCanvas = v;
      setupCanvas();
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
      tiles[i][j] = new MapperEnt(i,j,'hazard');
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

function draw(){
  if( !game_state.activeDraw ){
    return window.requestAnimationFrame(draw);
  }
  ctx.resetTransform();
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if( game_state.mode == "running" || game_state.mode == "dead" ){
    if( game_state.scrollCamera ){
      ctx.transform(1, 0, 0, 1, 
        ((numTiles/2) - player.getDisplayX())*tileSize.x - game_state.camera_offset.x*tileSize.x, 
        ((numTiles/2) - player.getDisplayY())*tileSize.y - game_state.camera_offset.y*tileSize.y);
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
      drawCamera();
    }
    if( game_state.debug_mapper ){
      render_mouse();
    }
  }else if( game_state.mode == "title" || game_state.mode == "loading" ){
    drawTitleScreen();
  }
  window.requestAnimationFrame(draw);
}

function tick() {
  // update player last
  Promise.all(
    monsters.map(function(monster){
      if(!monster.dead){
        console.log(`${monster.uid} acting`);
        return monster.update();
      }
    })
  )
  .then(async function(){
    await Generator.rebeam();
    if( monsters.length ){
      console.warn('All monsters have acted');
    }
    player.update().then(function(){
      console.log('Player has acted');
      player.updateDOM();
      dom_tooltip.resetDOM();
    });
  })
  .finally(function(){
    if(player.dead){    
      return game_state.mode = "dead";
    }else{
      spawnTicker();
    }
  });
}