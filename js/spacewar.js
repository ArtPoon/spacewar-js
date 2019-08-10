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
            fired: false,
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



var thrust = 0.0003,
    spin = 0.1;

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




function fireLaser(ship) {
    // endPoint should extend out from nose of ship to some limit
    var lrange = 150;
    var startPoint = {
            x: ship.position.x + 15*Math.cos(ship.angle), 
            y: ship.position.y + 15*Math.sin(ship.angle)
        },
        endPoint = {
            x: startPoint.x + lrange*Math.cos(ship.angle), 
            y: startPoint.y + lrange*Math.sin(ship.angle)
        };

    var bodies = Composite.allBodies(engine.world);
    var ctx = render.canvas.getContext('2d');
    //console.log(endPoint);
    
    // check for collisions on path
    var hits = Query.ray(bodies, startPoint, endPoint);
    
    if (hits.length > 0) {
        // we hit something!  what was the closest thing?
        var collision,
            dx, dy, dist, 
            mindist = 2*lrange,
            nearest = null;

        for (var i=0; i < hits.length; i++) { 
            collision = hits[i];

            dx = ship.position.x - collision.body.position.x;
            dy = ship.position.y - collision.body.position.y;
            dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < mindist) {
                mindist = dist;
                nearest = collision.body;
            }
        }

        // draw the laser
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(nearest.position.x, nearest.position.y);
        ctx.stroke();

        // deduct shields if ship
        if (nearest.label.startsWith('ship')) {
            nearest.shields -= 5;
            if (nearest.shields < 0) {
                Runner.stop(runner);
            }
        }

        // TODO: explode torpedo
    } else {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
    }

}


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
        if (!ship1.fired) {
            fireLaser(ship1);
            ship1.fired = true;
        }
    } else {
        ship1.fired = false;
    }
    if (keys[73]) {  // i, ship 2 laser
        if (!ship2.fired) {
            fireLaser(ship2);
            ship2.fired = true;
        }
    } else {
        ship2.fired = false;
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
        if (pair.bodyA.label.startsWith("ship") && pair.bodyB.label === 'planet') {
            pair.bodyA.shields -= 10;
            if (pair.bodyA.shields < 0) {
                // ship explode - stop simulation
                Runner.stop(runner);
                // TODO: trigger explosion animation and game end sequence
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
    // fired after rendering

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