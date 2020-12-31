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
        if( tryTile && tryTile.passable ){
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
  
  static Pickup(x, y){
    let tryTile = getTile(x,y);
    if( !tryTile.monster ){
      console.error(`No monster present to pick up item at ${x},${y}`);
      return;
    }
    if( tryTile.inventory.length ){
      let pickup = tryTile.inventory.shift();
      new Message(`The ${tryTile.monster.constructor.name} picks up ${pickup.amount} ${pickup.name}.`);
      var invCheck = tryTile.monster.inventory.filter(t=>t.iname == pickup.iname);
      if( invCheck.length ){
        invCheck[0].amount += pickup.amount;
      }else{
        tryTile.monster.inventory.push(pickup);
      }      
      console.table(tryTile.monster.inventory);
    }else{
      new Message('There is nothing to pick up.');
    }
  }
}