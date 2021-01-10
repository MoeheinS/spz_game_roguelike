class Terrain {
	constructor(x, y, sprite, passable) {
		this.x = x;
		this.y = y;
		this.fillStyle = COLOR_BLACK;
		this.renderOverride = false;
		this.sprite = sprite;
		this.passable = passable;
		this.transparent = true;
		this.inventory = [];
		// FIXME: this interferes with fog of war
		//this.renderOverride = { fillStyle: COLOR_YELLOW };
	}
	
	stepOn(monster){
		if( monster.isPlayer ){
			let hiddenNeighbors = this.getAdjacentNeighbors().filter(t => t.hidden);
			for (let i = 0; i < hiddenNeighbors.length; i++) {
				hiddenNeighbors[i].reveal();
			}
			// TODO: singular, plural to be implemented
			if(this.inventory.length){
				var itemMessage = '';
				for( let d of this.inventory ){
					itemMessage += `You see ${d.amount} ${d.name}. `;
				}
				new Message(itemMessage);
			}
		}
	}

	reveal(){
		this.hidden = false;
		new Message(`You spot a ${this.constructor.name}.`);
	}

	// pass a class as arg
	replace(newTileType){
		tiles[this.x][this.y] = new newTileType(this.x, this.y);
		// experimental
		if( tiles[this.x][this.y].monster ){
			tiles[this.x][this.y].monster.move(getTile(this.x, this.y));
		}
		return tiles[this.x][this.y];
	}

	//manhattan distance
	dist(other){
		return Math.abs(this.x-other.x)+Math.abs(this.y-other.y);
	}

	getNeighbor(dx, dy){
		return getTile(this.x + dx, this.y + dy)
	}
	
	getAdjacentNeighbors(diagonals){
		if( !diagonals ){
			return shuffle([
				this.getNeighbor(0, -1),
				this.getNeighbor(0, 1),
				this.getNeighbor(-1, 0),
				this.getNeighbor(1, 0)
			]);
		}else{
			return shuffle([
				this.getNeighbor(0, -1),
				this.getNeighbor(0, 1),
				this.getNeighbor(-1, 0),
				this.getNeighbor(1, 0),
				this.getNeighbor(1, 1),
				this.getNeighbor(1, -1),
				this.getNeighbor(-1, -1),
				this.getNeighbor(-1, 1)
			]);
		}
	}

	getAdjacentPassableNeighbors(diagonals){
		return this.getAdjacentNeighbors(diagonals).filter(t => t.passable);
	}

	getConnectedTiles(){
		let connectedTiles = [this];
		let frontier = [this];
		while(frontier.length){
			let neighbors = frontier.pop()
											.getAdjacentPassableNeighbors()
											.filter(t => !connectedTiles.includes(t));
			connectedTiles = connectedTiles.concat(neighbors);
			frontier = frontier.concat(neighbors);
		}
		return connectedTiles;
	}

	draw(){
		if( !this.visible && !game_state.truesight && game_state.fov_enabled ){
			ctx.save();
	
			ctx.fillStyle = ( inBounds(this.x, this.y) ? COLOR_FOW : COLOR_BLACK );
			ctx.fillRect(this.x*tileSize.x,this.y*tileSize.y,tileSize.x,tileSize.y);
		
			ctx.restore();
		}

		if( this.spotted || game_state.truesight || !game_state.fov_enabled ){
			if( game_state.text_mode ){

				drawChar( this, this.x, this.y, this.renderOverride);
				if( this.inventory.length && this.passable ){
					if( !this.monster ){
						drawChar( {glyph: ( this.inventory.length == 1 ? this.inventory[0].glyph : 42), fillStyle: COLOR_BLACK}, this.x, this.y, this.renderOverride);
					}else if( this.monster ){
						if( this.visible || game_state.truesight || !game_state.fov_enabled ){
							ctx.save();
	
							ctx.font = '8px ega'; // calibri
							ctx.textBaseline = 'top';
							ctx.textAlign = 'right';
							ctx.fillStyle = COLOR_BLACK;
							ctx.strokeStyle = COLOR_YELLOW;
							ctx.lineWidth = 4;
							ctx.strokeText( String.fromCharCode(( this.inventory.length == 1 ? this.inventory[0].glyph : 42)), 
								this.monster.getDisplayX()*tileSize.x+1*tileSize.x, this.monster.getDisplayY()*tileSize.y);
							ctx.fillText( String.fromCharCode(( this.inventory.length == 1 ? this.inventory[0].glyph : 42)), 
								this.monster.getDisplayX()*tileSize.x+1*tileSize.x, this.monster.getDisplayY()*tileSize.y);
		
							ctx.restore();
						}else{
							drawChar( {glyph: ( this.inventory.length == 1 ? this.inventory[0].glyph : 42), fillStyle: COLOR_BLACK}, this.x, this.y, this.renderOverride);	
						}
					}
				}

				if(this.effectCounter){    
					this.effectCounter--;
					ctx.globalAlpha = this.effectCounter/15;
					drawChar( {fillStyle: this.effect.effectColor, glyph: this.effect.glyph}, this.x, this.y, { fillStyle: this.effect.effectFill });
					ctx.globalAlpha = 1;
				}

			}else{
				drawSprite(this.sprite, this.x, this.y);
			}
		}
	}

	setEffect(effectGlyph, effectColor, effectFill){
		this.effect = new Object;
		this.effect.glyph = effectGlyph;
		this.effect.effectColor = effectColor;
		this.effect.effectFill = effectFill;
		this.effectCounter = 30;
	}
}

