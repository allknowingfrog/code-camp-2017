var canvas;
var context;
var player;
var zombieSprites = new Image();
var enemies = [];
var bullets = [];
var walls = [];
var inputs = {
    left: false,
    up: false,
    right: false,
    down: false,
    click: false
};
var mx;
var my;
var timestamp;
var SPEED = 30;
var SIZE = 20;
var XSIZE = 30;
var YSIZE = 20;
var ACC = 1000; //acceleration per second
var DCC = 2;
var COOL = .5;
var SPAWN = 2;
var ENEMY_RAND = .33;
var coolTimer = 0;
var spawnTimer = 0;
var score = 0;
var map =
  "   X                          "
+ "   X          X               "
+ "   X                          "
+ " XXX          X           X   "
+ "                              "
+ "     xxxxxx   X  X  X         "
+ "          x   X     X         "
+ "          x   X     X         "
+ "     x    x   X  X  X         "
+ "     x        X  X  X         "
+ "     xxxxx    X     X         "
+ "              X     X         "
+ "              X  X  X         "
+ "                              "
+ "                              "
+ "                              "
+ "  XXXXXXXXXXXXXXXXXXXXXXXXX   "
+ "                              "
+ "                              "
+ "                              "
;

function init() {
    canvas = document.getElementById('canvas');
    canvas.width = SIZE * XSIZE;
    canvas.height = SIZE * YSIZE;

    context = canvas.getContext('2d');

    zombieSprites.src = 'zombies.png';

    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
    document.addEventListener('mousedown', mouseDown, false);
    document.addEventListener('mouseup', mouseUp, false);
    document.addEventListener('mousemove', mouseMove, false);

    player = new Entity(0, 0, 'red');

    for(var x=0; x<XSIZE; x++) {
        walls[x] = [];
        for(var y=0; y<YSIZE; y++) {
            if(map.substr(y * XSIZE + x, 1) !== ' ') {
                walls[x][y] = new Entity(x * SIZE, y * SIZE, 'brown');
            } else {
                walls[x][y] = null;
            }
        }
    }

    timestamp = Date.now();

    gameLoop();
}

