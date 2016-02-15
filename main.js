function Animation(spriteSheet, startX, startY, frameWidth, frameHeight, frameDuration, frames, loop, reverse) {
    this.spriteSheet = spriteSheet;
    this.startX = startX;
    this.startY = startY;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight = frameHeight;
    this.frames = frames;
    this.totalTime = frameDuration * frames;
    this.elapsedTime = 0;
    this.loop = loop;
    this.reverse = reverse;
}


Animation.prototype.drawFrame = function (tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.reverse ? this.frames - this.currentFrame() - 1 : this.currentFrame();
    var vindex = 0;
    if ((index + 1) * this.frameWidth + this.startX > this.spriteSheet.width) {
        index -= Math.floor((this.spriteSheet.width - this.startX) / this.frameWidth);
        vindex++;
    }
    while ((index + 1) * this.frameWidth > this.spriteSheet.width) {
        index -= Math.floor(this.spriteSheet.width / this.frameWidth);
        vindex++;
    }

    var locX = x;
    var locY = y;
    var offset = vindex === 0 ? this.startX : 0;
    ctx.drawImage(this.spriteSheet,
        index * this.frameWidth + offset, vindex * this.frameHeight + this.startY,  // source from sheet
        this.frameWidth, this.frameHeight,
        locX, locY,
        this.frameWidth * scaleBy,
        this.frameHeight * scaleBy);
};

Animation.prototype.currentFrame = function () {
    return Math.floor(this.elapsedTime / this.frameDuration);
};

Animation.prototype.isDone = function () {
    return (this.elapsedTime >= this.totalTime);
};


function StatTrack(game) {

    this.name = "Stats";
    this.stats = null;

    Entity.call(this, game, 0, 400);

}

StatTrack.prototype = new Entity();
StatTrack.prototype.constructor = StatTrack;

StatTrack.prototype.update = function(ctx) {
    this.stats = this.getSoldierStats();
};

StatTrack.prototype.draw = function(ctx) {
    var canvas = document.getElementById('gameWorld');

    var opacity = 0;

    // for wave counter

    ctx.font="15px Courier New";
    ctx.fillStyle = "white";

  //  ctx.fillText("Wave: " + globals.wave, 10, 55);

   // if (globals.player.health > 0) {

    //var armyStats = this.getSoldierStats();


    ctx.fillText("Left Soldiers remaining: " + this.game.leftArmy.length, 40, 50);
    ctx.fillText("Left Soldier Hit Chance: " + (this.stats.leftHit * 10) + "%", 40, 70);
    ctx.fillText("Left Commander Alive: " + !this.stats.leftDead, 40, 90);


    ctx.fillText("Right Soldier Hit Chance: " + (this.stats.rightHit * 10) + "%", canvas.width / 2, 70);
    ctx.fillText("Right Commander Alive: " + !this.stats.rightDead, canvas.width / 2, 90);
    ctx.fillText("Right Soldiers remaining: " + this.game.rightArmy.length, canvas.width / 2, 50);

        // for blood - we don't need this if you guys don't like it
        // decrease the first hardcoded number to lower threshold
        //opacity += .3 - (globals.player.health / 100);
        // for testing numbers:
        // this.game.ctx.fillText(opacity, 10, 100);
      //  ctx.fillStyle = "rgba(195, 0, 0, " + opacity + ")";
       // ctx.fillRect(0,0, canvas.width, canvas.height);
   // } else {
      //  ctx.fillStyle = "rgba(195, 0, 0, " + .5 + ")";
      //  ctx.fillRect(0,0, canvas.width, canvas.height);
     //   ctx.fillStyle = "white";
     //   ctx.font="50px Courier New";
      //  ctx.fillText("YOU DEAD HOMIE rip", 125, canvas.height / 2);

};

