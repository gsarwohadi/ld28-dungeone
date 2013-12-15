$(document).ready(function ()
{
	var game = new Phaser.Game(640, 480, Phaser.AUTO, "game", 
	{
		preload: preload,
		create: create,
		update: update
	});
	
	var tiledim = 16;
	var map;
	var mapbg;
	var tileset;
	var walls;
	var floors;
	var gobjs;
	var hero;
	var hud;
	
	var upKey, downKey, leftKey, rightKey;
	
	function preload()
	{
		game.load.image("wall", "/img/tiles/Wall2.png", tiledim, tiledim);
		game.load.spritesheet("tiles", "/img/pubdlcnt.php.png", tiledim, tiledim);
	}
	
	function create()
	{
		//tileset = game.add.tileset("tiles");
		//tileset.setCollisionRange();
		//tileset.setCollision();
		
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
		var randX = Math.round(ROT.RNG.getNormal(halfHRoom, halfHRoom * 0.5));
		var randY = Math.round(ROT.RNG.getNormal(halfVRoom, halfVRoom * 0.5));
		console.log("Rand Hero X: %s. Y: %s", randX, randY);
		hero = gobjs.create((randRoom.getLeft() + randX) * tiledim, (randRoom.getTop() + randY) * tiledim, "tiles", 190);
		hero.name = "HERO";
		hero.body.collideWorldBounds = true;
		
		upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
	}
	
	function renderPath(x, y, value)
	{
		//console.log(" [PATH] X:%s Y:%s VALUE:%s", x, y, value);
		//if ( value )
			//tile = tiles.create(x * tiledim, y * tiledim, "tiles", 56);
		if ( !value )
			tile = floors.create(x * tiledim, y * tiledim, "tiles", 50);
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
		});
	}
	
	function update()
	{
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
	}
	
	function collisionHandler(obj1, obj2)
	{
		
	}
});