class Wall extends Terrain {
  constructor(x, y){
		super(x, y, {x: 132, y: 208}, false);
		this.glyph = 9618; //35;
		this.renderOverride = { fillStyle: ( inBounds(x,y) ? COLOR_BLACK+Math.floor(13+Math.random()*3).toString(16)+Math.floor(13+Math.random()*3).toString(16) : COLOR_BLACK ) };
		this.transparent = false;
	}
}

class Tree extends Terrain {
  constructor(x, y){
		super(x, y, {x: 132, y: 208}, false);
		this.glyph = 165;
		this.transparent = false;
	}
}
class SpawnerWall extends Terrain {
  constructor(x, y){
		super(x, y, {x: 96, y: 0}, false);
		this.glyph = 34; //8226; //9619; //35;
		this.fillStyle = COLOR_RED;
		this.renderOverride = { fillStyle: COLOR_BLACK };
		this.transparent = false;
	}
}

class Generator extends Terrain {
  constructor(x, y){
		super(x, y, {x: 132, y: 208}, false);
		this.glyph = 9580;
		this.fillStyle = COLOR_GREEN_NEON; // COLOR_FUCHSIA;
		this.renderOverride = { fillStyle: COLOR_BLACK };
		this.transparent = false;

		let directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ];
    for(let k=0;k<directions.length;k++){
			let newTile = this;
			while(true){
				let testTile = newTile.getNeighbor(directions[k][0], directions[k][1]);
				if(testTile.passable ){
					newTile = testTile;
					if( newTile.constructor.name != 'Hazard' && !newTile.monster ){
						newTile.replace(Hazard);
					}
				}else{
					break;
				}
			}
		}
	}

	static async rebeam(){
		if( game_state.dungeon.mapgen.generator != 0.1 ){
			return false;
		}
		for( let i=0; i<numTiles; i++ ){
			for( let j=0; j<numTiles; j++ ){
				if( getTile(i,j).constructor.name == 'Generator' ){
					return getTile(i,j).replace(Generator);
				}
			}
		}
	}
}

class IceWall extends Terrain {
	// TODO: fixtures walled by Ice; place anywhere, then drunkwalk Wall -> Ice untill Floor
	// Make the ice meltable, and boom, ya done. Save this one for later-later
  constructor(x, y){
		super(x, y, {x: 132, y: 208}, false);
		this.glyph = 9618;
		this.fillStyle = COLOR_BLUE;
		this.renderOverride = { fillStyle: COLOR_WHITE };
		this.transparent = true;
	}
}

