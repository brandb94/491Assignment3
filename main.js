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
            this.hitChance = 5;
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
        var arr = (this.team === "left") ? this.game.leftArmy : this.game.rightArmy;
        for (var i = 0; i < arr.length; i++ ) {
            this.hitChance -= 3;
        }

    }



    this.removeFromWorld = true;
};

Soldier.prototype.draw = function(ctx) {
    ctx.beginPath();
    if (this.team === "left") ctx.fillStyle = "#E3612F";
    if (this.team === "right") ctx.fillStyle = "#d4f835";

    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
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
    var hitChance = randomInt(this.hitChance) + 1;
    if (hitChance >= 10 - this.hitChance) {

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


}



function createArmy(game, side) {
    var canvas = document.getElementById('gameWorld');
    var startX;
    if(side === "right") startX = canvas.width - 80; // 40 is soldier radius
    else  startX = 10;
    var startY = 10; //Top of canvas

    for (var i = 0; i < 10; i++) {
        var sold = new Soldier(game, startX, startY, side, "grunt");
        startY += 80; //Soldier height;
        if (side === "right") {
            game.rightArmy.push(sold);
        } else {
            game.leftArmy.push(sold);
        }

    }
    var commandX = (side === "right") ? canvas.width -160 : 80;
    var commander = new Soldier(game, commandX, canvas.height / 2, side, "commander");

    if (side === "right") game.rightArmy.push(commander);
    else game.leftArmy.push(commander);


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


    var gameEngine = new GameEngine();

   // createArmy(game, "left");
    createArmy(gameEngine, "right");
    createArmy(gameEngine, "left");
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
