$(document).ready(function ()
{
	var game = new Phaser.Game(640, 480, Phaser.AUTO, "game", 
	{
		preload: preload,
		create: create,
		update: update
	});
	
	var tiledim = 16;
	var max_monster_per_room = 5;
	var map; // the map (ROT)
	var mapbg;
	var walls; // group of walls (Phaser)
	var wallTileIndexes = {}; // key: tileXY, value: index
	var floors; // group of floors (Phaser)
	var floorTileIndexes = {}; // key: tileXY, value: index
	var paths = []; // holds path data (ROT)
	var doors = []; // holds door data
	var treasures = []; // groups of treasures
	var monsters = []; // groups of monsters
	var tombs = []; // holds tombs data
	var gobjTileIndexes = {};
	var gobjs; // group of game objects (Phaser)
	var hero; // sprite of hero (Phaser)
	var heroFOV; // fov of hero (ROT)
	var hud; // group of hud (Phaser)
	var hudtext; // hud text (Phaser)
	var astar; // astar pathfinding (ROT)
	var scheduler; // action scheduler (ROT)
	
	//var upKey, downKey, leftKey, rightKey;
	
	function preload()
	{
		game.load.image("wall", "/img/tiles/Wall2.png", tiledim, tiledim);
		game.load.spritesheet("tiles", "/img/tiles16.png", tiledim, tiledim);
		game.load.spritesheet("smalltiles", "/img/tiles8.png", tiledim * 0.5, tiledim * 0.5);
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
		hudtext = game.add.text(16, 1, "Health:10\nLevel:1\nExp:0", { font: "14px AlagardMedium", fill: "#ffffff" })
		
		// HUD
		var health = hud.create(0, 0, "tiles", 250);
		health.fixedToCamera = true;
		
		// INPUT
		//upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
		//downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		//leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
		//rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
		game.input.onDown.add(heroGoTo, this);
		
		buildDungeon();
	}
	
	function buildDungeon()
	{
		// ROT map and paths
		ROT.RNG.setSeed(100);
		map = new ROT.Map.Digger(40, 30, { roomWidth: [5,13], roomHeight: [3,15], corridorLength: [2,4], dugPercentage: 0.5 });
		map.create(renderPath);
		// ROT rooms
		var rooms = map.getRooms();
		var heroRoomIndex = Math.round(ROT.RNG.getUniform() * (rooms.length - 1));
		for ( var i = 0; i < rooms.length; i++ )
		{
			var room = rooms[i];
			renderRoom(room);
			
			if (i != heroRoomIndex)
			{
				// MONSTERS
				spawnMonster(room);
				
				// TREASURES
				
			}
		}
		
		// TOMBS
		
		// HERO
		//console.log("Hero Room: %s. Rooms: %s", heroRoomIndex, rooms.length);
		var heroRoom = rooms[heroRoomIndex];
		//console.log("Hero room: %s", heroRoom);
		var halfHRoom = (heroRoom.getRight() - heroRoom.getLeft()) * 0.5;
		var halfVRoom = (heroRoom.getBottom() - heroRoom.getTop()) * 0.5;
		var randX = heroRoom.getLeft() + Math.round(ROT.RNG.getNormal(halfHRoom, halfHRoom * 0.5));
		var randY = heroRoom.getTop() + Math.round(ROT.RNG.getNormal(halfVRoom, halfVRoom * 0.5));
		//console.log("Rand Hero X: %s. Y: %s", randX, randY);
		hero = gobjs.create(randX * tiledim, randY * tiledim, "tiles", 190);
		hero.tileX = randX;
		hero.tileY = randY;
		hero.name = "HERO";
		//hero.body.collideWorldBounds = true;
		
		var lightPasses = function (x, y)
		{
			return (paths[x + "," + y] === 0);
		}
		heroFOV = new ROT.FOV.PreciseShadowcasting(lightPasses);
		renderHeroFOV();
	}
	
	function renderPath(x, y, value)
	{
		var tile;
		//console.log(" [PATH] X:%s Y:%s VALUE:%s", x, y, value);
		//if ( value )
			//tile = tiles.create(x * tiledim, y * tiledim, "tiles", 56);
		if ( !value )
		{
			tile = floors.create(x * tiledim, y * tiledim, "tiles", 51);
			tile.tileXY = x + "," + y;
			tile.alpha = 0;
			floorTileIndexes[tile.tileXY] = floors.getIndex(tile);
		}
		
		paths[x + "," + y] = value;
	}
	
	function renderRoom(room)
	{
		var tile;
		//console.log(" [ROOM] #%s. Left: %s. Right: %s. Top: %s. Bottom: %s", (i + 1), room.getLeft(), room.getRight(), room.getTop(), room.getBottom());
		
		// top wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = walls.create(i * tiledim, (room.getTop() - 1) * tiledim, "tiles", 16);
			tile.tileXY = i + "," + (room.getTop() - 1);
			tile.alpha = 0;
			wallTileIndexes[tile.tileXY] = walls.getIndex(tile);
		}
		// bottom wall
		for ( var i = room.getLeft() - 1; i <= room.getRight() + 1; i++ )
		{
			tile = walls.create(i * tiledim, (room.getBottom() + 1) * tiledim, "tiles", 16);
			tile.tileXY = i + "," + (room.getBottom() + 1);
			tile.alpha = 0;
			wallTileIndexes[tile.tileXY] = walls.getIndex(tile);
		}
		// left wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = walls.create((room.getLeft() - 1) * tiledim, i * tiledim, "tiles", 16);
			tile.tileXY = (room.getLeft() - 1) + "," + i;
			tile.alpha = 0;
			wallTileIndexes[tile.tileXY] = walls.getIndex(tile);
		}
		// right wall
		for ( var i = room.getTop() - 1; i <= room.getBottom() + 1; i++ )
		{
			tile = walls.create((room.getRight() + 1) * tiledim, i * tiledim, "tiles", 16);
			tile.tileXY = (room.getRight() + 1) + "," + i;
			tile.alpha = 0;
			wallTileIndexes[tile.tileXY] = walls.getIndex(tile);
		}
		
		room.getDoors(function (x, y)
		{
			//console.log("  [ROOM] Doors X:%s, Y:%s", x, y);
			tile = walls.create(x * tiledim, y * tiledim, "tiles", 2);
			tile.tileXY = x + "," + y;
			tile.alpha = 0;
			wallTileIndexes[tile.tileXY] = walls.getIndex(tile);
			
			// change floor
			var floorIndex = floorTileIndexes[tile.tileXY];
			var floor = floors.getAt(floorIndex);
			floor.frame = 3;
			
			// set this as default. when door is open, set to 0.
			paths[x + "," + y] = 1;
			doors[x + "," + y] = 1;
		});
	}
	
	function spawnMonster(room)
	{
		// tile range: 200 - 229
		var monster_count = Math.floor(Math.random() * max_monster_per_room);
		console.log("MONSTER COUNT: %s", monster_count);
		for ( var i = 0; i < monster_count; i++ )
		{
			var randX = room.getLeft() + Math.floor(ROT.RNG.getUniform() * (room.getRight() - room.getLeft()));
			var randY = room.getTop() + Math.floor(ROT.RNG.getUniform() * (room.getBottom() - room.getTop()));
			var randType = 200 + Math.floor(ROT.RNG.getUniform() * (229 - 200));
			var monster = gobjs.create(randX * tiledim, randY * tiledim, "tiles", randType);
			monster.tileX = randX;
			monster.tileY = randY;
			monster.tileXY = monster.tileX + "," + monster.tileY;
			monster.alpha = 0;
			gobjTileIndexes[monster.tileXY] = gobjs.getIndex(monster);
		}
	}
	
	function spawnTreasure()
	{
		
	}
	
	function update()
	{
		
	}
	
	function heroGoTo()
	{
		scheduler.clear();
		
		//console.log("Mouse x: %s, y: %s", game.input.x, game.input.y);
		var tileX = Math.floor(game.input.x / tiledim);
		var tileY = Math.floor(game.input.y / tiledim);
		var tileXY = tileX + "," + tileY;
		//console.log(" Clicked tile x: %s, y: %s", tileX, tileY);
		
		// check if tile is path
		var hasPathOnTile = floorTileIndexes[tileXY];
		var passable = !paths[tileXY];
		console.log(" [GOTO] Path %s,%s: %s. Door: %s", tileX, tileY, !paths[tileXY], doors[tileXY]);
		
		var passableCallback = function (x, y)
		{
			//console.log(" [PF] Path %s,%s = %s", x, y, paths[x+","+y]);
			return (paths[x + "," + y] === 0);
		}
		
		// check if door
		if ( !passable && doors[tileXY] )
		{
			var diffX = Math.abs(hero.tileX - tileX);
			var diffY = Math.abs(hero.tileY - tileY);
			
			console.log("  [GOTO] Diff %s,%s", diffX, diffY);
			
			if ( (diffX == 1 && diffY == 0) || (diffX == 0 && diffY == 1) )
			{
				paths[tileXY] = 0;
				var index = wallTileIndexes[tileXY];
				var wall = walls.getAt(index);
				wall.kill();
			}
			else
			{
				// door is closed and not near,
				// update goto to go next to door.
				var checkLeftDoor = !paths[(tileX - 1) + "," + tileY];
				var checkRightDoor = !paths[(tileX + 1) + "," + tileY];
				var checkUpDoor = !paths[tileX + "," + (tileY - 1)];
				var checkDownDoor = !paths[tileX + "," + (tileY + 1)];
				//console.log("  [GOTO] Check door left: %s, right: %s, up: %s, down: %s", checkLeftDoor, checkRightDoor, checkUpDoor, checkDownDoor);
				var gotoX = (checkLeftDoor && checkRightDoor)? (hero.tileX < tileX)? -1 : 1 : 0;
				var gotoY = (checkUpDoor && checkDownDoor)? (hero.tileY < tileY)? -1 : 1 : 0;
				tileX += gotoX;
				tileY += gotoY;
				tileXY = tileX + "," + tileY;
				passable = !paths[tileXY];
				hasPathOnTile = floorTileIndexes[tileXY];
				//console.log("  [GOTO] Update GOTO %s,%s", tileX, tileY);
				//sconsole.log("  [GOTO] Path %s,%s: %s. Door: %s", tileX, tileY, !paths[tileXY], doors[tileXY]);
			}
		}
		
		// passable
		if ( hero && hasPathOnTile && passable )
		{
			astar = new ROT.Path.AStar(tileX, tileY, passableCallback, { topology: 4 });
			astar.compute(hero.tileX, hero.tileY, function (x, y)
			{
				//console.log(" [PF] Hero go to %s, %s", x, y);
				scheduler.add({ actor: "hero", action: "move", data: { x: x, y: y } }, true);
			});
			processScheduler();
		}
	}
	
	function renderHeroFOV()
	{
		if ( hero )
		{
			heroFOV.compute(hero.tileX, hero.tileY, 4, function (x, y, r, visibility)
			{
				var tileXY = x + "," + y;
				
				var index = floorTileIndexes[tileXY];
				if ( index )
				{
					var floor = floors.getAt(index);
					if ( floor && floor.alpha < visibility )
						floor.alpha = visibility;
				}
				index = wallTileIndexes[tileXY];
				if ( index )
				{
					var wall = walls.getAt(index);
					if ( wall && wall.alpha < visibility )
						wall.alpha = visibility;
				}
				index = gobjTileIndexes[tileXY];
				if ( index )
				{
					var gobj = gobjs.getAt(index);
					//if ( gobj && gobj.alpha < visibility )
					gobj.alpha = visibility;
				}
			});
		}
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
				renderHeroFOV();
			}
			
			scheduler.remove(current);
			
			setTimeout(processScheduler, 100);
		}
	}
});