/*
	// TODO: Someday, perhaps. Doors.
	// You'd need a walk-into that turns vert / hori into open
	// Alternatively Doors could be monsters, that replace the tile they're on with Door_open
	// And make transparent go from false -> true, but that complicates things if I decide to add
	// door closing again...
	// For now they're commented out, because they don't fit the current mapgen
	// and also require more work than value added
*/
// class Door__open extends Terrain {
//   constructor(x, y){
// 		super(x, y, {x: 132, y: 208}, false);
// 		this.glyph = 43;
// 		this.fillStyle = COLOR_BLACK;
// 		this.renderOverride = { fillStyle: COLOR_WHITE };
// 		this.transparent = true;
// 	}
// }
// class Door__vert extends Terrain {
//   constructor(x, y){
// 		super(x, y, {x: 132, y: 208}, false);
// 		this.glyph = 9474; // |
// 		this.fillStyle = COLOR_BLACK;
// 		this.renderOverride = { fillStyle: COLOR_WHITE };
// 		this.transparent = false;
// 	}
// }
// class Door__hori extends Terrain {
//   constructor(x, y){
// 		super(x, y, {x: 132, y: 208}, false);
// 		this.glyph = 9472; // -
// 		this.fillStyle = COLOR_BLACK;
// 		this.renderOverride = { fillStyle: COLOR_WHITE };
// 		this.transparent = false;
// 	}
// }
class Chest extends Terrain {
  constructor(x, y){
		super(x, y, {x: 180, y: 112}, false);
		this.glyph = 8710;
	}
	// this.treasure turned out to be unneccessary, so question below is extra relevant
	// TODO: is a chest a Terrain or a Creature? Might be easier to have it be a creature
	// A non-spawnlist creature that yields treasure when slain?
}

class Crypt extends Terrain {
  constructor(x, y){
		super(x, y, {x: 180, y: 112}, false);
		this.glyph = 8745;
	}
}

class Floor extends Terrain {
  constructor(x, y){
		super(x, y, {x: 0, y: 0}, true);
		this.glyph = 8729; // 32
		this.fillStyle = COLOR_BLACK+Math.floor(4+Math.random()*12).toString(16)+Math.floor(4+Math.random()*12).toString(16);
	}
}

class Grass extends Terrain {
  constructor(x, y){
		super(x, y, {x: 0, y: 0}, true);
		this.glyph = 1522;
		this.fillStyle = COLOR_BLACK;//+Math.floor(4+Math.random()*12).toString(16)+Math.floor(4+Math.random()*12).toString(16);
	}
	stepOn(monster){
		if( !monster.fly ){
			if( monster.isPlayer ){
				new Message(`The ${this.constructor.name.toLowerCase()} softly rustles underfoot.`);
			}else{
				new Message(`You hear the soft swishing of ${this.constructor.name.toLowerCase()}.`);
			}
		}
		super.stepOn(monster);
	}
}

class Stairs_down extends Terrain {
  constructor(x, y){
		super(x, y, {x: 168, y: 48}, true); // >
		this.glyph = 62;
	}
	stepOn(monster){
		if(monster.isPlayer){
			Map.descend(player.hp);
		}
	}
}

class Stairs_up extends Terrain {
  constructor(x, y){
		super(x, y, {x: 144, y: 48}, true); // <
		this.glyph = 60;
	}
	stepOn(monster){
		if(monster.isPlayer){
			Map.ascend(player.hp);
		}
	}
}

class Pit extends Terrain {
	constructor(x, y){
		super(x, y, {x: 156, y: 224}, true); // ■
		this.glyph = 8857;
		this.hidden = true;
	}
	draw(){
		this.glyph = ( this.hidden && !game_state.truesight ? 8729 : 8857 );
		super.draw();
	}
	stepOn(monster){
		if(monster.isPlayer){ // should traps also trigger for monsters?
			if( !monster.fly ){
				new Message('The ground gives way!');
				monster.swing(2);
				if( monster.hp > 0 ){
					Map.descend(player.hp-1, true);
				}
			}
		}else{
			if( !monster.fly ){
				new Message('You hear something cry out!');
				monster.die();
				this.hidden = false;
			}
		}
	}
}

