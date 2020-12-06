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
      new Message(`The walls cave in on the ${monster.constructor.name}, dealing ${numWalls*2} damage!`);
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
  MEND: function(monster){
    monster.tile.setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON);
    monster.hp++;
  },
  AURA: function(monster){
    monster.tile.getAdjacentNeighbors().forEach(function(t){
      t.setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON); // ☼
      if(t.monster){
        t.monster.hp++;
      }
    });
    monster.tile.setEffect(9834, COLOR_BLUE, COLOR_GREEN_NEON);
    monster.hp++;
  },
  DASH: function(monster){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      new Message(`${monster.constructor.name} does some squats!`);
      return;
    }
    let newTile = monster.tile;
    while(true){
      let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]);
      if(testTile.passable && !testTile.monster){
        // play an effect on the tile
        testTile.setEffect(monster.glyph, COLOR_BLACK, COLOR_FUCHSIA);
        newTile = testTile;
      }else{
        break;
      }
    }
    if(monster.tile != newTile){
      monster.move(newTile, true);
      newTile.getAdjacentNeighbors().forEach(t => {
        if(t.monster){
          t.setEffect(monster.glyph, COLOR_BLACK, COLOR_FUCHSIA);
          //t.monster.stunned = true;
          t.monster.swing(1);
        }
      });
    }
  },
  POWER: function(monster){
    monster.bonusAttack=5;
    monster.tile.setEffect(monster.glyph, COLOR_WHITE, COLOR_FUCHSIA);
  },
  BOLT_RAY(monster, damage){
    if( monster.lastMove[0] == 0 && monster.lastMove[1] == 0 ){
      new Message(`${monster.constructor.name} makes the floor glow!`);
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
      new Message(`${monster.constructor.name} briefly disappears and reappears.`);
      return;
    }
    let newTile = monster.tile;
    newTile.setEffect(9788, COLOR_FUCHSIA, COLOR_GREEN_NEON);
    let testTile = newTile.getNeighbor(monster.lastMove[0],monster.lastMove[1]).getNeighbor(monster.lastMove[0],monster.lastMove[1]);
    if(!testTile.passable && !monster.phaseWall){
      // teleport into a wall? That's YASD
      new Message(`The ${monster.constructor.name} was lost forever.`);
      monster.die();
    }else if( testTile.monster ){
      // teleport into a monster? Healthier one survives
      let myHP = monster.hp;
      let thyHP = testTile.monster.hp;
      testTile.monster.swing(myHP);
      monster.swing(thyHP);
    }
    newTile = testTile;
    if(monster.tile != newTile){
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
      var testTile = monster.tile.getNeighbor(directions[k][0],directions[k][1]);
      if( testTile.monster ){
        testTile.monster.swing(1);
      }
    }
    monster.lastMove = [originalDirection.x, originalDirection.y];
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