class Map { // new Room(0,0,tileMap); // instead of tileMap use tileMap_down once and tileMap_up once
	constructor(){}

  static generate(){

  }

  static flood(tileType){
    game_state.dungeon.tiles = [];
    for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      game_state.dungeon.tiles[i] = [];
      for( let j=0; j<game_state.dungeon.dim.y; j++ ){
        game_state.dungeon.tiles[i][j] = new tileType(i,j);
      }
    }
  }

  static createSpawners(probability){
    game_state.dungeon.spawners = [];
    for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var walls = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Wall' && t.getAdjacentPassableNeighbors().length && t.getAdjacentPassableNeighbors().length < 3);
      if( walls.length ){
        for( let w of walls ){
          if( Math.random() < probability ){
            w.replace(SpawnerWall);
            game_state.dungeon.spawners.push(w);
          }
        }
      }
    }
	}

	static async chooseVariant(){
		Promise.all(
			Object.entries(game_state.dungeon.mapgen).map(function([variant, value]){
				let chance = Math.random();
				if( chance <= value ){
					game_state.dungeon.mapgen[variant] = 0.1;
				}else{
					// TODO: possibly implement weighting here; instead of /10, /20 for swamp etc
					game_state.dungeon.mapgen[variant] += chance/10;
				}
				return game_state.dungeon.mapgen[variant];
			})
		)
		.then(function(){
			console.table(game_state.dungeon.mapgen);
			Promise.all(
				Object.entries(game_state.dungeon.mapgen)
				.filter(function([variant,value]){ return value == 0.1})
				.map(async function([variant, value]){
					switch (variant) {
						case 'forest':
							console.log(`%cCan't see the forest for the trees!`,'color:#c33399;font-family:Comic Sans MS;');
							var seed_grass = randomPassableTile('Floor').replace(Grass);
							await drunkWalker(seed_grass, game_state.dungeon.dim.x*game_state.dungeon.dim.y, Grass, ['Grass','Floor'], true);
							Map.growWalls(Tree);
							break;
						case 'grass':
							console.log('%cSome grass is nice!','color:#c33399;font-family:Comic Sans MS;');
							randomPassableTile('Floor').replace(Grass);
							randomPassableTile('Floor').replace(Grass);
							var seed_grass = randomPassableTile('Floor').replace(Grass);
							await drunkWalker(seed_grass, 25, Grass, ['Grass','Floor'], true);
							break;
						case 'water':
							console.log('%cWatch the water!','color:#c33399;font-family:Comic Sans MS;');
							var seed_water = randomPassableTile('Floor').replace(Water);
							await drunkWalker(seed_water, 25, Water, ['Water','Floor'], false);
							var seed_water2 = randomPassableTile('Floor').replace(Water);
							await drunkWalker(seed_water2, 25, Water, ['Water','Floor'], false);
							break;
						case 'mud_corridors':
							console.log('%cMuddy corridors!','color:#c33399;font-family:Comic Sans MS;');
							Map.placeMud();
							break;
						case 'swamp':
							console.log('%cWelcome to the Swamp!','color:#c33399;font-family:Comic Sans MS;');
							var seed_mud = randomPassableTile('Floor').replace(Mud);
							await drunkWalker(seed_mud, 1125, Mud, ['Mud','Floor'], true);
							seedChest();
							break;
						case 'graveyard':
							console.log(`%cLot's of bodies here!`,'color:#c33399;font-family:Comic Sans MS;');
							Map.placeCrypt();
							seedChest();
							break;
						case 'sokoban':
							if( game_state.dungeon.mapgen.forest == 0.1 ){
								console.log(`%cForest precludes sokoban`,'color:#c33399;font-family:Comic Sans MS;');
								break;
							}
							console.log(`%cWatch where you push those!`,'color:#c33399;font-family:Comic Sans MS;');
							Map.crumbleWalls();
							break;
						case 'narrow':
							console.log(`%cWelcome to the ice maze!`,'color:#c33399;font-family:Comic Sans MS;');
							Map.growWalls(IceWall);
							break;
						case 'generator':
							console.log('%cRandom generator!','color:#c33399;font-family:Comic Sans MS;');
							Map.createGenerator(0.25);
							break;
						default:
							break;
					}
					await Generator.rebeam();
					return true;
				})
			)
		})
		.finally(async function(){
			// after all others are done, seed traps
			randomPassableTile('Floor').replace(Pit);
			randomPassableTile('Floor').replace(Trap);
			randomPassableTile('Floor').replace(Trap);
			randomPassableTile('Floor').replace(Trap);

			seedChest();

			await Generator.rebeam();

			return true;
		});
	}
	
	static createGenerator(probability){
    for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var walls = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Wall' && t.getAdjacentPassableNeighbors().length && t.getAdjacentPassableNeighbors().length == 3);
      if( walls.length ){
        for( let w of walls ){
          if( Math.random() < probability ){
            return w.replace(Generator);
          }
        }
      }
    }
	}

	// Maze building. Works nice with IceWall, too
	static growWalls(terrainType){
		for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var floors = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Floor' && t.getAdjacentPassableNeighbors(true).length == 7);
      if( floors.length ){
        for( let f of floors ){
					f.replace(terrainType);
        }
      }
    }
	}

	static async crumbleWalls(){
		for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var walls = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Wall' && t.getAdjacentPassableNeighbors(true).length && t.getAdjacentPassableNeighbors(true).length >= 7);
      if( walls.length ){
        for( let w of walls ){
					w.replace(Floor);
					summonMonster(Boulder, w);
        }
      }
    }
	}
	
	// THE SWAMP
	static placeMud(){
    for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var floors = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Floor' && t.getAdjacentPassableNeighbors().length == 0);
      if( floors.length ){
        for( let f of floors ){
					f.replace(Mud);
        }
      }
    }
	}
	
	// THE CEMETARY
	static placeCrypt(){
		for( let i=0; i<game_state.dungeon.dim.x; i++ ){
      var floors = game_state.dungeon.tiles[i].filter(t => t.constructor.name == 'Floor' && t.getAdjacentPassableNeighbors(true).length == 6);
      if( floors.length ){
        for( let f of floors ){
					f.replace(Crypt);
					// var newCrypt = f.replace(Crypt);
					// new Drop(newCrypt.x, newCrypt.y, 'copper', Math.floor(Math.random()*10101));
        }
      }
    }
	}

  static populate(){
    Map.createSpawners(0.25);
    generateMonsters();
  }

  static descend(hp, oneWay){ // player.hp
		game_state.depth++;
		let hp_bonus = ( game_state.depth > game_state.depth_max ? 1 : 0 );
		game_state.depth_max = Math.max( game_state.depth, game_state.depth_max );
		startLevel(Math.min(game_state.maxHp, hp+hp_bonus), oneWay, true);
		// TODO: track max depth so the +1 hp only happens when exceeding that
		/* 
			TODO: Pit now lands you in a level which doesn't have an Up Stairs, making it one-way down.
			Perhaps we need a Rope ladder -> a one-way UP
		*/
  }

  static ascend(hp, oneWay){ // player.hp
    game_state.depth--;
		startLevel(hp, oneWay, false);
  }
}

