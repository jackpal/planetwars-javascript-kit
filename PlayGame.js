// A JavaScript version of the game player.
//

var child_process = require('child_process');
var fs = require('fs');
var sys = require('sys');
var async = require('./async');

function p(o) {
    sys.puts(sys.inspect(o));
}

function l(o) {
    sys.log(sys.inspect(o));
}

function usage(str) {
    if (str) {
        console.log(str);
    }
    console.log("usage: map turnTime maxTurns logfile player1 player2");
}

function parseArgs(args) {
    if (args.length != 6) {
        usage("need six arguments. Saw " + args.length);
        process.exit(1);
    }
    return {map: args[0], turnTime: args[1],
        maxTurns: args[2], logFile: args[3],
        players: [args[4].split(' '), args[5].split(' ')]
    };
}

var idMap = [[0, 1, 2], [0, 2, 1]];

function mapId(pid, id) {
    if (id < 0 || id > 2 || pid < 1 || pid > 2) {
        var e = "Bad id or pid " + id + " " + pid;
        l(e);
        throw e;
    }
    return idMap[pid-1][id];
}

function numberToJavaString(n) {
    if (n == 0) {
	return '0.0';
    } else {
	return ''+n;
    }
}

function Planet(id, x, y, owner, ships, growth) {
    return {
        id : id,
        x : x,
        y : y,
        owner : owner,
        ships : ships,
        growth : growth,
        fmt: function(pid) {
            return ['P', numberToJavaString(this.x), numberToJavaString(this.y), mapId(pid, this.owner), this.ships,
                    this.growth].join(' ');
        }
    };
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.ceil(Math.sqrt(dx*dx+dy*dy));
}

function Fleet(id, owner, ships, source, dest, totalLength, remaining) {
    return {
        id : id,
        owner : owner,
        ships : ships,
        source : source,
        dest : dest,
        totalLength : totalLength,
        remaining : remaining,
        fmt: function(pid) {
            return ['F', mapId(pid, this.owner),
                    this.ships, this.source, this.dest,
                    this.totalLength, this.remaining].join(' ');
        }
    };
}

function parse10(a) {
    return parseInt(a, 10);
}

function readState(mapName) {
    var mapData = fs.readFileSync(mapName, 'utf8');
    var lines = mapData.split('\n');
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
        noCommentLine = line.split('#')[0].trim();
        toks = noCommentLine.split(' ');
        cmd = toks[0];
        switch (cmd) {
        case 'P':
            planets.push(Planet(planets.length,
                    parseFloat(toks[1]),
                    parseFloat(toks[2]),
                    parse10(toks[3]),
                    parse10(toks[4]), parse10(toks[5])));
            break;
        case 'F':
            fleets.push(Fleet(fleets.length,
                    parse10(toks[1]),
                    parse10(toks[2]),
                    parse10(toks[3]),
                    parse10(toks[4]),
                    parse10(toks[5]),
                    parse10(toks[6])));
            break;
        case '':
            // Empty line.
            break;
        default:
            throw "Unknown command token: " + line;
        }
    }
    return {planets: planets, fleets: fleets};
}

function formatState(state, playerId) {
    var acc = '';
    state.planets.forEach(function(v, i, a) {
        acc += v.fmt(playerId) + '\n';});
    state.fleets.forEach(function(v, i, a) {
        acc += v.fmt(playerId) + '\n';});
    return acc;
}

function sendStateToPlayers(state, players) {
    players.forEach(function(v, i, a) {
        var gameReport = formatState(state, v.id) + 'go\n';
	state.log.write('engine > player' + v.id + ': ' + gameReport + '\n');
        v.child.stdin.write(gameReport);
    });
}

function startPlayer(state, id, commandLine, responseCallback) {
    var player = {
            cmdLine: commandLine,
            id: id,
            child: child_process.spawn(commandLine[0], commandLine.slice(1)),
            err: '', // stderr from client
            state: 'alive', // alive, dead
            isAlive: function() { return this.state === 'alive'; }
            };
    var lines = [];
    var curLine = '';
    player.child.stdout.on('data', function(data) {
        curLine = curLine + data;
        var newLines = curLine.split('\n');
        var newLinesLen = newLines.length;
        curLine = newLines[newLinesLen-1];
        if ( newLinesLen > 1) {
            var newWholeLines = newLines.slice(0, newLinesLen-1);
	    lines = lines.concat(newWholeLines);
	    newWholeLines.forEach(function(v, i, a) {
		    state.log.write('player' + player.id + ' > engine: ' + v + '\n');
		});
            var linesLength = lines.length;
            if (lines[linesLength-1] === 'go') {
                var lines2 = lines.slice(0, linesLength-1);
                lines = [];
                responseCallback(player, lines2);
            }
        }
    });
    player.child.stderr.on('data', function(data) {
        player.err += data;
    });
    return player;
}