StatTrack.prototype.getSoldierStats = function() {

    var result = {};

    result["leftHit"] = this.game.leftArmy[0].hitChance;
    result["rightHit"] = this.game.rightArmy[0].hitChance;

    var leftDead = this.commanderDead(this.game.leftArmy);
    var rightDead = this.commanderDead(this.game.rightArmy);

    result["leftDead"] = leftDead;
    result["rightDead"] = rightDead;

    return result;



};

StatTrack.prototype.commanderDead = function(arr) {
    var commandDead = true;

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].type ===  "commander" && arr[i].health > 0) {
            commandDead = false;
            break;
        }

    }
    return commandDead;
};

// GameBoard code below

function distance(a, b) {
    if (a && b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

function randomInt(n) {
    return Math.random() * n;
}


function Soldier(game, startX, startY, team, type) {
    this.team = team;
    //this.health = 100;
   // this.moveSpeed = 30;
  //  this.radius = 20;
    this.game = game;
    this.animations = {};
    this.type = type;
    this.animations.idle = new Animation(ASSET_MANAGER.getAsset("./img/soldiers.png"), 0, 280, 48, 35,.15, 1, true, true);

    this.target = null;

    //Movement stuff
    this.velocity = {};
    this.velocity.x = 0;
    this.velocity.y = 0;

    switch(type) {
        case "grunt":
            this.hitChance = 6;
            this.radius = 20;
            this.damageMax = 30;
            this.health = 100;
            this.moveSpeed = 30;
            break;
        case "commander":
            this.hitChance = 8;
            this.radius = 40;
            this.damageMax = 60;
            this.health = 250;
            this.moveSpeed = 50;
            break;
    }


    Entity.call(this, game, startX, startY);
}

Soldier.prototype = new Entity();
Soldier.prototype.constructor = Soldier;

Soldier.prototype.update = function() {

    //move
    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (!this.target) {
        var enemy = this.findClosestEnemy(this.team);
        if (enemy) this.target = enemy;
    }

    if (this.target) {


        if (distance(this, this.target) < this.radius + this.target.radius) {
            //close enough to attack
            this.attack(this.target);
        } else {
            //Try to close the distance
            this.moveTowards(this.target);

        }
        if (this.target.health <= 0) this.target = null;

    }

    if (this.health <= 0) this.die();


    Entity.prototype.update.call(this);
};

Soldier.prototype.die = function() {

    if (this.type === "commander") {

        //My team is demoralized, lower their hit chance
        //var arr = (this.team === "left") ? this.game.leftArmy : this.game.rightArmy;
        var arr;
        if (this.team === "left") arr = this.game.leftArmy;
        else arr = this.game.rightArmy;

        console.log("Commander dead, lowering my team's hitChance");
        for (var i = 0; i < arr.length; i++ ) {
            arr[i].hitChance -= 3;
        }

    }



    this.removeFromWorld = true;
};

Soldier.prototype.draw = function(ctx) {
    ctx.beginPath();
    if (this.team === "left") ctx.fillStyle = "#E3612F";
    if (this.team === "right") ctx.fillStyle = "#d4f835";

    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillText((this.health).toFixed(2), this.x + this.radius, this.y+ this.radius);
    ctx.fill();

  //  Entity.draw.call(this);
};

Soldier.prototype.findClosestEnemy = function(team) {
    var arr = (team === "left") ? this.game.rightArmy : this.game.leftArmy;
    var closest = arr[0];
    for (var i = 1; i < arr.length; i++) {
        var current = arr[i];

        if (distance(this, current) < distance(this, closest)) {
            closest = current;
        }

    }
    return closest;
};

Soldier.prototype.attack = function(enemy) {
    var hitOrNah = randomInt(10) + 1;
    if (hitOrNah >= 10 - this.hitChance) {

        var damage = randomInt(this.damageMax) + 1;
        enemy.health -= damage;
    }
};

Soldier.prototype.moveTowards = function(enemy) {

    var dx = enemy.x - this.x;
    var dy = enemy.y - this.y;

    var pointDistance = Math.sqrt(dx * dx + dy * dy);

    this.velocity.x = (dx / pointDistance) * this.moveSpeed;
    this.velocity.y = (dy / pointDistance) * this.moveSpeed;


};



function createArmy(game, side) {
    var canvas = document.getElementById('gameWorld');
    var startX;
    if(side === "right") startX = canvas.width - 80; // 40 is soldier radius
    else  startX = 30;
    var startY = 30; //Top of canvas

    /*for (var i = 0; i < 10; i++) {
        var sold = new Soldier(game, startX, startY, side, "grunt");
        startY += 80; //Soldier height;
        if (side === "right") {
            game.rightArmy.push(sold);
        } else {
            game.leftArmy.push(sold);
        }

    }*/
   // spawnTriangle(startX, startY, game, side);
    spawnRow(10, startX, game, side);

    var commandX = (side === "right") ? canvas.width - 160 : 80;
    var commander = new Soldier(game, commandX, canvas.height / 2, side, "commander");

    if (side === "right") game.rightArmy.push(commander);
    else game.leftArmy.push(commander);


}

function spawnRow(numSoldiers, startX, game, side) {
    var startY = 10;
    var startX;
  //  if(side === "right") startX = canvas.width - 80; // 40 is soldier radius
   // else  startX = 10;
    for (var i = 0; i < numSoldiers; i++) {
        var sold = new Soldier(game, startX, startY, side, "grunt");
        startY += 80; //Soldier height;
        if (side === "right") {
            game.rightArmy.push(sold);
        } else {
            game.leftArmy.push(sold);
        }

    }
}
//TODO make a spawner object that has a reference to soldier info to get rid of magic numbers
//then add this function to the spawner's prototype
/**
 *
 * @param baseSize - number of soldiers in largest column
 * @param startX of the top soldier in the largest column
 * @param startY of the top soldier in the largest column
 * @param game to add the soldiers to
 * @param side the soldier belongs to. Determines some of the loop functionality
 */
function spawnTriangle(baseSize, startX, startY, game, side) {
    var currY = startY;
    var currX = startX;
    var prevY = startY;

    console.log("Starting Y: " + startY);
    for (var i = baseSize; i > 0; i--) {
        prevY = currY;

        for (var j = 0; j < i; j++) {
            console.log("adding soldier in row " + i + ", soldier num: " + (j+1) + " Pos: (" + currX +"," +currY + ")");
            var sold = new Soldier(game, currX, currY, side, "grunt");

            if (side === "left") game.leftArmy.push(sold);
            if (side === "right") game.rightArmy.push(sold);
            currY += 40 + 20;


        }

        if (side === "left") currX += 50;
        if (side === "right") currX -= 50;

        console.log("Current Y: " + currY + ", Pass: " + i);


        var temp = prevY;
        currY = temp + 30;

    }


}



var ASSET_MANAGER = new AssetManager();

//ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
//ASSET_MANAGER.queueDownload("./img/black.png");
//ASSET_MANAGER.queueDownload("./img/white.png");
ASSET_MANAGER.queueDownload("./img/soldiers.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var pauseButton = document.getElementById('pause');
    var gameEngine = new GameEngine();
    var statTracker = new StatTrack(gameEngine);
   // createArmy(game, "left");
    /*var pauseButton = document.getElementById('pausegame');
    pauseButton.onclick = function() {
        gameEngine.pauseGame();
    };*/



    gameEngine.addEntity(statTracker);

    pauseButton.addEventListener('click', function(e) {
        gameEngine.gameState.PAUSED ^= true;
    });

    //createArmy(gameEngine, "right");
    spawnTriangle(5, canvas.width - 80, 30, gameEngine, "right");

    spawnTriangle(5, 30, 30, gameEngine, "left");
   // createArmy(gameEngine, "left");
   // var circle = new Circle(gameEngine);
  //  circle.setIt();
  //  gameEngine.addEntity(circle);
   /* for (var i = 0; i < 12; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
    }*/
    gameEngine.init(ctx);
    gameEngine.start();
});
