// globals
var shipRadius = 15,
    initShields = 100,
    initEnergy = 100,
    thrustCost = 0.1,

    maxTorpedos = 5,
    launchSpeed = 5,  // of torpedo
    torpedoDamage = 10,
    torpedoCost = 5,

    laserDamage = 5,
    laserRange = 150,
    laserCooldown = 250, // milliseconds
    laserCost = 2,

    numberOfStars = 100;
    planetRadius = 30,
    planetGravity = 1e-8,
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
    Composites = Matter.Composites,
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


// TODO: draw star field under main canvas
var canvas2 = document.getElementById('overlay');
canvas2.width = width;
canvas2.height = height;

var ctx2 = canvas2.getContext('2d');
ctx2.fillStyle = 'white';
for (var i = 0; i < numberOfStars; i++) {
    ctx2.fillRect(Math.random()*canvas2.width, 
    Math.random()*canvas2.height, 1, 1);
}



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
            ammo: maxTorpedos,  // limit number actively flying around

            firedLaser: false,  // used for controlling keydown
            timeFired: 0,
            firedTorpedo: false,

            alive: true,  // if false, ignore all controls

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
    //console.log(e.keyCode);
    keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});


