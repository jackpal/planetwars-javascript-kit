var sys = require('sys');

function Planet(id, x, y, owner, ships, growth) {
    return {
        id : id,
        x : x,
        y : y,
        owner : owner,
        ships : ships,
        growth : growth
    };
}

function Fleet(id, owner, ships, source, dest, totalLength, remaining) {
    return {
        id : id,
        owner : owner,
        ships : ships,
        source : source,
        dest : dest,
        totalLength : totalLength,
        remaining : remaining
    };
}

function Universe(planets, fleets) {
    var i;
    var planetsLength = planets.length;
    var myPlanets = [];
    var enemyPlanets = [];
    var neutralPlanets = [];
    var planet;
    var planetsByOwner = [ neutralPlanets, myPlanets, enemyPlanets ];
    var owner;
    for (i = 0; i < planetsLength; i++) {
        planet = planets[i];
        owner = planet.owner;
        planetsByOwner[owner < 0 || owner > 1 ? 2 : owner].push(planet);
    }

    var myFleets = [];
    var enemyFleets = [];
    var fleetsLength = fleets.length;
    var fleetsByOwner = [ myFleets, enemyFleets ];
    var fleet;
    for (i = 0; i < fleetsLength; i++) {
        fleet = fleets[i];
        owner = fleet.owner;
        fleetsByOwner[owner == 1 ? 0 : 1].push(fleet);
    }

    return {
        planets : planets,
        neutralPlanets : neutralPlanets,
        myPlanets : myPlanets,
        enemyPlanets : enemyPlanets,
        notMyPlanets : neutralPlanets.concat(enemyPlanets),
        notEnemyPlanets : neutralPlanets.concat(myPlanets),
        notNeutralPlanets : myPlanets.concat(enemyPlanets),

        fleets : fleets,
        myFleets : myFleets,
        enemyFleets : enemyFleets,

        issueOrder : function issueOrder(source, dest, ships) {
            process.stdout.write('' + Math.floor(source) + ' ' +
                    Math.floor(dest) + ' ' + Math.floor(ships) + '\n');
        }
    };
}

function parseInput(turnInput, turnFn) {
    var lines = turnInput.split('\n');
    var linesLength = lines.length;
    var i;
    var line;
    var noCommentLine;
    var planets = [];
    var fleets = [];
    var toks;
    var cmd;
    var universe;
    for (i = 0; i < linesLength; i++) {
        line = lines[i];
        noCommentLine = line.split('#')[0];
        toks = noCommentLine.split(' ');
        cmd = toks[0];
        switch (cmd) {
        case 'P':
            planets.push(Planet(planets.length, toks[1], toks[2], toks[3],
                    toks[4], toks[5]));
            break;
        case 'F':
            fleets.push(Fleet(fleets.length, toks[1], toks[2], toks[3],
                    toks[4], toks[5], toks[6]));
            break;
        case '':
            // Empty line.
            break;
        default:
            throw "Unknown command token: " + line;
        }
    }
    universe = Universe(planets, fleets);
    turnFn(universe);
    process.stdout.write('go\n');
}

exports.play = function play(turnFn) {
    var stdin = process.openStdin();
    var buffer = '';
    sys.debug('Play()');
    stdin.on('data', function(chunk) {
        buffer += chunk;
        var endOfTurn = buffer.indexOf('\ngo\n');
        if (endOfTurn >= 0) {
            var turnInput = buffer.substring(0, endOfTurn);
            buffer = buffer.substring(endOfTurn + 4);
            parseInput(turnInput, turnFn);
        }
    });

    stdin.on('end', function() {
        sys.debug('end of stdin, exiting');
        sys.exit();
    });
};

exports.distance = function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.ceil(Math.sqrt(dx*dx+dy*dy));
};