async function startLevel(playerHP, oneWay, directionDown) {
  spawnRateReset(15);

  if( game_state.debug_mapper ){
		game_state.dungeon.dim.x = Math.floor( ( game_state.dungeon.dim.x-2 ) / 3 )+2;
		game_state.dungeon.dim.y = Math.floor( ( game_state.dungeon.dim.y-2 ) / 3 )+2;
    Map.flood(Floor);
    return spawnPlayer(playerHP, false);
  }

	let playerLoc = ( game_state.depth_max > 1 ? player.monTile() : false );
  await levelgen_dw( //target, seed, canReturn, directionDown
		game_state.dungeon.dim.x*game_state.dungeon.dim.y, 
		( game_state.depth_max > 1 ? player.monTile() : false ),
		!oneWay, //( oneWay ? false : true ), //(game_state.depth > 1) ), 
		directionDown
	)
  .then(function(result){
    new Message(`Welcome to floor ${game_state.depth}.`);
  });

  Map.populate();
	spawnPlayer(playerHP, playerLoc);
	Map.chooseVariant();
}

function seedChest( tile, loot ){
	tile = tile || randomPassableTile('Floor');
	let seed_chest = tile.replace(Chest);
	// TODO: loot.iname, loot.amount
	new Drop(seed_chest.x, seed_chest.y, 'copper', Math.floor(Math.random()*10101));
}

// The OLD decorateLevel();
// deprecated for Map.chooseVariant();
// async function _decorateLevel(){

