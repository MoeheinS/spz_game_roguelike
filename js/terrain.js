class Terrain {
	constructor(x, y, sprite, passable) {
		this.x = x;
		this.y = y;
		this.sprite = sprite;
		this.passable = passable;
	}
	
	stepOn(monster){
		//TODO: this does nothing, and rightfully so
		if( monster.isPlayer ){
			let hiddenNeighbors = this.getAdjacentNeighbors().filter(t => t.hidden);
			for (let i = 0; i < hiddenNeighbors.length; i++) {
				hiddenNeighbors[i].reveal();
			}
		}
	}

	reveal(){
		this.hidden = false;
		console.warn('You spot a '+this.constructor.name);
	}

	// pass a class as arg
	replace(newTileType){
		tiles[this.x][this.y] = new newTileType(this.x, this.y);
		return tiles[this.x][this.y];
	}

	//manhattan distance
	dist(other){
		return Math.abs(this.x-other.x)+Math.abs(this.y-other.y);
	}

	getNeighbor(dx, dy){
		return getTile(this.x + dx, this.y + dy)
	}
	
	getAdjacentNeighbors(){
		return shuffle([
				this.getNeighbor(0, -1),
				this.getNeighbor(0, 1),
				this.getNeighbor(-1, 0),
				this.getNeighbor(1, 0)
		]);
	}

	getAdjacentPassableNeighbors(){
		return this.getAdjacentNeighbors().filter(t => t.passable);
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
		if( !this.hidden || game_state.truesight ){
			drawChar(this.sprite, this.x, this.y);

			if( !this.visible && !game_state.truesight && game_state.fov_enabled ){
				ctx.save();
		
				ctx.fillStyle = COLOR_FOW;
				ctx.fillRect(this.x*tileSize,this.y*tileSize,tileSize,tileSize);
			
				ctx.restore();
			}
			
		}
	}
}

class Wall extends Terrain {
  constructor(x, y){
    super(x, y, 35, false); // 9608 █
	}
	draw(){
		ctx.save();
		
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(this.x*tileSize,this.y*tileSize,tileSize,tileSize);
		
		//ctx.fillStyle = COLOR_YELLOW;
		//drawChar(this.sprite, this.x, this.y);
		ctx.restore();
	}
}
class SpawnerWall extends Terrain {
  constructor(x, y){
		super(x, y, 35, false); // 9608 █
	}
	draw(){
		ctx.save();
		
		ctx.fillStyle = COLOR_BLACK;
		ctx.fillRect(this.x*tileSize,this.y*tileSize,tileSize,tileSize);
		
		ctx.fillStyle = COLOR_YELLOW;
		drawChar(this.sprite, this.x, this.y);
		ctx.restore();
	}
}

class Chest extends Wall {
  constructor(x, y, treasure){
		super(x, y, 8962); // 8962⌂ 9580╬
		this.treasure = treasure;
	}
	// on enter block movement and yield treasure
	// TODO is a chest a Terrain or a Creature? Might be easier to have it be a creature
}

class Floor extends Terrain {
  constructor(x, y){
    super(x, y, 32, true); // or a space
	}
}

class Stairs_down extends Terrain {
  constructor(x, y){
    super(x, y, 62, true); // >
	}
	stepOn(monster){
		if(monster.isPlayer){
			game_state.depth++;
			startLevel(Math.min(game_state.maxHp, player.hp+1));
		}
	}
}

class Stairs_up extends Terrain {
  constructor(x, y){
    super(x, y, 60, true); // <
	}
	stepOn(monster){
		if(monster.isPlayer){
			game_state.depth--;
			startLevel(player.hp);
		}
	}
}

class Pit extends Terrain {
	constructor(x, y){
		super(x, y, 9632, true); // ■
		this.hidden = true;
	}
	stepOn(monster){
		if(monster.isPlayer){ // should traps also trigger for monsters?
			console.warn('The ground gives way!');
			monster.swing(2);
			if( monster.hp > 0 ){
				game_state.depth++;
				startLevel(player.hp);
			}
		}else{
			console.warn('You hear something cry out!');
			monster.swing(99);
			this.hidden = false;
		}
	}
}

class Trap extends Terrain { // different kinds of traps? Rock fall trap, explosive trap, giga bomberman trap?
	constructor(x, y, trap){
		super(x, y, 94, true); // ^
		this.hidden = true;
		this.trap = trap;
	}
	stepOn(monster){
		if(monster.isPlayer){ // should traps also trigger for monsters?
			console.warn('KABOOM');
			monster.swing(1); // this could be a different effect
			this.replace(Floor); // TODO: this replace Water + degrade armor -> rust trap
		}else{
			console.warn('You hear a KABOOM');
			monster.swing(1); // this could be a different effect
			this.replace(Floor); // TODO: this replace Water + degrade armor -> rust trap
		}
	}
}

class Hazard extends Terrain {
  constructor(x, y){
    super(x, y, 9617, true); // ░
	}
	stepOn(monster){
		if(monster.isPlayer){
			console.warn('It burns!');
		}else{
			console.warn(`A ${monster.constructor.name} hisses in pain!`);
		}
		if( monster.hp > 1 ){
			monster.swing(1); // this could be a different effect
		}
	}
}
// class Hazard extends modifyHP ?

class Mud extends Terrain {
  constructor(x, y){
    super(x, y, 9618, true); // ▒
	}
	stepOn(monster){
		if(monster.isPlayer){
			console.warn('GLOOP GLOOP');
			tick();
		}else{
			console.warn('You hear glooping...');
		}
	}
}
class Water extends Terrain { // fuck
	constructor(x, y){
		super(x, y, 126, true); // ~
	}
	draw(){ // white on blue
		ctx.save();
		
		ctx.fillStyle = COLOR_BLUE;
		ctx.fillRect(this.x*tileSize,this.y*tileSize,tileSize,tileSize);
		
		ctx.fillStyle = COLOR_WHITE;
		drawChar(this.sprite, this.x, this.y);

		super.draw();

		ctx.restore();
	}
	stepOn(monster){
		if(monster.isPlayer){
			console.warn('SPLISH SPLASH');
		}else{
			console.warn('You hear splashing...');
		}
	}
}

//TODO: can I make this async?
// generateLevel(player.tile.x, player.tile.y)
function generateLevel(){
  tryTo('generate map', function(){
		return generateTiles() == randomPassableTile().getConnectedTiles().length;
		// && ( coords ? getTile(coords.x,coords.y).passable : true ); times out level gen
	}, 3000);
	
	randomPassableTile('Floor').replace(Stairs_down);
	if( game_state.depth > 1 ){
		randomPassableTile('Floor').replace(Stairs_up); 
	}

	randomPassableTile('Floor').replace(Water);
	randomPassableTile('Floor').replace(Pit);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Hazard);
	randomPassableTile('Floor').replace(Mud);

	generateMonsters();
}

function generateTiles(){
	let passableTiles=0;
	tiles = [];
	spawners = [];
  for( let i=0; i<numTiles; i++ ){
		tiles[i] = [];
		for( let j=0; j<numTiles; j++ ){
			// spawn rate of 0.3 cumulative for non-passable at 24x24 works
			if( Math.random() < 0.2 || !inBounds(i,j) ){
				tiles[i][j] = new Wall(i,j);
			}else if( Math.random() > 0.95 ){
				tiles[i][j] = new SpawnerWall(i,j);
				spawners.push(tiles[i][j]);
			}else{
				tiles[i][j] = new Floor(i,j);
				passableTiles++;
			}
		}
  }
  return passableTiles;
}