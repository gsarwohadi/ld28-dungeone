$(document).ready(function ()
{
	var game = new Phaser.Game(640, 480, Phaser.CANVAS, "game", 
	{
		preload: preload,
		create: create,
		update: update
	});
	
	var tiledim = 16;
	var map;
	var mapbg;
	var tileset;
	var tiles;
	var overlap;
	var sprite;
	
	function preload()
	{
		game.load.image("wall", "/img/tiles/Wall2.png", tiledim, tiledim);
		game.load.spritesheet("tiles", "/img/pubdlcnt.php.png", tiledim, tiledim);
	}
	
	function create()
	{
		tileset = game.add.tileset("tiles");
		//tileset.setCollisionRange();
		//tileset.setCollision();
		
		//mapbg = game.add.tileSprite(0, 0, 720, 520, "wall");
		tiles = game.add.group();
		
		// ROT map
		ROT.RNG.setSeed(1);
		map = new ROT.Map.Digger(40, 30, { roomWidth: [5,13], roomHeight: [3,7], corridorLength: [4,8], dugPercentage: 0.8 });
		map.create(renderPath);
		
		var rooms = map.getRooms();
		for ( var i = 0; i < rooms.length; i++ )
		{
			var room = rooms[i];
			renderRoom(room);
		}
	}
	
	function renderPath(x, y, value)
	{
		console.log(" [PATH] X:%s Y:%s VALUE:%s", x, y, value);
		if ( value )
			tile = tiles.create(x * tiledim, y * tiledim, "tiles", 56);
		else
			tile = tiles.create(x * tiledim, y * tiledim, "tiles", 50);
	}
	
	function renderRoom(room)
	{
		var tile;
		console.log(" [ROOM] #%s. Left: %s. Right: %s. Top: %s. Bottom: %s", (i + 1), room.getLeft(), room.getRight(), room.getTop(), room.getBottom());
		
		// top wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = tiles.create(i * tiledim, (room.getTop() - 1) * tiledim, "tiles", 12);
		}
		// bottom wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = tiles.create(i * tiledim, (room.getBottom() + 1) * tiledim, "tiles", 12);
		}
		// left wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = tiles.create((room.getLeft() - 1) * tiledim, i * tiledim, "tiles", 12);
		}
		// right wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = tiles.create((room.getRight() + 1) * tiledim, i * tiledim, "tiles", 12);
		}
		
		// floor
		for ( var i = room.getLeft(); i <= room.getRight(); i++ )
		{
			for ( var j = room.getTop(); j <= room.getBottom(); j++ )
			{
				tile = tiles.create(i * tiledim, j * tiledim, "tiles", 25);
			}
		}
		
		room.getDoors(function (x, y)
		{
			console.log("  [ROOM] Doors X:%s, Y:%s", x, y);
			tile = tiles.create(x * tiledim, y * tiledim, "tiles", 1);
		});
	}
	
	function update()
	{
		
	}
});