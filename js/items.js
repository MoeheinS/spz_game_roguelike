let itemCompendium = [
  {
    "iname": "copper",
    "name": "copper coins",
    "glyph": 162 //¢
  }
];

/*
  Item TODO:s
    Ladder: step over Lava / Pit terrain (TODO: add Lava terrain...)
      In practice lava terrain becomes a los-transparent wall that you get to phase through. Lots of shenanigans for little payoff
    Flute: Put certain monsters to sleep
      All non-deaf, corporeal, non-undead monsters. Is it worth? What range?
    Boomerang: Ranged attack (with stun?)
      Consumable item ranged attack, that spawns a Boomerang item on the monsters square or adjacent
    Mirrored Fullplate: reflect beam terrain
    Potion: heal to full on death
      Or other effects, such as + damage, + def, a burst of speed (5 actions / attacks)
      Or a cursed effect such as poison (hp to 1), blindness, weakness (-damage)
    Hammer: crush walls to boulders, boulders to dust
      In theory you could crushwalk your way to a stairs, 2 actions at a time
    Wad of cash: bribe certain monsters
      corporeal non-undead. Ideally they would join your faction, but that means implementing some sort of faction AI
      easy solution is to have them NOT attack you if they could; lasts until they take damage from any source
    Tower shield: block 1 attack per action?
      1v1 invincibility, makes a 2v1 a 1v1
    Horned helmet: bullrush ability
      Great for rapid traversal and/or paired with the lance
    Genocidal dagger: attacking a monster deals damage to the species? Killing 1 deals damage to species? Killing 1 kills species?
      Love it, should perhaps be the macguffin
    Lance: gain +1 damage for each turn you move in the same direction, lost on attacking or changing directions
    Ankh staff: place an ankh (wall?) that monsters cannot pass
      wall is perpendicular to the cardinal direction you cast it in, max of 2 walls
      Allows you to use pillars for some interesting plays
      You stepping on any ankh tile destroys them all (behavior similar to Hazard tile)
*/

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
            game_state.dungeon.tiles[x][y].inventory.push(this);
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