class Trap extends Terrain { // different kinds of traps? Rock fall trap, explosive trap, giga bomberman trap?
	constructor(x, y, trap){
		super(x, y, {x: 168, y: 80}, true); // ^
		this.glyph = 8729;
		this.hidden = true;
		this.trap = true; // "explosive", "teleporter" etc
	}
	draw(){
		this.glyph = ( this.hidden && !game_state.truesight ? 8729 : ( this.trap ? 632 : 8729 ) );
		super.draw();
	}
	stepOn(monster){
		if( !this.trap || monster.fly ){
			return;
		}
		if(monster.isPlayer){ // should traps also trigger for monsters?
			new Message('You are engulfed in a fiery explosion!');
			monster.swing(1); // this could be a different effect
			this.trap = false;
			//this.replace(Floor); // TODO: this replace Water + degrade armor -> rust trap
		}else{
			new Message('You hear an explosion.');
			monster.swing(1); // this could be a different effect
			this.trap = false;
			//this.replace(Floor); // TODO: this replace Water + degrade armor -> rust trap
		}
	}
}

class Hazard extends Terrain {
  constructor(x, y){
		super(x, y, {x: 0, y: 176}, true); // ░
		this.glyph = 9617;
		this.fillStyle = COLOR_FUCHSIA;
		this.renderOverride = { fillStyle: COLOR_GREEN_NEON };
	}
	draw(){
		ctx.save();
		
		ctx.fillStyle = this.renderOverride.fillStyle;
		ctx.fillRect(this.x*tileSize.x,this.y*tileSize.y,tileSize.x,tileSize.y);
		super.draw();

		ctx.restore();
	}
	stepOn(monster){
		if(monster.isPlayer){
			new Message('You are overcome with pain!');
		}else{
			// TODO: add silent intrinsic?
			if( monster.constructor.name != 'Boulder' ){
				new Message(`A ${monster.constructor.name} hisses in pain!`);
			}
		}
		if( monster.hp > 1 ){
			monster.swing(1); // this could be a different effect
		}
		// Bug zapper. TODO: split Hazard into Hazard and Forcefield
		// if( monster.hp > 1 ){
		// 	monster.hp = 1;
		// }else{
		// 	monster.swing(1);
		// }
	}
}
// class Hazard extends modifyHP ?

class Mud extends Terrain {
  constructor(x, y){
		super(x, y, {x: 12, y: 176}, true); // ▒
		this.glyph = 9618;
		this.renderOverride = { fillStyle: COLOR_BLUE };
	}
	draw(){
		ctx.save();
		
		ctx.fillStyle = this.renderOverride.fillStyle;
		ctx.fillRect(this.x*tileSize.x,this.y*tileSize.y,tileSize.x,tileSize.y);
		super.draw();

		ctx.restore();
	}
	stepOn(monster){
		if( monster.fly ){
			return;
		}
		if(monster.isPlayer){
			new Message(`You are slowed down by the mud.`);
			tick();
		}else{
			new Message('You hear a wet squelching sound...');
		}
	}
}
class Water extends Terrain { // fuck
	constructor(x, y){
		super(x, y, {x: 84, y: 240}, true); // ~
		this.glyph = 8776; //8776;
		this.fillStyle = COLOR_WHITE;
		this.renderOverride = { fillStyle: COLOR_BLUE };
	}
	draw(){
		ctx.save();
		
		ctx.fillStyle = this.renderOverride.fillStyle;
		ctx.fillRect(this.x*tileSize.x,this.y*tileSize.y,tileSize.x,tileSize.y);
		super.draw();

		ctx.restore();
	}
	stepOn(monster){
		if( monster.fly ){
			return;
		}
		if(monster.isPlayer){
			new Message('You move through the water.');
		}else{
			new Message('You hear the sound of water splashing...');
		}
	}
}