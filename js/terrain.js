class Terrain {
	constructor(x, y, sprite, passable) {
		this.x = x;
		this.y = y;
		this.fillStyle = COLOR_BLACK;
		this.renderOverride = false;
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
		if( !this.visible && !game_state.truesight && game_state.fov_enabled ){
			ctx.save();
	
			ctx.fillStyle = COLOR_FOW;
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
	}
}
class SpawnerWall extends Terrain {
  constructor(x, y){
		super(x, y, {x: 96, y: 0}, false);
		this.glyph = 34; //8226; //9619; //35;
		this.fillStyle = COLOR_RED;
		this.renderOverride = { fillStyle: COLOR_BLACK };
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
			console.warn('The ground gives way!');
			monster.swing(2);
			if( monster.hp > 0 ){
				game_state.depth++;
				startLevel(player.hp);
			}
		}else{
			console.warn('You hear something cry out!');
			monster.die();
			this.hidden = false;
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
		if( !this.trap ){
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
		return initMap();
	}

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

function initMap(){
	tiles = [];
	for( let i=0; i<numTiles; i++ ){
		tiles[i] = [];
		for( let j=0; j<numTiles; j++ ){
			tiles[i][j] = new Floor(i,j);
		}
	}
}

class Room {
	constructor(wmin, hmin, wmax, hmax, tries, x, y) { // x and y coords are for overrides
		var start_x = Math.floor( Math.random() * ( numTiles - wmax ) );
		var start_y = Math.floor( Math.random() * ( numTiles - hmax ) );
		console.warn(`Starting construction at ${start_x}, ${start_y}`);
		var built_x = 0;
		var built_y = 0;
		
		// test run
		for( let i=start_x; i<start_x+wmax; i++ ){ // rows
			built_x++;
			built_y = 0;
			for( let j=start_y; j<start_y+hmax; j++ ){ // columns
				if( tiles[i][j].constructor.name == 'Wall' ){
					built_y++;
				}else{
					if( built_y < hmin || built_x < wmin ){
						if( tries > 0 ){
							console.warn(`Could not place a room at ${start_x}, ${start_y}. ${tries} tries remaining!`);
							return new Room( wmin, hmin, wmax, hmax, (tries-1) );
						}else{
							return;
						}
					}
				}
			}
		}

		console.error(`Space for a room ${built_x} by ${built_y} from ${wmax} by ${hmax} at ${start_x}, ${start_y}`);

		//var start_x = Math.floor( Math.random() * ( wmax - built_x ) ) + wmin -1;
		//var start_y = Math.floor( Math.random() * ( hmax - built_y ) ) + hmin -1;
		// for realsies
		for( let i=start_x+1; i<start_x+built_x-1; i++ ){ // rows
			for( let j=start_y+1; j<start_y+built_y-1; j++ ){ // columns
				tiles[i][j] = new Floor(i,j);
			}
		}

		roomList.push({x: start_x+1, y: start_y+1, w:start_x+built_x-1, h:start_y+built_y-1});
	}
}