// 	let seed_water = randomPassableTile('Floor').replace(Water);
// 	await drunkWalker(seed_water, 25, Water, ['Water','Floor'], false);

// 	let seed_water2 = randomPassableTile('Floor').replace(Water);
// 	await drunkWalker(seed_water2, 25, Water, ['Water','Floor'], false);

// 	randomPassableTile('Floor').replace(Pit);
// 	randomPassableTile('Floor').replace(Trap);
// 	randomPassableTile('Floor').replace(Trap);
// 	randomPassableTile('Floor').replace(Trap);

// 	let seed_mud = randomPassableTile('Floor').replace(Mud);
// 	// THE SWAMP
// 	//await drunkWalker(seed_mud, 1125, Mud, ['Mud','Floor'], true);

// 	randomPassableTile('Floor').replace(Grass);
// 	randomPassableTile('Floor').replace(Grass);
// 	let seed_grass = randomPassableTile('Floor').replace(Grass);
// 	await drunkWalker(seed_grass, 25, Grass, ['Grass','Floor'], true);

// 	let seed_chest = randomPassableTile('Floor').replace(Chest);
// 	new Drop(seed_chest.x, seed_chest.y, 'copper', Math.floor(Math.random()*10101));

// 	let seed_crypt = randomPassableTile('Floor').replace(Crypt);
// 	new Drop(seed_crypt.x, seed_crypt.y, 'copper', Math.floor(Math.random()*10101));

// 	Map.placeMud();
// 	Map.createGenerator(0.25);
// }

// Former drunkWalk function
// async function _drunkWalk(tile, diagonals, allowedType){
// 	var attempt = tile.getAdjacentNeighbors(diagonals)[0];
// 	return ( inBounds(attempt.x,attempt.y) ? attempt : false );
// }

async function drunkWalk(tile, diagonals, allowedTypes){
	// && !t.monster added to avoid the sokoban problem
	var attempt = tile.getAdjacentNeighbors(diagonals).filter( t => allowedTypes.includes(t.constructor.name) && !cfm(t.x, t.y) );
	if( attempt[0] ){
		return ( inBounds(attempt[0].x,attempt[0].y) ? attempt[0] : false );
	}else{
		console.log(`Zero valids tiles found to traverse`);
		return false;
	}
}

async function drunkWalker(seed, target, type_to, type_from, diagonals){
	var carves = 0;
	var fails = 0;
	var target_og = target;
	while( target-- ){
		if( fails > target_og ){
			console.error(`Exceeded attempts to cultivate ${type_to.name}`);
			return seed;
		}
		let process = await drunkWalk(seed, diagonals, type_from);
		if( !process ){
			console.warn(`Can't cultivate ${type_to.name}`);
			target++;
			fails++;
		}else{
			if( process.constructor.name != type_to.name ){
				carves++;
			}
			process.replace(type_to);
			seed = process;
		}
		await drunkWalk(seed, diagonals, type_from);
	}
	if( target <= 0 ){
		console.warn(`Completed ${carves} conversions of ${type_to.name} with ${fails} fails, boss`);
		return seed;
	}
}

async function levelgen_dw(target, seed, canReturn, directionDown){
	console.log(`attempting ${target} carves`+( seed ? `from [${seed.x},${seed.y}]` : ''));
	console.log(`canReturn:${canReturn}, down:${(directionDown)}`);
	Map.flood(Wall);
	var seed = ( seed ? seed : randomTile('Wall') );
	var lastTile = await drunkWalker(seed, target, Floor, ['Floor','Wall'], true);
	
	return await placeStairs(seed, lastTile, canReturn, directionDown);
}

async function placeStairs(seed, lastTile, canReturn, directionDown){
	if( game_state.depth == 1 ){
		if( directionDown ){
			lastTile.replace(Stairs_down);
		}else{
			seed.replace(Stairs_down);
		}
	}else if( game_state.depth > 1 ){
		if( seed == lastTile ){
			console.warn('Drunkwalk improbability achieved, congrats');
			randomPassableTile('Floor').replace(( directionDown ? Stairs_down : Stairs_up ));
		}else{
			lastTile.replace(( directionDown ? Stairs_down : Stairs_up ));
		}

		if( canReturn ){
			seed.replace(( directionDown ? Stairs_up : Stairs_down ));
		}
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
				//game_state.dungeon.tiles[i][j] = new roomType(i,j);
				game_state.dungeon.tiles[start_x+i][start_y+j].replace(roomType);
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