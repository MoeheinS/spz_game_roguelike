abilities = {
  endTurn: function(monster){
    monster.moves = 0;
    monster.attacks = 0;
  },
  placeTrap: function(monster){
    let freeSpace = shuffle(monster.monTile().getAdjacentPassableNeighbors().filter(t=>!cfm(t.x, t.y) && t.constructor.name == 'Floor'))[0];
    if( freeSpace ){
      freeSpace.replace(Trap);
    }
  },
  WOOP: function(monster){
    monster.move(randomPassableTile(), true); // instant movement
  },
  QUAKE: function(monster){                  
    for( monster of game_state.dungeon.monsters ){
      let numWalls = 4 - monster.monTile().getAdjacentPassableNeighbors().length;
      monster.swing(numWalls*2);
      new Message(`The walls cave in on the ${monster.constructor.name}, dealing ${numWalls*2} damage!`);
    }
    if( monster.isPlayer ){
      player.moves = 0;
		  player.tryMove(0, 0);
    }else{
      player.swing((4 - player.monTile().getAdjacentPassableNeighbors().length)*2);
      abilities.endTurn(monster);
    }
  },
  MULLIGAN: function(monster){
    startLevel(1, false, true); // to remember spells; , monster.spells);
  },
  MAELSTROM: function(monster){
    for(let i=0;i<game_state.dungeon.monsters.length;i++){
      abilities.WOOP(game_state.dungeon.monsters[i]);
      game_state.dungeon.monsters[i].moves = -2;
      game_state.dungeon.monsters[i].attacks = -2;
    }
  },
  MEND: function(monster){
    monster.monTile().setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON);
    monster.hp++;
  },
  AURA: function(monster){
    monster.monTile().getAdjacentNeighbors().forEach(function(t){
      t.setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON); // ☼
      if(cfm(t.x, t.y)){
        cfm(t.x, t.y)[0].hp++;
      }
    });
    monster.monTile().setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON);
    cfm(t.x, t.y)[0].hp++;
  },
  DASH: function(monster){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      return;
    }
    let newTile = monster.monTile();
    while(true){
      let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]);
      if(testTile.passable && !cfm(testTile.x, testTile.y)){
        // play an effect on the tile
        testTile.setEffect(monster.glyph, COLOR_BLACK, COLOR_FUCHSIA);
        newTile = testTile;
      }else{
        break;
      }
    }
    if(monster.monTile() != newTile){
      monster.move(newTile, true);
      newTile.getAdjacentNeighbors().forEach(t => {
        if(cfm(t.x, t.y)){
          t.setEffect(monster.glyph, COLOR_BLACK, COLOR_FUCHSIA);
          //t.monster.stunned = true;
          cfm(t.x, t.y)[0].swing(1);
        }
      });
    }
  },
  POWER: function(monster){
    monster.bonusAttack=5;
    monster.monTile().setEffect(monster.glyph, COLOR_WHITE, COLOR_FUCHSIA);
  },
  BOLT_RAY(monster, damage){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      return;
    }
    let newTile = monster.monTile();
    while(true){
      let testTile = newTile.getNeighbor(monster.lastMove[0], monster.lastMove[1]);
      if(testTile.passable){
        newTile = testTile;
        if(cfm(newTile.x, newTile.y)){
          cfm(newTile.x, newTile.y)[0].swing(damage);
        }
        newTile.setEffect(950, COLOR_WHITE, COLOR_BLUE);
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
  },
  PHASE: function(monster){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      return;
    }
    let newTile = monster.monTile();
    newTile.setEffect(9788, COLOR_FUCHSIA, COLOR_GREEN_NEON);
    let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]).getNeighbor(monster.lastMove[0],monster.lastMove[1]);
    if(!testTile.passable && !monster.phaseWall){
      // teleport into a wall? That's YASD
      new Message(`The ${monster.constructor.name} was lost forever.`);
      monster.die();
    }else if( cfm(testTile.x, testTile.y) ){
      // teleport into a monster? Healthier one survives
      let myHP = monster.hp;
      let thyHP = cfm(testTile.x, testTile.y)[0].hp;
      cfm(testTile.x, testTile.y)[0].swing(myHP);
      monster.swing(thyHP);
    }
    newTile = testTile;
    if(monster.monTile() != newTile){
      monster.move(newTile, true);
      testTile.setEffect(9788, COLOR_FUCHSIA, COLOR_GREEN_NEON);
    }
  },
  WHIRLWIND: function(monster){
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
      var testTile = monster.monTile().getNeighbor(directions[k][0],directions[k][1]);
      if( cfm(testTile.x, testTile.y) ){
        cfm(testTile.x, testTile.y)[0].swing(1);
      }
    }
    monster.lastMove = [originalDirection.x, originalDirection.y];
  },
  DODGE: function(monster){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      return;
    }
    if( !monster.stamina ){
      new Message(`The ${monster.constructor.name} is exhausted.`);
      return;
    }
    let newTile = monster.monTile();
    let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]);
    if(testTile.passable && !cfm(testTile.x, testTile.y)){
      // play an effect on the tile
      testTile.setEffect(monster.glyph, COLOR_BLACK, COLOR_FUCHSIA);
      newTile = testTile;
    }else{
      new Message(`The ${monster.constructor.name} couldn't roll due to an obstacle.`);
    }
    if(monster.monTile() != newTile){
      monster.move(newTile, true);
      monster.stamina--;
    }
  },
  DIRECT: function(monster, callback){
    new Message(`Press a direction key.`);
    game_state.interact_mode = 'input';
    game_state.callback = callback;
  },
  //TARGET: function(monster, callback){}
  STAIRS: function(monster, direction){
    if( direction == '>' && player.monTile().constructor.name == 'Stairs_down' ){
      Map.descend(player.hp);
    }else if( direction == '<' && player.monTile().constructor.name == 'Stairs_up' ){
      Map.ascend(player.hp);
    }else{
      console.warn('Nothing happened');
    }
  }
};

/*
  Notes on items:
    Consumable items should cast an ability
    Potions : 1 charge, delete when 0 charges
    Scrolls : like potions, but teaches you the skill
    Wands : 1-X charges, stay when 0 charges
      -> technically abilities cast using a wand should still consume mana ; the only of these that does consume mana
      -> recharging using another ability is too much hassle to code, but possible
    Rings : 1-3 charges, stay when 0 charges, recharge at depth change
      -> abilities don't cost mana to use this way
*/