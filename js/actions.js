

function fireLaser(ship) {
    // TODO: enforce delay to prevent player from firing too frequently

    // endPoint should extend out from nose of ship to some limit
    var lrange = 150;
    var startPoint = {
            x: ship.position.x + ship.circleRadius*Math.cos(ship.angle), 
            y: ship.position.y + ship.circleRadius*Math.sin(ship.angle)
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
        ctx.strokeStyle = "white";
        ctx.strokeWidth = 2.0;  // FIXME: this isn't working..

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
        if (nearest.label.startsWith('torpedo')) {
            explodeTorpedo(nearest);
        }

        // TODO: explode torpedo
    } else {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
    }

}


function explodeTorpedo(torpedo) {
    World.remove(world, torpedo);
    // TODO: display animation
    ship = Composite.get(world, torpedo.firedBy, 'body');
    ship.torpedos += 1;
}


function fireTorpedo(ship) {
    if (ship.torpedos > 0) {  // TODO: energy requirement?
        if (ship.energy < torpedoCost) {
            return; // do nothing
        }
        ship.energy -= torpedoCost; 
        ship.torpedos -= 1;


        var torpedo = Bodies.circle(
            ship.position.x + (ship.circleRadius+5)*Math.cos(ship.angle), 
            ship.position.y + (ship.circleRadius+5)*Math.sin(ship.angle), 
            5, {
                label: 'torpedo.'+ship.label+'.'+ship.torpedos,
                firedBy: ship.id,
                restitution: 0.,
                friction: 0,
                frictionAir: 0,
                plugin: {
                    wrap: {
                        min: {x: 0, y: 0},
                        max: {x: render.canvas.width, y: render.canvas.height}
                    }
                },
            });
        
            //console.log(torpedo.label);
        World.add(world, [torpedo]);

        // FIXME: ships can run into their own torpedos on launch
        Body.applyForce(torpedo, torpedo.position, {
            x: 0.001*Math.cos(ship.angle),
            y: 0.001*Math.sin(ship.angle)
        })
    } 
    // else do nothing, ship cannot launch any more
}


function torpedoHit(torpedo, target) {
    explodeTorpedo(torpedo);

    //console.log(torpedo.label, 'hit', target.label)
    if (target.label.startsWith('torpedo')) {
        explodeTorpedo(target);
    } else if (target.label.startsWith('ship')) {
        target.shields -= 10;
    }
}
