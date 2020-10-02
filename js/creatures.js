class Monster {
	constructor(tile, sprite, hp){
		this.move(tile);
		this.sprite = sprite;
		this.hp = hp;
		this.offsetX = 0;                                                   
		this.offsetY = 0;

		//this.hidden = true;
		this.moves = 1;
		this.moves_base = 1;
		this.moves_inc = 1;
		this.attacks = 1;
		this.attacks_base = 1;
		this.attacks_inc = 1;
	}

	getDisplayX(){                     
		return this.tile.x + this.offsetX;
	}
	getDisplayY(){                                                                  
		return this.tile.y + this.offsetY;
	} 
	draw(){
		if( ( game_state.fov_enabled && this.tile.visible ) || !game_state.fov_enabled || game_state.truesight ){
		//if( !this.hidden ){
			if( game_state.text_mode ){
				drawChar(this.glyph, this.getDisplayX(), this.getDisplayY());
			}else{
				drawSprite(this.sprite, this.getDisplayX(), this.getDisplayY());
			}

			this.drawHp();
		//}else{
		//	drawChar(63, this.getDisplayX(), this.getDisplayY());
		//}

			this.offsetX -= Math.sign(this.offsetX)*(1/8);     
			this.offsetY -= Math.sign(this.offsetY)*(1/8);
		}
	}

	drawHp(){
		if( this.hp > 0 ){
			ctx.save();

			ctx.font = '16px calibri';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			ctx.strokeStyle = COLOR_YELLOW;
			ctx.lineWidth = 4;
			ctx.strokeText( this.hp, this.getDisplayX()*tileSize.x, this.getDisplayY()*tileSize.y);
			ctx.fillText( this.hp, this.getDisplayX()*tileSize.x, this.getDisplayY()*tileSize.y);
			
			// bottom left ; attack value?
			// ctx.textBaseline = 'bottom';
			// ctx.fillText( this.hp, this.tile.x*tileSize.x, this.tile.y*tileSize.y+1*tileSize.y);

			// bottom right ; defense value?
			// ctx.textAlign = 'right';
			// ctx.textBaseline = 'bottom';
			// ctx.fillText( this.hp, this.tile.x*tileSize.x+1*tileSize.x, this.tile.y*tileSize.y+1*tileSize.y);

			ctx.restore();
		}
	}

	tryMove(dx, dy){
		let newTile = this.tile.getNeighbor(dx,dy);
		if(newTile.passable){
			if( Math.floor(this.moves) > 0 && !newTile.monster ){
				this.moves--;
				this.move(newTile);
			}else{
				if( Math.floor(this.attacks) > 0 && newTile.monster && this.isPlayer != newTile.monster.isPlayer ){
					this.attacks--;
					// TODO: use this.attack instead of hard 1?
					newTile.monster.swing(1);

					this.offsetX = (newTile.x - this.tile.x)/2;         
					this.offsetY = (newTile.y - this.tile.y)/2; 
				}
			}
			if( !this.isPlayer && this.checkActions() ){
				this.act();
			}else{
				return true;
			}
		}else{ // this entire else is so you can bump into walls and pass a turn
			this.moves--;
			// TODO: this might be where you bump a chest to open it, or try to push a boulder
			this.offsetX = (newTile.x - this.tile.x)/2;         
			this.offsetY = (newTile.y - this.tile.y)/2; 
			if( !this.isPlayer && this.checkActions() ){
				this.act();
			}else{
				return true;
			}
		}
	}

	swing(damage){
		// TODO: add swing-based accuracy instead of 100% accuracy
		this.hp -= damage;
		if( this.hp <= 0 ){
			this.die();
		}
	}

	die(){
		this.dead = true;
		this.tile.monster = null;
		this.sprite = 37; // %
	}

	move(tile, instant){
		if( this.tile ){
			this.tile.monster = null;
			if( !instant ){
				this.offsetX = this.tile.x - tile.x;
				this.offsetY = this.tile.y - tile.y;
			}
		}
		this.tile = tile;
		tile.monster = this;

		tile.stepOn(this);
	}

	update(){
		// stunned deprecated in favor of setting moves and attack to a negative value
		this.moves += this.moves_inc;
		this.moves = Math.min(this.moves, this.moves_base);
		this.attacks += this.attacks_inc;
		this.attacks = Math.min(this.attacks, this.attacks_base);
		if( !this.isPlayer ){
			this.act();
		}
	}

	act(){
		// TODO: this is where we'd use easystar for smort pathfinding
	 	let neighbors = this.tile.getAdjacentPassableNeighbors();
	 
	 	neighbors = neighbors.filter(t => !t.monster || t.monster.isPlayer);

	 	if( neighbors.length ){
			neighbors.sort((a,b) => a.dist(player.tile) - b.dist(player.tile));
			let newTile = neighbors[0];
			this.tryMove(newTile.x - this.tile.x, newTile.y - this.tile.y);
		}
	}

	// returns true if you have actions or attacks remaining
	checkActions(){
		return Math.floor(this.moves) > 0 && Math.floor(this.attacks) > 0;
	}
}

class Player extends Monster {
	constructor(tile){
		super(tile, {x: 0, y: 64}, 3); // @
		this.glyph = 64;
		this.isPlayer = true;
		//this.hidden = false;
	}

	inputHandler(e){
		// can add diagonals, menu keys etc
		switch (e.key) {
			case 'w':
			case 'ArrowUp':
				player.tryMove(0, -1);
				break;
			case 's':
			case 'ArrowDown':
				player.tryMove(0, 1);
				break;
			case 'a':
			case 'ArrowLeft':
				player.tryMove(-1, 0);
				break;
			case 'd':
			case 'ArrowRight':
				player.tryMove(1, 0);
				break;
			case '.':
				player.moves = 0;
				player.tryMove(0, 0);
				break;
			default:
				break;
		}
	}