function gameLoop() {
    var now = Date.now();
    var delta = (now - timestamp) / 1000;
    timestamp = now;

    if(inputs.left) {
        player.vx -= ACC * delta;
    } else if(inputs.right) {
        player.vx += ACC * delta;
    } else {
        player.vx -= player.vx * DCC * delta;
    }

    if(inputs.up) {
        player.vy -= ACC * delta;
    } else if(inputs.down) {
        player.vy += ACC * delta;
    } else {
        player.vy -= player.vy * DCC * delta;
    }

    if(inputs.click && coolTimer <= 0) {
        var dx = mx - player.getMidX();
        var dy = my - player.getMidY();
        var total = Math.abs(dx) + Math.abs(dy);
        var bullet = new Entity(0, 0, 'blue');
        bullet.size /= 4;
        bullet.setMidX(player.getMidX());
        bullet.setMidY(player.getMidY());
        bullet.max *= 6;
        bullet.vx = dx / total * bullet.max;
        bullet.vy = dy / total * bullet.max;
        bullets.push(bullet);
        coolTimer = COOL;
    } else if(coolTimer > 0) {
        coolTimer -= delta;
    }

    player.update(delta);

    if(enemies.length < 10 && spawnTimer <= 0) {
        var enemy = new Entity(0, 0, 'green');
        enemy.setMidX(canvas.width / 2);
        enemy.setMidY(canvas.height / 2);
        enemies.push(enemy);
        spawnTimer = SPAWN;
    } else if(spawnTimer > 0) {
        spawnTimer -= delta;
    }

    var enemy, dx, dy, total;
    for(var i=0; i<enemies.length; i++) {
        enemy = enemies[i];
        dx = player.x - enemy.x;
        dy = player.y - enemy.y;
        if(ENEMY_RAND > Math.random()) dx *= -1;
        if(ENEMY_RAND > Math.random()) dy *= -1;
        total = Math.abs(dx) + Math.abs(dy);
        enemy.vx += (dx / total) * ACC * delta;
        enemy.vy += (dy / total) * ACC * delta;
        enemy.update(delta);
    }

    for(var i=0; i<enemies.length; i++) {
        for(var n=0; n<enemies.length; n++) {
            if(i == n) continue;
            if(collides(enemies[i], enemies[n])) {
                shove(enemies[i], enemies[n]);
            }
        }
    }

    for(var i=bullets.length-1; i>=0; i--) {
        if(bullets[i].update(delta)) {
            bullets.splice(i, 1);
        } else {
            for(var n=enemies.length-1; n>=0; n--) {
                if(collides(bullets[i], enemies[n])) {
                    enemies.splice(n, 1);
                    bullets.splice(i, 1);
                    score += 10;
                    break;
                }
            }
        }
    }

    for(var i=0; i<enemies.length; i++) {
        enemy = enemies[i];
        if(collides(player, enemy)) {
            shove(player, enemy);
        }
    }

    hitWalls(player);

    for(var i=0; i<enemies.length; i++) {
        hitWalls(enemies[i]);
    }

    for(var i=bullets.length-1; i>=0; i--) {
        if(hitWalls(bullets[i], true)) {
            bullets.splice(i, 1);
        }
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.drawImage(
        zombieSprites,
        2, 44, 24, 26,
        player.x, player.y, player.size, player.size
    );

    for(var i=0; i<enemies.length; i++) {
        context.drawImage(
            zombieSprites,
            87, 45, 16, 23,
            enemies[i].x, enemies[i].y, enemies[i].size, enemies[i].size
        );
    }

    for(var i=0; i<bullets.length; i++) {
        bullets[i].draw();
    }

    for(var x=0; x<XSIZE; x++) {
        for(var y=0; y<YSIZE; y++) {
            if(walls[x][y]) {
                walls[x][y].draw();
            }
        }
    }

    context.font = 'bold 18px monospace';
    context.fillStyle = 'white';
    context.fillText(score, canvas.width - 50, 40);

    window.requestAnimationFrame(gameLoop);
}

function keyDown(e) {
    e.preventDefault();

    switch(e.keyCode) {
        case 37:
        case 65:
            inputs.left = true;
            break;
        case 38:
        case 87:
            inputs.up = true;
            break;
        case 39:
        case 68:
            inputs.right = true;
            break;
        case 40:
        case 83:
            inputs.down = true;
            break;
    }
}

function keyUp(e) {
    e.preventDefault();

    switch(e.keyCode) {
        case 37:
        case 65:
            inputs.left = false;
            break;
        case 38:
        case 87:
            inputs.up = false;
            break;
        case 39:
        case 68:
            inputs.right = false;
            break;
        case 40:
        case 83:
            inputs.down = false;
            break;
    }
}

function mouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    mx = e.pageX - rect.left;
    my = e.pageY - rect.top;
}

function mouseDown(e) {
    inputs.click = true;
}

function mouseUp(e) {
    inputs.click = false;
}

function collides(a, b) {
    if(a.getRight() < b.getLeft()) return false;
    if(a.getBottom() < b.getTop()) return false;
    if(a.getLeft() > b.getRight()) return false;
    if(a.getTop() > b.getBottom()) return false;
    return true;
}

function hitWalls(obj, bullet) {
    var xx = Math.floor(obj.x / SIZE);
    var yy = Math.floor(obj.y / SIZE);
    if(xx < 0) xx = 0;
    if(yy < 0) yy = 0;
    var hit = false;
    for(var x=xx; x<=xx+1; x++) {
        if(x >= XSIZE) continue;
        for(var y=yy; y<=yy+1; y++) {
            if(y >= YSIZE) continue;
            if(walls[x][y] && collides(obj, walls[x][y])) {
                hit = true;
                if(bullet) {
                    walls[x][y] = null;
                } else {
                    shove(walls[x][y], obj, true);
                }
            }
        }
    }

    return hit;
}

function shove(a, b, wall) {
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dxAbs = Math.abs(dx);
    var dyAbs = Math.abs(dy);

    var move;
    if(dxAbs > dyAbs) {
        move = wall ? 0 : b.size - dxAbs;
        if(b.x > a.x) {
            a.x -= move / 2;
            b.setLeft(a.getRight());
        } else {
            a.x += move / 2;
            b.setRight(a.getLeft());
        }
    } else {
        move = wall ? 0 : b.size - dyAbs;
        if(b.y > a.y) {
            a.y -= move / 2;
            b.setTop(a.getBottom());
        } else {
            a.y += move / 2;
            b.setBottom(a.getTop());
        }
    }
}
