// This game shell was happily copied from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

var gameState = {
  paused:false
};


window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function () {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;

    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
};

function GameEngine() {
    this.gameState = {
        PAUSED:false,
        GAMEOVER:false,
        SPEED:1.0

    };

    this.entities = [];
    this.leftArmy = [];//testing best place to put this
    this.rightArmy = [];
    this.showOutlines = true;
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}


GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
    console.log('game initialized');
};

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
};

GameEngine.prototype.pauseGame = function() {
    //Flip pause value
    this.gameState.PAUSED = !this.gameState.PAUSED;
};



GameEngine.prototype.startInput = function () {
    console.log('Starting input');
    var that = this;
    var canvas = document.getElementById('gameWorld');

    canvas.addEventListener("keydown", function (e) {
        console.log(e.keyCode + " key pressed");
        if (e.keyCode === 32) {
            console.log("Pause Called");
            that.pauseGame();

            //e.preventDefault();
        }
//        console.log(e);
        e.preventDefault();
    }, false);


    this.ctx.canvas.addEventListener("click", function(e) {
        if (e.button == 0) that.leftClick = true;
        console.log("click event fired");
        that.pauseGame();
        e.preventDefault();

    }, false);

    this.ctx.canvas.addEventListener("mousedown", function(e) {
        //  if (e.button == 0) that.leftClick = true;
        e.preventDefault();

    }, false);


    //stop context menu from opening when user right clicks
    this.ctx.canvas.addEventListener("contextmenu", function(e) {
        if (e.button == 0) that.rightClick = true;
        e.preventDefault();

    }, false);

    console.log('Input started');
};

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
};

//TODO consider making a function 'addBullet'
//This approach may end up getting redundant if we end up with more arrays of different entity types

GameEngine.prototype.draw = function () {


    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    //Draw entities
    this.drawEntitiesIn(this.entities);

    this.drawEntitiesIn(this.leftArmy);
    this.drawEntitiesIn(this.rightArmy);

    //Draw bullets
    //this.drawEntitiesIn(this.bullets);

    this.ctx.restore();
};

/**
 * Calls draw on all elements of a given array
 * @param array of entities
 */
GameEngine.prototype.drawEntitiesIn = function(array) { for (var i = 0; i < array.length; i++) array[i].draw(this.ctx); };
/**
 * Calls update on all elements in a given array
 * @param array of entities
 */
GameEngine.prototype.updateEntitiesIn = function(array) {
    if (array === undefined) return;
    for (var i = 0; i < array.length; i++) {
        if (!array[i].removeFromWorld) array[i].update();
    }
};
/**
 * Removes entities that have their 'removeFromWorld' flag set
 * @param array of entities to trim
 */
GameEngine.prototype.removeFinishedFrom = function(array) {
    if (array === undefined) return;
    for (var i = array.length-1; i >= 0; i--) {
        if (array[i].removeFromWorld) array.splice(i, 1);
    }
};

/**
 * Calls every entities' update method
 */
GameEngine.prototype.update = function () {

    //update entities



    this.updateEntitiesIn(this.entities);


    this.updateEntitiesIn(this.leftArmy);
    this.updateEntitiesIn(this.rightArmy);

    //update bullets

    //this.updateEntitiesIn(this.bullets);


    //remove entities and bullets that are donezo

    this.removeFinishedFrom(this.entities);
    //this.removeFinishedFrom(this.bullets);

    //relevant
    this.removeFinishedFrom(this.leftArmy);
    this.removeFinishedFrom(this.rightArmy);


};

GameEngine.prototype.loop = function () {
    if (this.checkGameOver()) this.gameState.GAMEOVER = true;

    if (!this.gameState.PAUSED && !this.gameState.GAMEOVER) {
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    }
    //this.space = null;
};

GameEngine.prototype.checkGameOver = function() {
  return this.isArrEmpty(this.leftArmy) || this.isArrEmpty(this.rightArmy);
};

GameEngine.prototype.isArrEmpty = function(arr) {
    var result = arr.length === 0;

    if (!result) {
        for (var i = 0; i < arr.length; i++) {
            if (!arr[i].removeFromWorld) return false;
        }
    }
    return result;

};




function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
};

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        this.game.ctx.beginPath();
        this.game.ctx.strokeStyle = "green";
        this.game.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.game.ctx.stroke();
        this.game.ctx.closePath();
    }
};

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
};
