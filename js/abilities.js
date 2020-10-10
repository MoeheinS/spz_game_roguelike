abilities = {
  endTurn: function(monster){
    monster.moves = 0;
    monster.attacks = 0;
  },
  placeTrap: function(monster){
    let freeSpace = shuffle(monster.tile.getAdjacentPassableNeighbors().filter(t=>!t.monster && t.constructor.name == 'Floor'))[0];
    if( freeSpace ){
      freeSpace.replace(Trap);
    }
  },
  WOOP: function(monster){
    monster.move(randomPassableTile(), true); // instant movement
  },
  QUAKE: function(monster){                  
    for( monster of monsters ){
      let numWalls = 4 - monster.tile.getAdjacentPassableNeighbors().length;
      monster.swing(numWalls*2);
      console.warn(`The walls cave in on the ${monster.constructor.name} for ${numWalls*2} damage!`);
    }
    if( monster.isPlayer ){
      player.moves = 0;
		  player.tryMove(0, 0);
    }else{
      player.swing((4 - player.tile.getAdjacentPassableNeighbors().length)*2);
      abilities.endTurn(monster);
    }
  },
  MULLIGAN: function(monster){
    startLevel(1); // to remember spells; , monster.spells);
  },
  MAELSTROM: function(monster){
    for(let i=0;i<monsters.length;i++){
      abilities.WOOP(monsters[i]);
      monsters[i].moves = -2;
      monsters[i].attacks = -2;
    }
  },
  AURA: function(){
    player.tile.getAdjacentNeighbors().forEach(function(t){
      t.setEffect(9788, COLOR_BLACK, COLOR_GREEN_NEON); // ☼
      if(t.monster){
        t.monster.hp++;
      }
    });
    player.tile.setEffect(9788, COLOR_BLACK, COLOR_GREEN_NEON);
    player.hp++;
  },
  DASH: function(monster){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      console.warn(`${monster.constructor.name} does some squats!`);
      return;
    }
    let newTile = monster.tile;
    while(true){
      let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]);
      if(testTile.passable && !testTile.monster){
        // play an effect on the tile
        testTile.setEffect(9788, COLOR_BLACK, COLOR_FUCHSIA);
        newTile = testTile;
      }else{
        break;
      }
    }
    if(monster.tile != newTile){
      monster.move(newTile, true);
      newTile.getAdjacentNeighbors().forEach(t => {
        if(t.monster){
          t.setEffect(9788, COLOR_BLACK, COLOR_FUCHSIA);
          //t.monster.stunned = true;
          t.monster.swing(1);
        }
      });
    }
  },
  POWER: function(monster){
    monster.bonusAttack=5;
  },
  BOLT_RAY(monster, damage){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      console.warn(`${monster.constructor.name} beams the floor!`);
      return;
    }
    let newTile = monster.tile;
    while(true){
      let testTile = newTile.getNeighbor(monster.lastMove[0], monster.lastMove[1]);
      if(testTile.passable){
        newTile = testTile;
        if(newTile.monster){
          newTile.monster.swing(damage);
        }
        newTile.setEffect(9788, COLOR_WHITE, COLOR_BLUE);
      }else{
        break;
      }
    }
  },
  CROSS: function(monster){
    let directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ];
    originalDirection = {};
    originalDirection.x = monster.lastMove[0];
    originalDirection.y = monster.lastMove[1];
    for(let k=0;k<directions.length;k++){
      monster.lastMove = directions[k];
      abilities.BOLT_RAY(monster, 2);
    }
    monster.lastMove = [originalDirection.x, originalDirection.y];
  },
  EX: function(monster){
    let directions = [
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, -1]
    ];
    originalDirection = {};
    originalDirection.x = monster.lastMove[0];
    originalDirection.y = monster.lastMove[1];
    for(let k=0;k<directions.length;k++){
      monster.lastMove = directions[k];
      abilities.BOLT_RAY(monster, 2);
    }
    monster.lastMove = [originalDirection.x, originalDirection.y];
  },
  STARBURST: function(monster){
    let directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
      [-1, -1],
      [1, 1],
      [-1, 1],
      [1, -1]
    ];
    originalDirection = {};
    originalDirection.x = monster.lastMove[0];
    originalDirection.y = monster.lastMove[1];
    for(let k=0;k<directions.length;k++){
      monster.lastMove = directions[k];
      abilities.BOLT_RAY(monster, 2);
    }
    monster.lastMove = [originalDirection.x, originalDirection.y];
  }
};