class Map { // new Room(0,0,tileMap); // instead of tileMap use tileMap_down once and tileMap_up once
	constructor(){}

  static generate(){

  }

  static flood(tileType){
    tiles = [];
    for( let i=0; i<numTiles; i++ ){
      tiles[i] = [];
      for( let j=0; j<numTiles; j++ ){
        tiles[i][j] = new tileType(i,j);
      }
    }
  }

  static createSpawners(probability){
    spawners = [];
    for( let i=0; i<numTiles; i++ ){
      var walls = tiles[i].filter(t => t.constructor.name == 'Wall' && t.getAdjacentPassableNeighbors().length && t.getAdjacentPassableNeighbors().length < 3);
      if( walls.length ){
        for( let w of walls ){
          if( Math.random() < probability ){
            w.replace(SpawnerWall);
            spawners.push(w);
          }
        }
      }
    }
  }

  static populate(){
    Map.createSpawners(0.25);
    generateMonsters();
  }

  static descend(hp){ // player.hp
    // Promise.all(
    //   monsters.map(function(monster){
    //     monster.void();
    //   })
    // )
    // .then(function(){
    //   console.table(monsters);
      game_state.depth++;
      startLevel(Math.min(game_state.maxHp, hp+1));  
    // });
  }

  static ascend(hp){ // player.hp
    game_state.depth--;
		startLevel(hp);
  }
}

async function startLevel(playerHP) {
  spawnRateReset(15);

  if( game_state.debug_mapper ){
    numTiles = Math.floor( ( numTiles-2 ) / 3 )+2;
    Map.flood(Floor);
    return spawnPlayer(playerHP, false);
  }

  await levelgen_dw(numTiles*numTiles, false, (game_state.depth > 1))
  .then(function(result){
    new Message(`Welcome to floor ${game_state.depth}`);
  });

  decorateLevel();
  Map.populate();
  spawnPlayer(playerHP, false);
}

function decorateLevel(){
	randomPassableTile('Floor').replace(Water);
	randomPassableTile('Floor').replace(Pit);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Hazard);
	randomPassableTile('Floor').replace(Mud);
}

async function drunkWalk(tile, diagonals, allowedType){
	var attempt = tile.getAdjacentNeighbors(diagonals)[0];
	// if( inBounds(attempt.x,attempt.y)){
	// 	return attempt;
	// }else{
	// 	return tile;
	// }
	//return ( inBounds(attempt.x,attempt.y) ? ( attempt.constructor.name == allowedType.name ? attempt : false ) : false );
	return ( inBounds(attempt.x,attempt.y) ? attempt : false );
}

async function drunkWalker(seed, target, type_to){
	var carves = 0;
	var fails = 0;
	var target_og = target;
	while( target-- ){
		if( fails > target_og ){
			console.error('whoops, too many fails');
			return seed;
		}
		let process = await drunkWalk(seed, true, Wall);
		if( !process ){
			console.warn('cant drunkwalk');
			target++;
			fails++;
		}else{
			if( process.constructor.name != type_to.name ){
				carves++;
			}
			process.replace(type_to);
			seed = process;
		}
		await drunkWalk(seed, true, Wall);
	}
	if( target <= 0 ){
		console.warn(`out of booze after ${carves} carves with ${fails} fails, boss`);
		return seed;
	}
}

// levelgen_dw(600, player.tile);
async function levelgen_dw(target, seed, canUp){
	console.log(`attempting ${target} carves`+( seed ? `from [${seed.x},${seed.y}]` : ''));
	Map.flood(Wall);
	var seed = ( seed ? seed : randomTile('Wall') );
	var lastTile = await drunkWalker(seed, target, Floor);
	if( canUp ){ 
		seed.replace(Stairs_up);
	}
	if( seed == lastTile ){
		console.warn('Back where we began');
		randomPassableTile('Floor').replace(Stairs_down);
	}else{
		lastTile.replace(Stairs_down);
  }
  return true;
}

//=================================[Room logic, for fixtures]=================================
class Room { // new Room(0,0,tileMap); // instead of tileMap use tileMap_down once and tileMap_up once
	constructor(x,y, allowedRooms) {
		var orig_chosenRoom = shuffle(allowedRooms)[0];
		var chosenRoom = orig_chosenRoom;
		var rotations = Math.floor(Math.random()*4);
		if( rotations ){ // 0, 1, 2, 3
			for (let i = 0; i < rotations; i++) {
				console.log('transposed!');
				chosenRoom = transpose(chosenRoom);
			}
		}

		var start_x = 1+ x * chosenRoom.length;
		var start_y = 1+ y * chosenRoom.length;
		
		for( let i=0; i<chosenRoom.length; i++ ){ // rows
			for( let j=0; j<chosenRoom[i].length; j++ ){ // columns
				let roomType = eval(chosenRoom[i][j]);
				// NOTE: if roomType == 'Gimme a Boulder yo', place monster boulder else eval
				// also if Spawner wall, add to spawners list then eval and place
				// optionally replace Walls for SpawnerWalls here?
				//tiles[i][j] = new roomType(i,j);
				tiles[start_x+i][start_y+j].replace(roomType);
			}
		}
	}
}

//randomizeMap(3,3,1)
function randomizeMap(x, y, seed){
	for (let i = 0; i < x; i++) {
		for (let j = 0; j < y; j++) {
			if( seed > Math.random() ){
				new Room(i, j, tileMap);
			}
		}
	}
}