function doOrders(state, player, lines) {
    var result;
    var planets = state.planets;
    var fleets = state.fleets;
    var pid = player.id;
    lines.every(function(v, i, a) {
        var items = v.split(' ');
        if (items.length != 3) {
            result = 'Bad number of items';
            return false;
        }
        var from = parseInt(items[0], 10);
        var to = parseInt(items[1], 10);
        var ships = parseInt(items[2], 10);
        if (from < 0 || from >= planets.length) {
            result = 'bad from value';
            return false;
        }
        var fromPlanet = planets[from];
        if (fromPlanet.owner != pid) {
            result = 'not owner';
            return false;
        }
        if (to < 0 || to >= planets.length) {
            result = 'bad to value';
            return false;
        }
        if (from == to) {
            result = 'from == to';
            return false;
        }
        if (to < 0 || to >= planets.length) {
            result = 'bad to value';
            return false;
        }
        if (ships < 0 || ships > fromPlanet.ships) {
            result = 'bad ships';
            return false;
        }
        fromPlanet.ships -= ships;
        var length = distance(fromPlanet, planets[to]);
        fleets.push(Fleet(fleets.length, pid,
                ships, from, to, length, length));
        return true;
    });
    return result;
}

function doAdvancement(state) {
    state.planets.forEach(function(v, i, a) {
        if (v.owner) {
            v.ships += v.growth;
        }
    });
    state.fleets.forEach(function(v, i, a) {
        v.remaining -= 1;
    });
}

function battle(forces, oldOwner) {
    var a2 = forces.map(function(v, i, a) {return [v, i];});
    a2.sort(function(a, b) { return a[0]-b[0]; });
    var strongestIndex = a2[2][1];
    var strongestValue = a2[2][0];
    var secondStrongestValue = a2[1][0];
    var newValue = strongestValue - secondStrongestValue;
    var winner = strongestIndex;
    if (newValue == 0) {
        winner = oldOwner;
    }
    return [winner, newValue];
}

function doArrival(state) {
    var newFleets = [];
    var forces = []; // Planet : [neutral fleet total, p1 fleet total, p2 fleet total]
    var battleIndexes = [];
    state.fleets.forEach(function(v, i, a) {
        if (v.remaining > 0) {
            newFleets.push(v);
        } else {
            // Fleet has arrived
            var dest = v.dest;
            var destForces = forces[dest];
            if (!destForces) {
                forces[dest] = destForces = [0, 0, 0];
                battleIndexes.push(dest);
            }
            destForces[v.owner] += v.ships;
        }
    });
    state.fleets = newFleets;
    battleIndexes.forEach(function(i, ai, a) {
        var v = forces[i];
        var planet = state.planets[i];
	v[planet.owner] += planet.ships;
        var result = battle(v, planet.owner);
        planet.owner = result[0];
        planet.ships = result[1];
    });
}

function doEndgame(state, players) {
    players.forEach(function(v,i,a) {
        v.child.stdin.end();
    });
    var p1Alive = players[0].isAlive();
    var p2Alive = players[1].isAlive();
    if (! p1Alive && ! p2Alive) {
        l("Draw");
    } else if (p1Alive && ! p2Alive) {
        l("Player 1 wins");
    } else if (p2Alive && ! p1Alive) {
        l("Player 2 wins");
    } else {
        var ships = [0, 0, 0];
        state.planets.forEach(function(v, i, a) {
            ships[v.owner] += v.ships;
        });
        state.fleets.forEach(function(v, i, a) {
            ships[v.owner] += v.ships;
        });
        l(ships);
        if (ships[1] > ships[2]) {
            l("Player 1 wins");
        } else if (ships[1] == ships[2]) {
            l("Draw");
        } else {
            l("Player 2 wins");
        }
    }
    state.log.end();
}

function startGame(rawArgs){
    var args = parseArgs(rawArgs);
    var state = readState(args.map);
    if (state.fleets.length > 0) {
        p("Didn't expect to find fleets in a starter map.");
    }
    state.log = fs.createWriteStream(args.logFile);
    state.log.write('initializing\n');
    var players = args.players.map(function(val, index, array) {
        return startPlayer(state, index + 1, val, function(p, lines) {
            if (p.isAlive()) {
                var err = doOrders(state, p, lines);
                if (err) {
                    l("Killing player: " + err);
                    p.state = 'dead';
                }
            }
            state.playersWhoHaveGivenOrders += 1;
            if (state.playersWhoHaveGivenOrders >= 2) {
                doAdvancement(state);
                doArrival(state);
                state.turn += 1;
                state.playersWhoHaveGivenOrders = 0;
                if (state.turn < args.maxTurns) {
                    sendStateToPlayers(state, players);
                } else {
                    doEndgame(state, players);
                }
            }
        });
    });
    state.turn = 0;
    state.playersWhoHaveGivenOrders = 0;
    sendStateToPlayers(state, players);
}

startGame(process.argv.slice(2));
