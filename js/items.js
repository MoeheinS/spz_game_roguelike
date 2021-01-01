let itemCompendium = [
  {
    "iname": "copper",
    "name": "copper coins",
    "glyph": 162 //¢
  }
];

class Drop {
	constructor(x, y, name, amount) {
    for( let i of itemCompendium ){
      if( i.iname == name ){
        this.iname = name;
        this.name = i.name;
        this.amount = amount;
        this.glyph = i.glyph;
        let tryTile = getTile(x,y);
        // TODO: Either identify the treasure-holding Terrain types by name or add a flag...
        if( tryTile && ( tryTile.passable || TREASURE_HOLDERS.includes(tryTile.constructor.name) ) ){
            tiles[x][y].inventory.push(this);
        }else{
          console.error(`Could not drop ${name} on impassable tile`);
        }
        break;
      }else{
        console.error(`${name} does not exist in the itemCompendium`);
        return;
      }
    }
  }
  
  static pickup(x, y, source){
    let tryTile = getTile(x,y);
    // Deprecated; used to assume pickup was same-tile
    // if( !tryTile.monster ){
    //   console.error(`No monster present to pick up item at ${x},${y}`);
    //   return;
    // }
    if( tryTile.inventory.length ){
      let pickup = tryTile.inventory.shift();
      new Message(`The ${source.constructor.name} picks up ${pickup.amount} ${pickup.name}.`);
      var invCheck = source.inventory.filter(t=>t.iname == pickup.iname);
      if( invCheck.length ){
        invCheck[0].amount += pickup.amount;
      }else{
        source.inventory.push(pickup);
      }      
      console.table(source.inventory);
    }else{
      new Message(`There is nothing to pick up from the ${tryTile.constructor.name.toLowerCase()}.`);
    }
  }

  static async loot(tile, source){
    Drop.pickup(tile.x, tile.y, source);
    switch (tile.constructor.name) {
      case 'Crypt':
        tile.replace(Mud);
        let monster = await summonMonster(shuffle([Zombie,Ghost,Centipede])[0], tile);
        new Message(`A ${monster.constructor.name} bursts forth from the ${tile.constructor.name.toLowerCase()}!`);
        break;
      default:
        // tile.replace('Floor');
        break;
    }
    return;
  }
}