

Events.on(engine, "beforeTick", function(event) {
    // Detect key-down events for ship controls

    // movement, ship1
    if (keys[65] && ship1.alive) {  // a
        Body.rotate(ship1, -spin);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[68] && ship1.alive) {  // d
        Body.rotate(ship1, spin);
        Body.setAngularVelocity(ship1, 0);
    }
    if (keys[83] && ship1.alive) {  // s, thrust
        if (ship1.energy >= thrustCost) {
            Body.applyForce(ship1,
                {x: ship1.position.x, y: ship1.position.y},
                {x: Math.cos(ship1.angle) * thrust, y: Math.sin(ship1.angle) * thrust}
            );
            Body.setAngularVelocity(ship1, 0);

            ship1.energy -= thrustCost;
        }
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
    if (keys[81] && ship1.alive) {  // q, ship 1 laser
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

    if (keys[73] && ship2.alive) {  // i, ship 2 laser
        if (!ship2.firedLaser) {
            fireLaser(ship2);
            ship2.firedLaser = true;
        }
    } else {
        ship2.firedLaser = false;
    }


    // torpedo
    if (keys[69] && ship1.alive) {  // e, ship 1 torpedo
        if (!ship1.firedTorpedo) {
            fireTorpedo(ship1);
            ship1.firedTorpedo = true;
        }
    } else {
        ship1.firedTorpedo = false;
    }

    if (keys[80]) {  // p, ship 2 torpedo
        if (!ship2.firedTorpedo) {
            fireTorpedo(ship2);
            ship2.firedTorpedo = true;
        }
    } else {
        ship2.firedTorpedo = false;
    }

    
    // divert energy from shields to weapons
    if (keys[90] && ship1.alive) {  // z
        if (ship1.shields > 1) {
            // cannot divert shields to death
            ship1.shields -= 1;
            ship1.energy += 1;
        }
    }
    if (keys[188] && ship1.alive) {  // ,
        if (ship2.shields > 1) {
            ship2.shields -= 1;
            ship2.energy += 1;
        }
    }

    // divert energy from weapons to shields
    if (keys[67] && ship1.alive) {  // c
        if (ship1.energy > 1) {
            ship1.energy -= 1;
            ship1.shields += 1;
        }
    }
    if (keys[191]) {  // '/'
        if (ship2.energy > 1) {
            ship2.energy -= 1;
            ship2.shields += 1;
        }
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
        var l1 = pair.bodyA.label,
            l2 = pair.bodyB.label;
            
        // handle ship to planet collisions
        if (l1.startsWith("ship") && l2 === 'planet') {
            pair.bodyA.shields -= crashDamage;
        }
        if (l2.startsWith("ship") && l1 === 'planet') {
            pair.bodyB.shields -= crashDamage;
        }

        // handle torpedo collisions
        if (l1.startsWith('torpedo') ) {
            torpedoHit(pair.bodyA, pair.bodyB);
        } else if (l2.startsWith('torpedo')) {
            torpedoHit(pair.bodyB, pair.bodyA)
        }
        
    }
});


/*
Stolen from: https://stackoverflow.com/questions/47207541/matter-js-how-to-remove-bodies-after-collision
 */
Events.on(engine, 'collisionEnd', function(event) {
    var pair, pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        pair = pairs[i];
        if (pair.bodyA.label === 'shrapnel') {
            Composite.remove(world, pair.bodyA, deep=true);
        }
        if (pair.bodyB.label === 'shrapnel') {
            Composite.remove(world, pair.bodyB, deep=true);
        }
        
        if (pair.bodyA.label === 'debris' && pair.bodyB.label==='planet') {
            Composite.remove(world, pair.bodyA, deep=true);
        }
        if (pair.bodyB.label === 'debris' && pair.bodyA.label==='planet') {
            Composite.remove(world, pair.bodyB, deep=true);
        }
    }
});


Events.on(render, 'afterRender', function() {
    // fired after rendering
    
    // if either ship was damaged with no shields, explode and end game
    if (ship1.shields < 0) {
        // ship explode - stop simulation
        explodeShip(ship1);
        //Runner.stop(runner);
        // TODO: trigger explosion animation and game end sequence
    }
    if (ship2.shields < 0) {
        explodeShip(ship2);
        //Runner.stop(runner);
    }

    // energy regenerated by 1 point per half second
    if (Math.round(engine.timing.timestamp) % 500 == 0) {
        if (ship1.energy < initEnergy) {
            ship1.energy += 1;
        }
        if (ship2.energy < initEnergy) {
            ship2.energy += 1;
        }
    }

    // coordinates relative top-left corner
    var x1 = 30,  // lower left
        y1 = render.canvas.height*0.91,  // upper row
        x2 = render.canvas.width - 30,  // lower right
        y2 = render.canvas.height*0.95;  // lower row

    var ctx = render.canvas.getContext('2d');


    ctx.strokeStyle = "grey";
    ctx.lineWidth = 2;
    ctx.font = '18pt fixed';

    // FIXME: this is a horrible hack
    ctx.strokeText("S", x1-22, y1+6);
    ctx.strokeText("S", x2+8, y1+6);
    ctx.strokeText("E", x1-22, y2+6);
    ctx.strokeText("E", x2+8, y2+6);

    // draw shield levels
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(Math.max(x1, x1+ship1.shields*2), y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y1);
    ctx.lineTo(Math.min(x2, x2-ship2.shields*2), y1);
    ctx.stroke();

    // draw energy levels
    ctx.beginPath();
    ctx.moveTo(x1, y2);
    ctx.lineTo(Math.max(x1, x1+ship1.energy*2), y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(Math.min(x2, x2-ship2.energy*2), y2);
    ctx.stroke();
});