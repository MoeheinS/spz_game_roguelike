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
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.resetTransform();
    if( game_state.scrollCamera ){
      // TODO: cleaner would be to save cameraOffset X and Y, so DOM can use these too, or that it can be used for inspect mode
      ctx.transform(1, 0, 0, 1, ((numTiles/2) - player.getDisplayX())*tileSize.x, ((numTiles/2) - player.getDisplayY())*tileSize.y);
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
  }else if( game_state.mode == "title" || game_state.mode == "loading" ){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.save();
    ctx.fillText( 'Spuzlike', (numTiles/2)*tileSize.x + 0.5*tileSize.x, (numTiles/2)*tileSize.y);
    ctx.fillText( 'Press any key to play', (numTiles/2)*tileSize.x + 0.5*tileSize.x, (2+numTiles/2)*tileSize.y);
    ctx.restore();
  }
  window.requestAnimationFrame(draw);
}

function drawChar(char, x, y) {
  ctx.fillText( String.fromCharCode(char), x*tileSize.x + 0.5*tileSize.x, y*tileSize.y, tileSize.y);
  // char.charCodeAt(0)
}
function drawSprite(coords, x, y) {
  //(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  ctx.drawImage(spritesheet, 
    coords.x * 12,
    coords.y * 16,
    12,
    16,
    x*tileSize.x,
    y*tileSize.y,
    tileSize.x,
    tileSize.y
  );
}

function tick() {
	for(let k=monsters.length-1;k>=0;k--){
		if(!monsters[k].dead){
			monsters[k].update();
		}else{
			monsters.splice(k,1);
		}
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

  generateLevel();

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
    default:
      break;
  }
}