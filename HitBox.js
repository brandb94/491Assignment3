/**
 * Created by Brandon on 2/9/2016.
 */
/**
 * Hitbox for sprites and entities.
 * Used for collision handling
 * @param x coordinate
 * @param y coordinate
 * @param radius of the hitbox
 * @param game to host me
 * @constructor uhh
 */
function Hitbox(x, y, radius, game) {
    this.name = "Hitbox";
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.game = game;

    //Entity.call(this, game, this.x, this.y);
}

Hitbox.prototype = new Entity();
Hitbox.prototype.constructor = Hitbox;

//Collision with borders
Hitbox.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Hitbox.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Hitbox.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Hitbox.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

Hitbox.prototype.update = function () {
    Entity.prototype.update.call(this);
};

/**
 * Update x and y coordinate of this hitbox
 * @param x
 * @param y
 */
Hitbox.prototype.updateXY = function (x, y) {
    this.x = x;
    this.y = y;
};

Hitbox.prototype.draw = function (ctx) {
    //console.log("hb x: " + this.x + " | hb y: " + this.y);
    ctx.beginPath();
    ctx.strokeStyle = "Red";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.strokeStyle = "Green";
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.radius, this.y + this.radius);
    ctx.stroke();
    ctx.closePath();

    //Entity.prototype.draw.call(ctx);
};
/**
 * Determines whether or not this hitbox is colliding with the other hit box
 * and which directio the collision is in.
 *  Note: can collide with multiple directions
 * @param other hitbox to collide with
 * @returns {{hit: boolean, dirs: {top: boolean, right: boolean, down: boolean, left: boolean}}}
 *
 */
Hitbox.prototype.getCollisionDirection = function (other) {

    var collisions = {
        top: this.y < other.hitbox.y,
        right: this.x > other.hitbox.x,
        down: this.y > other.hitbox.y,
        left: this.x < other.hitbox.x
    };


    return {hit: distance(this, other.hitbox) < this.radius + other.hitbox.radius, dirs: collisions};
};