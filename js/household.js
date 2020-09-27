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
    ctx.fillText( 'Spuzlike', (numTiles/2)*tileSize + 0.5*tileSize, (numTiles/2)*tileSize);
    ctx.fillText( 'Press any key to play', (numTiles/2)*tileSize + 0.5*tileSize, (2+numTiles/2)*tileSize);
    ctx.restore();
  }
  window.requestAnimationFrame(draw);
}

function drawChar(char, x, y) {
  ctx.fillText( String.fromCharCode(char), x*tileSize + 0.5*tileSize, y*tileSize, tileSize);
  // char.charCodeAt(0)
}

function tick() {
	for(let k=monsters.length-1;k>=0;k--){
		if(!monsters[k].dead){
			monsters[k].update();
		}else{
			monsters.splice(k,1);
		}
  }
  
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