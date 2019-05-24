// module aliases
Matter.use('matter-wrap');

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

engine.world.gravity.y = 0;

// create renderer
var render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 800,
        height: 600,
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
var ship1 = makeaship(100, 500),
    ship2 = makeaship(700, 100);

World.add(world, [ship1, ship2]);




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
    if (keys[37]) {
        // left arrow
        Body.rotate(ship1, -0.1);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[39]) {
        // right arrow
        Body.rotate(ship1, 0.1);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[38]) {
        // up arrow
        Body.applyForce(ship1,
            {x: ship1.position.x, y: ship1.position.y},
            {x: Math.cos(ship1.angle) * 0.001, y: Math.sin(ship1.angle) * 0.001}
            )
        Body.setAngularVelocity(ship1, 0);
    }
});



// go!
var runner = Runner.create();
Runner.run(runner, engine);

