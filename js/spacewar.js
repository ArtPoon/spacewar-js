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
    Bodies = Matter.Bodies;


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
        showVelocity: true,
        showAngleIndicator: true
    }
});

Render.run(render);




// create two ships
function makeaship(x, y, label) {
    return Bodies.circle(
        x, y, 15,
        {
            label: label,
            shields: 100,
            restitution: 0.99,  // bounce
            friction: 0,
            frictionAir: 0,
            // set the body's wrapping bounds
            plugin: {
                wrap: {
                    min: {x: 0, y: 0},
                    max: {x: render.canvas.width, y: render.canvas.height}
                }
            }
        }
    );
}
var ship1 = makeaship(width*0.1, height*0.9, 'ship1'),
    ship2 = makeaship(width*0.9, height*0.1, 'ship2');




function update_status(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(10+ship1.shields, 10);
    ctx.stroke();

}

var ctx2 = canvas2.getContext('2d');
update_status(ctx2);



var planet = Bodies.circle(
    width*0.5, height*0.5, 30,
    {
        isStatic: true,
        label: 'planet',
        plugin: {
            attractors: [
                function(bodyA, bodyB) {
                    return {
                        x: (bodyA.position.x - bodyB.position.x) * 1e-7,
                        y: (bodyA.position.y - bodyB.position.y) * 1e-7,
                    };
                }
            ]
        }
    }
    );

World.add(world, [planet, ship1, ship2]);


// go!
var runner = Runner.create();
Runner.run(runner, engine);



var thrust = 0.0005,
    spin = 0.1;

// looks for key presses and logs them
// https://gist.github.com/lilgreenland/c6f4b78a78b73dc8b1f8fa650d617b85
var keys = [];
document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});







Events.on(engine, "beforeTick", function(event) {
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

});


Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs,
        npairs = pairs.length;
    for (var i = 0; i < npairs; i++) {
        pair = pairs[i];
        if (pair.bodyA.label.startsWith("ship") && pair.bodyB.label === 'planet') {
            pair.bodyA.shields -= 10;
            if (pair.bodyA.shields < 0) {
                Runner.stop(runner);
            }
        }
        if (pair.bodyB.label.startsWith("ship") && pair.bodyA.label === 'planet') {
            pair.bodyB.shields -= 10;
            if (pair.bodyB.shields < 0) {
                Runner.stop(runner);
            }
        }
    }
});


Events.on(render, 'afterRender', function() {
    var ctx = render.canvas.getContext('2d');
    ctx.strokeStyle = "white";
    ctx.strokeWidth = 5;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(200, 200);
    ctx.stroke();
});