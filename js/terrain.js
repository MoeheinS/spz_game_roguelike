class Terrain {
	constructor(x, y, sprite, passable) {
		this.x = x;
		this.y = y;
		this.fillStyle = COLOR_BLACK;
		this.renderOverride = false;
		this.sprite = sprite;
		this.passable = passable;
		this.transparent = true;
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
				if( this.monster && this.visible ){
					drawChar( this.monster, this.monster.offsetX + this.x, this.monster.offsetY + this.y, this.renderOverride);
				}else{
					drawChar( this, this.x, this.y, this.renderOverride);
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
class SpawnerWall extends Terrain {
  constructor(x, y){
		super(x, y, {x: 96, y: 0}, false);
		this.glyph = 34; //8226; //9619; //35;
		this.fillStyle = COLOR_RED;
		this.renderOverride = { fillStyle: COLOR_BLACK };
		this.transparent = false;
	}
}

class Chest extends Terrain {
  constructor(x, y, treasure){
		super(x, y, {x: 180, y: 112}, false);
		this.glyph = 8710;
		this.treasure = treasure;
	}
	// on enter block movement and yield treasure
	// TODO is a chest a Terrain or a Creature? Might be easier to have it be a creature
}

class Floor extends Terrain {
  constructor(x, y){
		super(x, y, {x: 0, y: 0}, true);
		this.glyph = 8729; // 32
		this.fillStyle = COLOR_BLACK+Math.floor(4+Math.random()*12).toString(16)+Math.floor(4+Math.random()*12).toString(16);
	}
}

class Stairs_down extends Terrain {
  constructor(x, y){
		super(x, y, {x: 168, y: 48}, true); // >
		this.glyph = 62;
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
		super(x, y, {x: 144, y: 48}, true); // <
		this.glyph = 60;
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
				console.warn('The ground gives way!');
				monster.swing(2);
				if( monster.hp > 0 ){
					game_state.depth++;
					startLevel(player.hp);
				}
			}
		}else{
			if( !monster.fly ){
				console.warn('You hear something cry out!');
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
			console.warn('KABOOM');
			monster.swing(1); // this could be a different effect
			this.trap = false;
			//this.replace(Floor); // TODO: this replace Water + degrade armor -> rust trap
		}else{
			console.warn('You hear a KABOOM');
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
			console.warn('GLOOP GLOOP');
			tick();
		}else{
			console.warn('You hear glooping...');
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
			console.warn('SPLISH SPLASH');
		}else{
			console.warn('You hear splashing...');
		}
	}
}

//TODO: can I make this async?
// generateLevel(player.tile.x, player.tile.y)
function generateLevel(test){
	if( test ){
		return initMap(Floor);
	}

	// OLD levelgen
	/*
	tryTo('generate map', function(){
		return generateTiles() == randomPassableTile().getConnectedTiles().length;
		// && ( coords ? getTile(coords.x,coords.y).passable : true ); times out level gen
	}, 3000);

	randomPassableTile('Floor').replace(Stairs_down);
	if( game_state.depth > 1 ){
		randomPassableTile('Floor').replace(Stairs_up); 
	}
	*/

	createSpawners();

	randomPassableTile('Floor').replace(Water);
	randomPassableTile('Floor').replace(Pit);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Trap);
	randomPassableTile('Floor').replace(Hazard);
	randomPassableTile('Floor').replace(Mud);

	generateMonsters();
}

function createSpawners(){
	spawners = [];
  for( let i=0; i<numTiles; i++ ){
		
		var walls = tiles[i].filter(t => t.constructor.name == 'Wall' && t.getAdjacentPassableNeighbors().length && t.getAdjacentPassableNeighbors().length < 3);
		if( walls.length ){
			for( w of walls ){
				if( Math.random() < 0.25 ){
					w.replace(SpawnerWall);
					spawners.push(w);
				}
			}
		}
  }
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



function drunkWalk(tile, diagonals, allowedType){
	var attempt = tile.getAdjacentNeighbors(diagonals)[0];
	// if( inBounds(attempt.x,attempt.y)){
	// 	return attempt;
	// }else{
	// 	return tile;
	// }
	//return ( inBounds(attempt.x,attempt.y) ? ( attempt.constructor.name == allowedType.name ? attempt : false ) : false );
	return ( inBounds(attempt.x,attempt.y) ? attempt : false );
}

function drunkWalker(seed, target, type_to){
	var carves = 0;
	var fails = 0;
	var target_og = target;
	while( target-- ){
		if( fails > target_og ){
			console.error('whoops, too many fails');
			return seed;
		}
		let process = drunkWalk(seed, true, Wall);
		if( !process ){
			console.warn('cant drunkwalk');
			target++;
			fails++;
		}else{
			if( process.constructor.name != type_to.name ){
				carves++;
			}
			process.replace(type_to);
			seed = process;
		}
		drunkWalk(seed, true, Wall);
	}
	if( target <= 0 ){
		console.warn(`out of booze after ${carves} carves with ${fails} fails, boss`);
		return seed;
	}
}

// levelgen_dw(600, player.tile);
// NOTE: do I need a direction? For going up / down?
function levelgen_dw(target, seed, canUp){
	initMap(Wall);
	var seed = ( seed ? seed : randomTile('Wall') );
	var lastTile = drunkWalker(seed, target, Floor);
	if( canUp ){ 
		seed.replace(Stairs_up);
	}
	if( seed == lastTile ){
		console.warn('Back where we began');
		randomPassableTile('Floor').replace(Stairs_down);
	}else{
		lastTile.replace(Stairs_down);
	}
}

function initMap(tileType){
	tiles = [];
	for( let i=0; i<numTiles; i++ ){
		tiles[i] = [];
		for( let j=0; j<numTiles; j++ ){
			tiles[i][j] = new tileType(i,j);
		}
	}
}

class Room { // new Room(0,0,tileMap); // instead of tileMap use tileMap_down once and tileMap_up once
	constructor(x,y, allowedRooms) {
		var orig_chosenRoom = shuffle(allowedRooms)[0];
		var chosenRoom = orig_chosenRoom;
		var rotations = Math.floor(Math.random()*4);
		if( rotations ){ // 0, 1, 2, 3
			for (let i = 0; i < rotations; i++) {
				console.log('transposed!');
				chosenRoom = transpose(chosenRoom);
			}
		}

		var start_x = 1+ x * chosenRoom.length;
		var start_y = 1+ y * chosenRoom.length;
		
		for( let i=0; i<chosenRoom.length; i++ ){ // rows
			for( let j=0; j<chosenRoom[i].length; j++ ){ // columns
				let roomType = eval(chosenRoom[i][j]);
				// NOTE: if roomType == 'Gimme a Boulder yo', place monster boulder else eval
				// also if Spawner wall, add to spawners list then eval and place
				// optionally replace Walls for SpawnerWalls here?
				//tiles[i][j] = new roomType(i,j);
				tiles[start_x+i][start_y+j].replace(roomType);
			}
		}
	}
}

//randomizeMap(3,3,1)
function randomizeMap(x, y, seed){
	for (let i = 0; i < x; i++) {
		for (let j = 0; j < y; j++) {
			if( seed > Math.random() ){
				new Room(i, j, tileMap);
			}
		}
	}
}