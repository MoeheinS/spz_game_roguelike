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
  }
};