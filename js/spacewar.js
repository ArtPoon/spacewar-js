// module aliases
Matter.use(
    'matter-wrap',
    'matter-attractors'
);

var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Events = Matter.Events,
    Composites = Matter.Composites,
    Common = Matter.Common,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    World = Matter.World,
    Body = Matter.Body,
    Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create(),
    world = engine.world;

engine.world.gravity.scale = 0;


var width = window.innerWidth,
    height = window.innerHeight;

// create renderer
var render = Render.create({
    element: document.body,
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
function makeaship(x, y) {
    return Bodies.circle(
        x, y, 15,
        {
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
var ship1 = makeaship(width*0.1, height*0.9),
    ship2 = makeaship(width*0.9, height*0.1);

var planet = Bodies.circle(
    width*0.5, height*0.5, 30,
    {
        isStatic: true,
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





// go!
var runner = Runner.create();
Runner.run(runner, engine);

