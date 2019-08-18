// globals
var torpedoCost = 5,
    shipRadius = 15,
    initShields = 100,
    initEnergy = 100,

    maxTorpedos = 5,
    launchSpeed = 5,  // of torpedo
    torpedoDamage = 10,

    laserDamage = 5,
    laserRange = 150,
    laserCooldown = 250, // milliseconds

    planetRadius = 30,
    planetGravity = 5e-8,
    crashDamage = 10;

var thrust = 0.0003,
    spin = 0.1;


// module aliases
Matter.use(
    'matter-wrap',
    'matter-attractors'
);

var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Events = Matter.Events,
    Common = Matter.Common,
    World = Matter.World,
    Body = Matter.Body,
    Vector = Matter.Vector,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Query = Matter.Query;


// create an engine
var engine = Engine.create(),
    world = engine.world;

engine.world.gravity.scale = 0;


var width = document.body.clientWidth,
    height = document.documentElement.clientHeight;

var canvas1 = document.getElementById('world');
canvas1.width = width;
canvas1.height = height;

var canvas2 = document.getElementById('overlay');
canvas2.width = width;
canvas2.height = height;




// create renderer
var render = Render.create({
    canvas: canvas1,
    engine: engine,
    options: {
        width: width,
        height: height,
        showVelocity: false,
        showAngleIndicator: false,
        wireframes: false
    }
});

Render.run(render);




// create two ships
function makeaship(x, y, label, sprite) {
    return Bodies.circle(
        x, y, shipRadius,
        {
            label: label,
            shields: initShields,
            energy: initEnergy,
            torpedos: maxTorpedos,  // limit number actively flying around

            firedLaser: false,  // used for controlling keydown
            timeFired: 0,
            firedTorpedo: false,

            restitution: 0.99,  // bounce
            friction: 0,
            frictionAir: 0,

            // set the body's wrapping bounds
            plugin: {
                wrap: {
                    min: {x: 0, y: 0},
                    max: {x: render.canvas.width, y: render.canvas.height}
                }
            },
            render: {
              sprite: {
                texture: sprite
              }
            }
        });
}
var ship1 = makeaship(width*0.1, height*0.9, 'ship1', './img/ship1.png'),
    ship2 = makeaship(width*0.9, height*0.1, 'ship2', './img/ship2.png');


var planet = Bodies.circle(
    width*0.5, height*0.5, planetRadius,
    {
        isStatic: true,
        label: 'planet',
        plugin: {
            attractors: [
                function(bodyA, bodyB) {
                    return {
                        x: (bodyA.position.x - bodyB.position.x) * planetGravity,
                        y: (bodyA.position.y - bodyB.position.y) * planetGravity,
                    };
                }
            ]
        },
        render: {
            sprite: {
                texture: './img/planet.png'
            }
        }
    }
    );

World.add(world, [planet, ship1, ship2]);


// go!
var runner = Runner.create();
Runner.run(runner, engine);





// looks for key presses and logs them
// https://gist.github.com/lilgreenland/c6f4b78a78b73dc8b1f8fa650d617b85
var keys = [],
    keysRepeat = [];
document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});




Events.on(engine, "beforeTick", function(event) {
    /*
    Detect key-down events for ship controls
    */
    if (keys[65]) {  // a
        Body.rotate(ship1, -spin);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[68]) {  // d
        Body.rotate(ship1, spin);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[83]) {  // s, thrust
        Body.applyForce(ship1,
            {x: ship1.position.x, y: ship1.position.y},
            {x: Math.cos(ship1.angle) * thrust, y: Math.sin(ship1.angle) * thrust}
        );
        Body.setAngularVelocity(ship1, 0);
    }
    

    // the original used numeric keypad, but I'm writing this on a laptop..
    if (keys[75]) {  // k, rotate left
        Body.rotate(ship2, -spin);
        Body.setAngularVelocity(ship2, 0);
    }
    if (keys[186]) {  // ;, rotate right
        Body.rotate(ship2, spin);
        Body.setAngularVelocity(ship2, 0);
    }
    if (keys[76]) {  // l, thrust
        Body.applyForce(ship2,
            {x: ship2.position.x, y: ship2.position.y},
            {x: Math.cos(ship2.angle) * thrust, y: Math.sin(ship2.angle) * thrust}
            );
        Body.setAngularVelocity(ship2, 0);
    }

    // laser
    if (keys[81]) {  // q, ship 1 laser
        if (!ship1.firedLaser) {
            // this causes laser to fire once with key press
            // even if player holds down key
            fireLaser(ship1);
            ship1.firedLaser = true;
        }
    } else {
        // player stopped pressing key, re-enable firing
        ship1.firedLaser = false;
    }

    if (keys[73]) {  // i, ship 2 laser
        if (!ship2.firedLaser) {
            fireLaser(ship2);
            ship2.firedLaser = true;
        }
    } else {
        ship2.firedLaser = false;
    }


    // torpedo
    if (keys[69]) {  // e, ship 1 torpedo
        if (!ship1.firedTorpedo) {
            fireTorpedo(ship1);
            ship1.firedTorpedo = true;
        }
    } else {
        ship1.firedTorpedo = false;
    }

    if (keys[80]) {  // p, ship 1 torpedo
        if (!ship2.firedTorpedo) {
            fireTorpedo(ship2);
            ship2.firedTorpedo = true;
        }
    } else {
        ship2.firedTorpedo = false;
    }
});


Events.on(engine, 'collisionStart', function(event) {
    // moment.js event handler provide list of all pairs of 
    // bodies that have started to collide on this tick
    // TODO: torpedos
    var pairs = event.pairs,
        npairs = pairs.length;

    for (var i = 0; i < npairs; i++) {
        pair = pairs[i];

        // handle ship to planet collisions
        if (pair.bodyA.label.startsWith("ship") && pair.bodyB.label === 'planet') {
            pair.bodyA.shields -= crashDamage;
        }
        if (pair.bodyB.label.startsWith("ship") && pair.bodyA.label === 'planet') {
            pair.bodyB.shields -= crashDamage;
        }

        // handle torpedo collisions
        if (pair.bodyA.label.startsWith('torpedo') ) {
            torpedoHit(pair.bodyA, pair.bodyB);
        } else if (pair.bodyB.label.startsWith('torpedo')) {
            torpedoHit(pair.bodyB, pair.bodyA)
        }
    }
});


Events.on(render, 'afterRender', function() {
    // fired after rendering
    if (ship1.shields < 0) {
        // ship explode - stop simulation
        Runner.stop(runner);
        // TODO: trigger explosion animation and game end sequence
    }
    if (ship2.shields < 0) {
        Runner.stop(runner);
    }

    // coordinates relative top-left corner
    var x1 = render.canvas.width*0.05,
        y1 = render.canvas.height*0.95,
        x2 = render.canvas.width*0.95;

    var ctx = render.canvas.getContext('2d');

    // draw shield levels
    ctx.strokeStyle = "white";
    ctx.strokeWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(Math.max(x1, x1+ship1.shields*2), y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y1);
    ctx.lineTo(Math.min(x2, x2-ship2.shields*2), y1);
    ctx.stroke();
});