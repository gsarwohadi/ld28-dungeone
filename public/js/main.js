$(document).ready(function ()
{
	var game = new Phaser.Game(640, 480, Phaser.AUTO, "game", 
	{
		preload: preload,
		create: create,
		update: update
	});
	
	var tiledim = 16;
	var map; // the map (ROT)
	var mapbg;
	var walls; // group of walls (Phaser)
	var floors; // group of floors (Phaser)
	var paths = []; // holds path data (ROT)
	var gobjs; // group of game objects (Phaser)
	var hero; // sprite of hero (Phaser)
	var hud; // group of hud (Phaser);
	var scheduler; // action scheduler (ROT)
	
	var upKey, downKey, leftKey, rightKey;
	
	function preload()
	{
		game.load.image("wall", "/img/tiles/Wall2.png", tiledim, tiledim);
		game.load.spritesheet("tiles", "/img/pubdlcnt.php.png", tiledim, tiledim);
	}
	
	function create()
	{
		scheduler = new ROT.Scheduler.Simple();
		
		//mapbg = game.add.tileSprite(0, 0, 640, 480, "tiles", 56);
		floors = game.add.group();
		floors.z = 1;
		gobjs = game.add.group();
		gobjs.z = 2;
		walls = game.add.group();
		walls.z = 3;
		hud = game.add.group();
		hud.z = 10;
		
		// ROT map and paths
		ROT.RNG.setSeed(1);
		map = new ROT.Map.Digger(40, 30, { roomWidth: [5,13], roomHeight: [3,7], corridorLength: [4,8], dugPercentage: 0.6 });
		map.create(renderPath);
		// ROT rooms
		var rooms = map.getRooms();
		for ( var i = 0; i < rooms.length; i++ )
		{
			var room = rooms[i];
			renderRoom(room);
		}
		
		// HUD
		var health = hud.create(0, 0, "tiles", 250);
		health.fixedToCamera = true;
		
		// HERO
		var randRoomIndex = Math.round(ROT.RNG.getUniform() * rooms.length);
		console.log("Rand Room: %s", randRoomIndex);
		var randRoom = map.getRooms()[randRoomIndex];
		var halfHRoom = (randRoom.getRight() - randRoom.getLeft()) * 0.5;
		var halfVRoom = (randRoom.getBottom() - randRoom.getTop()) * 0.5;
		var randX = randRoom.getLeft() + Math.round(ROT.RNG.getNormal(halfHRoom, halfHRoom * 0.5));
		var randY = randRoom.getTop() + Math.round(ROT.RNG.getNormal(halfVRoom, halfVRoom * 0.5));
		console.log("Rand Hero X: %s. Y: %s", randX, randY);
		hero = gobjs.create(randX * tiledim, randY * tiledim, "tiles", 190);
		hero.tileX = randX;
		hero.tileY = randY;
		hero.name = "HERO";
		hero.body.collideWorldBounds = true;
		
		upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		
		game.input.onDown.add(heroGoTo, this);
	}
	
	function renderPath(x, y, value)
	{
		//console.log(" [PATH] X:%s Y:%s VALUE:%s", x, y, value);
		//if ( value )
			//tile = tiles.create(x * tiledim, y * tiledim, "tiles", 56);
		if ( !value )
			tile = floors.create(x * tiledim, y * tiledim, "tiles", 50);
		
		paths[x + "," + y] = value;
	}
	
	function renderRoom(room)
	{
		var tile;
		//console.log(" [ROOM] #%s. Left: %s. Right: %s. Top: %s. Bottom: %s", (i + 1), room.getLeft(), room.getRight(), room.getTop(), room.getBottom());
		
		// top wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = walls.create(i * tiledim, (room.getTop() - 1) * tiledim, "tiles", 12);
			tile.body.immovable = true;
		}
		// bottom wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = walls.create(i * tiledim, (room.getBottom() + 1) * tiledim, "tiles", 12);
			tile.body.immovable = true;
		}
		// left wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = walls.create((room.getLeft() - 1) * tiledim, i * tiledim, "tiles", 12);
			tile.body.immovable = true;
		}
		// right wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = walls.create((room.getRight() + 1) * tiledim, i * tiledim, "tiles", 12);
			tile.body.immovable = true;
		}
		
		// floor
		for ( var i = room.getLeft(); i <= room.getRight(); i++ )
		{
			for ( var j = room.getTop(); j <= room.getBottom(); j++ )
			{
				tile = floors.create(i * tiledim, j * tiledim, "tiles", 25);
				tile.body.immovable = true;
			}
		}
		
		room.getDoors(function (x, y)
		{
			console.log("  [ROOM] Doors X:%s, Y:%s", x, y);
			tile = walls.create(x * tiledim, y * tiledim, "tiles", 1);
			tile.body.immovable = true;
			
			// set this as default. when door is open, set to 0.
			//paths[x + "," + y] = 1;
		});
	}
	
	function update()
	{
		/*
		// uses physics and arrow keys
		hero.body.velocity.x = 0;
		hero.body.velocity.y = 0;
		if (upKey.isDown)
			hero.body.velocity.y -= tiledim;
		else if (downKey.isDown)
			hero.body.velocity.y += tiledim;
		else if (leftKey.isDown)
			hero.body.velocity.x -= tiledim;
		else if (rightKey.isDown)
			hero.body.velocity.x += tiledim;
		
		game.physics.collide(hero, walls, collisionHandler, null, this);
		*/
		
		/*if ( game.input.mousePointer.isDown)
		{
			console.log("Mouse x: %s, y: %s", game.input.x, game.input.y);
		}*/
	}
	
	function collisionHandler(obj1, obj2)
	{
		
	}
	
	function heroGoTo()
	{
		scheduler.clear();
		
		console.log("Mouse x: %s, y: %s", game.input.x, game.input.y);
		var tileX = Math.floor(game.input.x / tiledim);
		var tileY = Math.floor(game.input.y / tiledim);
		console.log(" Clicked tile x: %s, y: %s", tileX, tileY);
		
		var passableCallback = function (x, y)
		{
			return (paths[x + "," + y] === 0);
		}
		var astar = new ROT.Path.AStar(tileX, tileY, passableCallback, { topology: 4 });
		astar.compute(hero.tileX, hero.tileY, function (x, y)
		{
			console.log(" [PF] Hero go to %s, %s", x, y);
			scheduler.add({ actor: "hero", action: "move", data: { x: x, y: y } }, true);
		});
		
		processScheduler();
	}
	
	function processScheduler()
	{
		//console.log(" [SCH] Processing scheduler!");
		var current = scheduler.next();
		if ( current )
		{
			//console.dir(current);
			if ( current.actor == "hero" && current.action == "move" )
			{
				hero.x = current.data.x * tiledim;
				hero.y = current.data.y * tiledim;
				hero.tileX = current.data.x;
				hero.tileY = current.data.y;
			}
			
			scheduler.remove(current);
			
			setTimeout(processScheduler, 100);
		}
	}
});