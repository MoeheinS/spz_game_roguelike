class Monster {
	constructor(tile, sprite, hp){
		this.uid = randomUID();
		this.move(tile);
		this.sprite = sprite;
		this.fillStyle = COLOR_BLACK;
		this.bloodColor = COLOR_RED;

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
		//this.alerted = false;
		this.bonusAttack = 0; // TODO: this ties into the TSL-like combat system

		this.stamina = 3;
		this.stamina_base = 3;

		this.lastMove = [0,0];  
		this.canDiagonal = true;

		this.fly = false;
		this.phaseWalls = false; // lets ghost pass walls, lets player phase walls when DASHing, then set back to false

		this.inventory = [];
		this.move(getTile(tile.x, tile.y), true, true); // to prevent ouroboros shenanigans
	}

	getDisplayX(){                     
		return this.tile.x + this.offsetX;
	}
	getDisplayY(){                                                                  
		return this.tile.y + this.offsetY;
	} 
	draw(){
		if( ( game_state.fov_enabled && this.tile.visible ) || !game_state.fov_enabled || game_state.truesight ){
			// NOTE: moved rendering creatures to Terrain logic
			if( game_state.text_mode ){
				drawChar(this, this.getDisplayX(), this.getDisplayY());
			}else{
				drawSprite(this.sprite, this.getDisplayX(), this.getDisplayY());
			}

			this.drawHp();

			// Experimental: Last-move direction indicator
			ctx.save();
			ctx.fillStyle = COLOR_GREEN_NEON;
			ctx.fillRect(
				this.getDisplayX()*tileSize.x + tileSize.x*0.5 + tileSize.x*this.lastMove[0]*0.5 - 2,
				this.getDisplayY()*tileSize.y + tileSize.y*0.5 + tileSize.x*this.lastMove[1]*0.5 - 2,
				4,
				4
			);
			ctx.restore();

			this.offsetX -= Math.sign(this.offsetX)*(1/8);     
			this.offsetY -= Math.sign(this.offsetY)*(1/8);
		}
	}

	drawHp(){
		if( this.hp > 0 ){
			ctx.save();

			ctx.font = '8px ega'; // calibri
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			ctx.strokeStyle = COLOR_YELLOW;
			ctx.lineWidth = 4;
			ctx.strokeText( this.hp, this.getDisplayX()*tileSize.x, this.getDisplayY()*tileSize.y);
			ctx.fillText( this.hp, this.getDisplayX()*tileSize.x, this.getDisplayY()*tileSize.y);
			
			// To render the tile you're standing on in the corner;
			// ctx.textAlign = 'right';
			// ctx.strokeStyle = COLOR_YELLOW;
			// ctx.lineWidth = 4;
			// ctx.strokeText( String.fromCharCode(this.tile.glyph), this.getDisplayX()*tileSize.x+1*tileSize.x, this.getDisplayY()*tileSize.y);
			// ctx.fillText( String.fromCharCode(this.tile.glyph), this.getDisplayX()*tileSize.x+1*tileSize.x, this.getDisplayY()*tileSize.y);

			// if( this.alerted ){
			// 	ctx.textAlign = 'right';
			// 	ctx.strokeStyle = COLOR_YELLOW;
			// 	ctx.lineWidth = 4;
			// 	ctx.strokeText( '!', this.getDisplayX()*tileSize.x+1*tileSize.x, this.getDisplayY()*tileSize.y);
			// 	ctx.fillText( '!', this.getDisplayX()*tileSize.x+1*tileSize.x, this.getDisplayY()*tileSize.y);
			// }

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
		// if( !this.alerted && !this.isPlayer ){
		// 	return true;
		// }
		let newTile = this.tile.getNeighbor(dx,dy);
		if(newTile.passable || this.phaseWalls){
			this.lastMove = [dx,dy];
			if( Math.floor(this.moves) > 0 && !newTile.monster ){
				this.moves--;
				this.move(newTile);
			}else{
				if( Math.floor(this.attacks) > 0 && newTile.monster && this.isPlayer != newTile.monster.isPlayer ){
					this.attacks--;
					// TODO: use this.attack instead of hard 1?
					newTile.monster.swing(1 + this.bonusAttack);
					this.bonusAttack = 0;

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
		// BLEED
		this.tile.renderOverride = { fillStyle: this.bloodColor };
		this.dead = true;
		this.glyph = 37; // %
		// TODO: optionally some creatures could turn into something else on death...
		this.void();
	}

	void(){
		console.log(`A ${this.constructor.name} (${this.uid}) is destroyed`);
		let myIndex = monsters.findIndex( t => t.uid == this.uid );
		monsters.splice(myIndex, 1);
		this.tile.monster = null;
	}

	move(tile, instant, debug_teleport){
		if( this.tile ){
			this.tile.monster = null;
			if( !instant ){
				this.offsetX = this.tile.x - tile.x;
				this.offsetY = this.tile.y - tile.y;
			}
		}
		this.tile = tile;
		tile.monster = this;

		if( typeof tile.stepOn === 'function' && !debug_teleport){ // this is necessary because LOL ouroboros
			tile.stepOn(this);
		}
	}

	async update(){
		// stunned deprecated in favor of setting moves and attack to a negative value
		this.moves += this.moves_inc;
		this.moves = Math.min(this.moves, this.moves_base);
		this.attacks += this.attacks_inc;
		this.attacks = Math.min(this.attacks, this.attacks_base);
		this.stamina = Math.min(this.stamina+1, this.stamina_base);
		if( !this.isPlayer ){
			this.act();
		}
	}

	act(){
		let neighbors = [];
		if( this.phaseWalls ){
			neighbors = this.tile.getAdjacentNeighbors(this.canDiagonal);
		}else{
			neighbors = this.tile.getAdjacentPassableNeighbors(this.canDiagonal);
		}
	 
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

class Boulder extends Monster {
	constructor(tile){
		super(tile, {x: 0, y: 0}, 2); // k
		this.glyph = 9679;
	}

	async update(){
		return;
	}

	draw(){
		if( ( game_state.fov_enabled && this.tile.visible ) || !game_state.fov_enabled || game_state.truesight ){
			if( game_state.text_mode ){
				drawChar(this, this.getDisplayX(), this.getDisplayY());
			}else{
				drawSprite(this.sprite, this.getDisplayX(), this.getDisplayY());
			}
			this.offsetX -= Math.sign(this.offsetX)*(1/8);     
			this.offsetY -= Math.sign(this.offsetY)*(1/8);
		}
	}

	swing(){
		// move when struck; might work for creatures as well if followed up with super.swing()?
		let nx = this.tile.x - player.tile.x;
		let ny = this.tile.y - player.tile.y;
		if( Math.abs(nx) == 1 || Math.abs(ny) == 1 ){
			this.tryMove(nx, ny);
		}
	}

	tryMove(dx, dy){
		let newTile = this.tile.getNeighbor(dx,dy);
		if(newTile.passable){
			if( !newTile.monster ){
				new Message(`The ${this.constructor.name} moves.`);
				this.move(newTile);
			}
			return true;
		}else{ // this entire else is so you can bump into walls and pass a turn
			this.offsetX = (newTile.x - this.tile.x)/2;         
			this.offsetY = (newTile.y - this.tile.y)/2; 
			return true;
		}
	}
}

class Player extends Monster {
	constructor(tile){
		super(tile, {x: 0, y: 64}, 3); // @
		this.glyph = 64;
		this.fillStyle = COLOR_BLACK; // COLOR_RED , COLOR_BLUE
		this.isPlayer = true;
		//this.hidden = false;
	}

	inputHandler(e){
		// can add diagonals, menu keys etc
		if( game_state.interact_mode == 'player' ){
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
				// diagonals
				case 'u':
					player.tryMove(-1, -1);
					break;
				case 'i':
					player.tryMove(1, -1);
					break;
				case 'j':
					player.tryMove(-1, 1);
					break;
				case 'k':
					player.tryMove(1, 1);
					break;
				case '.':
					player.moves = 0;
					player.tryMove(0, 0);
					break;
				case 'l':
					game_state.interact_mode = 'camera';
					break;
				default:
					break;
			}
		}else if( game_state.interact_mode == 'camera' ){
			switch (e.key) {
				case 'w':
				case 'ArrowUp':
					game_state.camera_offset.y--;
					break;
				case 's':
				case 'ArrowDown':
					game_state.camera_offset.y++;
					break;
				case 'a':
				case 'ArrowLeft':
					game_state.camera_offset.x--;
					break;
				case 'd':
				case 'ArrowRight':
					game_state.camera_offset.x++;
					break;
				// diagonals
				case 'u':
					game_state.camera_offset.x--;
					game_state.camera_offset.y--;
					break;
				case 'i':
					game_state.camera_offset.x++;
					game_state.camera_offset.y--;
					break;
				case 'j':
					game_state.camera_offset.x--;
					game_state.camera_offset.y++;
					break;
				case 'k':
					game_state.camera_offset.x++;
					game_state.camera_offset.y++;
					break;
				case '.':
					game_state.camera_offset.x = 0;
					game_state.camera_offset.y = 0;
					break;
				case 'l':
					game_state.camera_offset.x = 0;
					game_state.camera_offset.y = 0;
					game_state.interact_mode = 'player';
					break;
				default:
					break;
			}
			var inspectedTile = getTile(player.tile.x + game_state.camera_offset.x, player.tile.y + game_state.camera_offset.y);
			console.log(inspectedTile);
			console.log(`spotted:${inspectedTile.spotted}, visible:${inspectedTile.visible}`);
		}else if( game_state.interact_mode == 'input' ){
			switch (e.key) {
				case 'w':
				case 'ArrowUp':
					player.lastMove = [0, -1];
					break;
				case 's':
				case 'ArrowDown':
					player.lastMove = [0, 1];
					break;
				case 'a':
				case 'ArrowLeft':
					player.lastMove = [-1, 0];
					break;
				case 'd':
				case 'ArrowRight':
					player.lastMove = [1, 0];
					break;
				// diagonals
				case 'u':
					player.lastMove = [-1, -1];
					break;
				case 'i':
					player.lastMove = [1, -1];
					break;
				case 'j':
					player.lastMove = [-1, 1];
					break;
				case 'k':
					player.lastMove = [1, 1];
					break;
				case '.':
					player.lastMove = [0, 0];
					break;
				default:
					game_state.callback = false;
					break;
			}
			game_state.interact_mode = 'player';
			if( game_state.callback ){
				return game_state.callback(player);
			}
		}
	}

	tryMove(dx, dy){
		if( super.tryMove(dx,dy) ){
			if( !this.checkActions() ){
				// world state ticks after each player movement
				tick();
			}
		}
	}

	calcLos(){
	// proximity based trigger
	// 	for( let i=0; i<monsters.length; i++ ){
	// 		monsters[i].hidden = ( monsters[i].tile.dist(player.tile) < 6 ? false : true);
	// 	}
		let x = this.tile.x;
		let y = this.tile.y;
		fov.compute(x, y, 6, 
			function(x, y){ tiles[x][y].passable },
			function(x, y){ if( tiles[x][y].monster && !tiles[x][y].monster.isPlayer ){ tiles[x][y].monster.alerted = true; } }
		);
	}

	async update(){
		this.calcFov();
		super.update();
	}

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
		fov.compute(x, y, 3, // 7 is a high end light source. 11+ gives issues with edges on large blocks 
			(x, y) => tiles[x][y].passable,
    	function(x, y){ tiles[x][y].visible = true; tiles[x][y].spotted = true; }
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
	async update(){
		this.cooldown++;
		// every 7th turn
		// if you want only once, you can check this.cooldown == 7
		// or wrap this.cooldown++ in a limiting if statement
		if( this.cooldown % 7 == 0 ){ 
			new Message(`The ${this.constructor.name} cackles!`);
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
		this.glyph = 912; //71;
		this.fly = true;
		this.phaseWalls = true;
	}
	swing(damage){ // teleports away when hit
		this.move(randomPassableTile(), true); //non-animated move
		super.swing(damage);
	}
	die(){ // copied because ghosts don't bleed
		this.dead = true;
		this.tile.monster = null;
		this.glyph = 37; // %
		// TODO: optionally some creatures could turn into something else on death...
		let myIndex = monsters.findIndex( t => t.uid == this.uid );
		monsters.splice(myIndex, 1);
	}
}

class Samurai extends Monster {
	constructor(tile){
		super(tile, {x: 0, y: 0}, 2); // s
		this.glyph = 115;
	}
	swing(damage){ // unleashes a whirlwind attack when damaged, kek
		super.swing(damage);
		if( this.hp > 0 ){
			abilities.WHIRLWIND(this);
		}
	}
}

class Centipede extends Monster {
	constructor(tile){
		super(tile, {x: 0, y: 0}, 1); // c
		this.glyph = 99;
	}
}

// It works, but it's not FUN
// class Troll extends Monster { // every 3 turns self-stuns and regenerates 1 hp -> like AURA but less range
// 	constructor(tile){
// 		super(tile, {x: 0, y: 0}, 4); // T
// 		this.glyph = 84;
// 		this.attacks_inc = 0.25; // ssssslow attacks?
// 		this.cooldown = 0;
// 	}
// 	update(){
// 		this.cooldown++;
// 		if( this.cooldown % 8 == 0 && this.hp > 1 && this.hp < 4 ){ 
// 			console.warn(`The ${this.constructor.name}'s flesh ripples! It looks healthier!`);
// 			abilities.MEND(this);
// 		}else{
// 			super.update();
// 		}
// 	}
// }

// creature ideas
/*
	= creature that, if it walks onto an item, throws that item in a cardinal direction closest to the player, with the chance of hitting other creatures
	= strength and armor degrade-on-hitters (resets at stairs)
	= gremlins ; 268 ; enter water, fill each adjacent non-monster tile with NEW GREMLINS -> turn the water into mud tho, to prevent infinity spawning
	= creatures that teleport when hit
	= siren ; ability to force player to move in her direction (and lower moves by 1; do this every 3rd turn IF line of sight)
	= squid ; can't disengage?
	= death armor ; drops a random armor on death?
	= death sword ; same but for swords
	= enemy casters ; 1 spell, once -> "Summon zombie", "Summon ghost", "Bolt"
	= ninja ; teleports away when hit, or teleports next to the player -> or swap places with another monster!
	= clown ; spawns looking like something else, reveals true shape on taking damage -> 2 hp, Math.random glyph on constructor
	= wyvern / bull ; if it has clean line of sight, mark that direction, then teleport in a line until it hits monster or terrain -> BOLT_travel / dash
		-> if this.tile.x / y == player.tile.x / y ; check for ability
		-> YELL, then dash, so if you move away it YELLS again, building up its damage. But it'll DASH regardless of other monsters in the way, so you can use it to kill monsters
	= mummy ; if on fire, move randomly and become able to attack anything -> very zelda-poi, pass
	= hydra ; gains hp from regular attacks
	= necromancer ; 8486 ; summon a DARK FLY from a corpse -> requires corpse persistence, meh. Instead summon dark fly from MUD. Every turn until stopped?
		-> turn MUD into a mud puppet, replacing it with FLOOR. Range floor-wide or adjacent?
	= dark fly ; can only move diagonally
	= poisonous snake? ; 199 ; does a dash?
	= wight ; sets monster's attacks to 0 on hit -> or gives -5 attack bonus on hit; do-able
	= golem / brute ; when next to a boulder, make the boulder DASH
		-> when cardinal to player , create boulder between you and player. when cardinal to boulder, boulder DASH. Seems like good BOSS mechanics
		-> maybe also use it on creatures?
	= ghoul / vampire ; drain HP from another creature, leaving it at 1 and absorbing the difference into yourself. If you go over maxhp, empower attack instead
	= sea serpent ; can only travel on water
	= captain / squealer ; summon a monster on the down stairs tile
	= spectre ; 8359 ; spawn on the up-stairs after X turns; invincible creeping death. Also a plot hook for why you're in the dungeon in the first place
	= nemesis ; 9787 ; they know all spells the player knows (when spawned) -> strong enough that they need to be created using an ability?
	= fireball ; summoned by ability, lastMove direction is set by ability on summon -> can only move in that direction (creature intrinsic), casts EXPLODE if it hits a wall
	= momentumer ; something that starts with 0.25 actions / attacks per turn, and every 5th turn it speeds up its action / attack _inc and cap
		-> in that it's 15 turns before it's at 1 action / attack per turn, and after that things start getting dicey
	= guardian ; 0 actions / attacks per turn. Something else (external) sets their actions / attacks per turn (taking a treasure? killing a specific creature?)
	= portal ; 8719 ; summons creatures periodically until you destroy it?
	= magic ; 9834 1 note ; 9835 2 notes (harp?) ; 958 double lightning ; 950 single lightning ; 9829 charmed / ally
	= fountain ; 8992 ; heal once? 63 scroll, 7839 ring, 33 potion, 47 wand

	= bosses ; abilities
		-> DASH monsters into the player, if possible, otherwise YELL and DASH yourself. The YELL is to give an attack boost AND enable the player to sidestep
		-> Self-stun when hitting a wall when dashing ; this should be inherent to dash tbh

		-> the ability to set Spawncounter to 0 -> ie immediate reinforcements
		-> or summon a monster at every spawner wall

		weak erim: 277
		erim: 276
		gades: 286
		amon: 196
		daos: 270

		-> the ability to make every monster cast Troll regen -> if the monsters are healing, shit's gonna get tough
*/

function generateMonsters() {
	monsters = [];
	let numMonsters = game_state.depth+game_state.initial_spawn;
	for(let i=0;i<numMonsters;i++){
		spawnMonster();
	}
}

//for(let s of spawners){spawnMonster(Centipede)}
function spawnMonster(type) {
	let monsterType = type || shuffle([Goblin, Kobold, Zombie, Ghost, Quickling, Samurai])[0];
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
			monsters.push(monster);
			new Message(`Spawned a ${monster.constructor.name} (${monster.uid}) at ${monster.tile.x},${monster.tile.y}`, true);
		}else{
			new Message('Could not spawn more monsters; no or no open spawn spots', true);
			new Message('The dungeon overflows!');
		}
	}
	
}

function spawnPlayer(hp, coordinate){
  player = new Player(( coordinate ? coordinate : randomPassableTile() )); // {x: 0, y: 0}
  player.hp = hp;
  if( game_state.fov_enabled ){
    player.calcFov();
  }
}

function spawnTicker() {
	game_state.spawnCounter--;
  if(game_state.spawnCounter <= 0){  
    spawnMonster();
    game_state.spawnCounter = game_state.spawnRate;
    game_state.spawnRate--;
  }
}

function spawnRateReset(rate) {
	game_state.spawnRate = rate;              
  game_state.spawnCounter = game_state.spawnRate;
}