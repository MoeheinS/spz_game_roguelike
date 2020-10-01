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
  }
};