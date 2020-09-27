class Monster {
	constructor(tile, sprite, hp){
		this.move(tile);
		this.sprite = sprite;
		this.hp = hp;
		this.offsetX = 0;                                                   
		this.offsetY = 0;

		this.state_stunned = 0;
		//this.hidden = true;
	}

	getDisplayX(){                     
		return this.tile.x + this.offsetX;
	}
	getDisplayY(){                                                                  
		return this.tile.y + this.offsetY;
	} 
	draw(){
		//if( !this.hidden ){
			drawChar(this.sprite, this.getDisplayX(), this.getDisplayY());

		// let spritesheet = new Image();
		// spritesheet.src = this.sprite; //'assets/merman.gif';
		// ctx.drawImage(spritesheet, 0, 0, 62, 62, this.getDisplayX()*tileSize, this.getDisplayY()*tileSize, tileSize, tileSize);

			this.drawHp();
			this.drawStun();
		//}else{
		//	drawChar(63, this.getDisplayX(), this.getDisplayY());
		//}

		this.offsetX -= Math.sign(this.offsetX)*(1/8);     
		this.offsetY -= Math.sign(this.offsetY)*(1/8);
	}

	drawHp(){
		if( this.hp > 0 ){
			ctx.save();

			ctx.font = '16px calibri';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText( this.hp, this.getDisplayX()*tileSize, this.getDisplayY()*tileSize);
			
			// bottom left ; attack value?
			// ctx.textBaseline = 'bottom';
			// ctx.fillText( this.hp, this.tile.x*tileSize, this.tile.y*tileSize+1*tileSize);

			// bottom right ; defense value?
			// ctx.textAlign = 'right';
			// ctx.textBaseline = 'bottom';
			// ctx.fillText( this.hp, this.tile.x*tileSize+1*tileSize, this.tile.y*tileSize+1*tileSize);

			ctx.restore();
		}
	}

	drawStun(){
		if( this.state_stunned > 0 ){
			ctx.save();

			ctx.font = '16px calibri';
			ctx.textAlign = 'right';
			ctx.textBaseline = 'top';
			ctx.fillText( this.state_stunned, this.getDisplayX()*tileSize+1*tileSize, this.getDisplayY()*tileSize);
			
			ctx.restore();
		}
	}

	tryMove(dx, dy){
		let newTile = this.tile.getNeighbor(dx,dy);
		if(newTile.passable){
			if(!newTile.monster){
				this.move(newTile);
			}else{
				if(this.isPlayer != newTile.monster.isPlayer){
					this.attackedThisTurn = true;
					// TODO: use this.attack instead of hard 1?
					newTile.monster.swing(1);

					this.offsetX = (newTile.x - this.tile.x)/2;         
					this.offsetY = (newTile.y - this.tile.y)/2; 
				}
			}
			return true;
		}else{ // this entire else is so you can bump into walls and pass a turn
			//this.move(this.tile);
			// TODO: this might be where you bump a chest to open it, or try to push a boulder
			this.offsetX = (newTile.x - this.tile.x)/2;         
			this.offsetY = (newTile.y - this.tile.y)/2; 
			return true;
		}
	}

	swing(damage){
		// TODO: add swing-based accuracy instead of 100% accuracy
		this.hp -= damage;
		if(this.hp <= 0){
				this.die();
		}
	}

	die(){
		this.dead = true;
		this.tile.monster = null;
		this.sprite = 37; // %
	}

	move(tile){
		if(this.tile){
			this.tile.monster = null;
			this.offsetX = this.tile.x - tile.x;    
			this.offsetY = this.tile.y - tile.y;
		}
		this.tile = tile;
		tile.monster = this;

		tile.stepOn(this);
	}

	update(){
		if(this.state_stunned > 0){
			this.state_stunned--;
			return;
		}
		this.act();
	}

	act(){
		// TODO: this is where we'd use easystar for smort pathfinding
	 	let neighbors = this.tile.getAdjacentPassableNeighbors();
	 
	 	neighbors = neighbors.filter(t => !t.monster || t.monster.isPlayer);

	 	if(neighbors.length){
			neighbors.sort((a,b) => a.dist(player.tile) - b.dist(player.tile));
			let newTile = neighbors[0];
			this.tryMove(newTile.x - this.tile.x, newTile.y - this.tile.y);
		}
	}
}

class Player extends Monster {
	constructor(tile){
		super(tile, 64, 3); // @
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
				player.tryMove(0, 0);
				break;
			default:
				break;
		}
	}

	tryMove(dx, dy){
		if(super.tryMove(dx,dy)){
			// world state ticks after each player movement
			//this.calcLos();
			this.calcFov();
			tick();
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
		super(tile, 107, 2); // k
	}
}

class Goblin extends Monster {
	constructor(tile){
		super(tile, 103, 1); // g
		this.cooldown = 0;
	}
	update(){
		this.cooldown++;
		super.update();
		if( this.cooldown % 7 == 0 ){ // every 7th turn
			// TODO: this should be an ability ; the spot must be a Floor with no monster on it
			let freeSpace = shuffle(this.tile.getAdjacentPassableNeighbors().filter(t=>!t.monster && t.constructor.name == 'Floor'))[0];
			if( freeSpace ){
				freeSpace.replace(Trap);
			}
			this.state_stunned++;
		}
	}
}

class Zombie extends Monster {
	constructor(tile){
		super(tile, 90, 5); // Z
	}
	update(){
		// order matters; Zombies self-stun every other turn
		let startStunned = this.state_stunned;
		super.update();
		if(!startStunned){
				this.state_stunned++;
		}
	}
}

class Quickling extends Monster {
	constructor(tile){
		super(tile, 113, 1); // Z
	}
	act(){ // acts twice, but not attacking
		this.attackedThisTurn = false;
		super.act();

		if(!this.attackedThisTurn){
				super.act();
		}
	}
}

class Ghost extends Monster {
	constructor(tile){
		super(tile, 71, 3); // G
	}
	swing(damage){ // teleports away when hit
		this.tile.monster = null;
		this.tile = randomPassableTile();
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
			monster.state_stunned = 1;

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