	tryMove(dx, dy){
		this.calcFov();
		if( super.tryMove(dx,dy) ){
			//this.calcLos();
			//if( Math.floor(this.moves) <= 0 || Math.floor(this.attacks) <= 0 ){
			if( !this.checkActions() ){
				// world state ticks after each player movement
				tick();
			}
		}
	}

	// calcLos(){
	// 	for( let i=0; i<monsters.length; i++ ){
	// 		monsters[i].hidden = ( monsters[i].tile.dist(player.tile) < 6 ? false : true);
	// 	}
	// }

	calcFov(){
		if( game_state.truesight || !game_state.fov_enabled ){
			return;
		}
		for (let i = 0; i < tiles.length; i++) {
			let visibleTiles = tiles[i].filter( t=>t.visible );
			for ( let j = 0; j < visibleTiles.length; j++ ){
				visibleTiles[j].visible = false;
			}
		}

		let x = this.tile.x;
		let y = this.tile.y;
		fov.compute(x, y, 24, 
			(x, y) => tiles[x][y].passable,
    	(x, y) => tiles[x][y].visible = true
		);
	}
}

class Kobold extends Monster {
	constructor(tile){
		super(tile, {x: 132, y: 96}, 2); // k
		this.glyph = 107;
	}
}

class Goblin extends Monster {
	constructor(tile){
		super(tile, {x: 84, y: 96}, 1); // g
		this.glyph = 103;
		this.cooldown = 0;
	}
	update(){
		this.cooldown++;
		// every 7th turn
		// if you want only once, you can check this.cooldown == 7
		// or wrap this.cooldown++ in a limiting if statement
		if( this.cooldown % 7 == 0 ){ 
			console.warn(`The ${this.constructor.name} cackles!`);
			abilities.placeTrap(this);
			abilities.endTurn(this);
			//this.moves = 0;
			//this.attacks = 0;
		}else{
			super.update();
		}
	}
}

class Zombie extends Monster {
	constructor(tile){
		super(tile, {x: 120, y: 80}, 5); // Z
		this.glyph = 90;
		// instead of self-stunning every other turn, it builds up moves and attacks at a slower rate instead
		this.moves_inc = 0.5;
		this.attacks_inc = 0.5;
	}
}

class Quickling extends Monster {
	constructor(tile){
		super(tile, {x: 12, y: 112}, 1); // q
		this.glyph = 113;
		// inc and base are high, so it builds up 2 moves per turn
		// a monster with attacks_inc 1 and attacks_base 3 can "store" 3 attacks, and then gets to unleash them all
		// TODO: that's actually perfect for the player, base 4
		this.moves_inc = 2;
		this.moves_base = 2;
	}
}

class Ghost extends Monster {
	constructor(tile){
		super(tile, {x: 84, y: 64}, 3); // G
		this.glyph = 71;
	}
	swing(damage){ // teleports away when hit
		this.move(randomPassableTile(), true); //non-animated move
		super.swing(damage);
	}
}

// creature ideas
/*
	=	creature that winds up when you're clean cardinal LoS, then stuns you for 1 turn if that's still true the next turn
	= creature that, if it walks onto an item, throws that item in a cardinal direction closest to the player, with the chance of hitting other creatures
	= strength and armor degrade-on-hitters (resets at stairs)
	= gremlins ; enter water, fill each adjacent non-monster tile with NEW GREMLINS
	= creatures that teleport when hit
	= siren ; ability to force player to move in her direction
	= squid ; can't disengage?
	= death armor ; drops a random sword on death
	= death sword ; same but for weapon
	= enemy casters ; 1 spell, once 
	= troll ; every 3 turns self-stuns and regenerates 1 hp
	= ninja ; teleports away when hit, or teleports next to the player
	= clown ; spawns looking like something else, reveals true shape on taking damage
	= wyvern / bull ; if it has clean line of sight, mark that direction, then teleport in a line until it hits monster or terrain
	= mummy ; if on fire, move randomly and become able to attack anything
	= samurai ; on taking damage, enrage, then attack all adjacent squares next turn (fun times if you fill a room with samurai)
	= hydra ; gains hp from regular attacks
	= necromancer ; summon a DARK FLY from a corpse
	= wight ; sets monster's attacks to 0 on hit

	= bosses ; abilities
*/

function generateMonsters() {
	monsters = [];
	let numMonsters = game_state.depth+game_state.initial_spawn;
	for(let i=0;i<numMonsters;i++){
			spawnMonster();
	}
}

function spawnMonster() {
	let monsterType = shuffle([Goblin, Kobold, Zombie, Ghost, Quickling])[0];
	// spawn from air
	//let monster = new monsterType(randomPassableTile());
	// spawn from next to a spawner wall
	var spawnSpots = [];
	if( spawners.length ){
		for( spawner of spawners ){
			var openSpots = spawner.getAdjacentPassableNeighbors().filter(t => !t.monster);
			if( openSpots.length ){
				for( spot of openSpots ){
					spawnSpots.push(spot);
				}
			}
		}
		if( spawnSpots.length ){
			let monster = new monsterType(shuffle(spawnSpots)[0]);
			abilities.endTurn(monster);
					//monster.moves = 0;
					//monster.attacks = 0;

			monsters.push(monster);
		}else{
			console.warn('The dungeon overflows!');
		}
	}
	
}

function spawnTicker() {
	spawnCounter--;
  if(spawnCounter <= 0){  
    spawnMonster();
    spawnCounter = spawnRate;
    spawnRate--;
  }
}