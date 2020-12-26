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

  static descend(hp){ // player.hp
    game_state.depth++;
    startLevel(Math.min(game_state.maxHp, hp+1));
  }

  static ascend(hp){ // player.hp
    game_state.depth--;
		startLevel(hp);
  }
}

function startLevel(playerHP) {
  spawnRateReset(15);

  if( game_state.debug_mapper ){
    numTiles = Math.floor( ( numTiles-2 ) / 3 )+2;
    Map.flood(Floor);
  }else{
    levelgen_dw(numTiles*numTiles, false, (game_state.depth > 1));
    generateLevel();
  }

  // TODO: move out of this function
  spawnPlayer(playerHP, false);
}