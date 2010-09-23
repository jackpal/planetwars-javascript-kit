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
        maxTurns: args[2], logfile: args[3],
        players: [args[4].split(), args[5].split()]
    };
}

function Planet(id, x, y, owner, ships, growth) {
    return {
        id : id,
        x : x,
        y : y,
        owner : owner,
        ships : ships,
        growth : growth,
        fmt: function() {
            return ['P', this.x, this.y, this.owner, this.ships,
                    this.growth].join(' ');
        }
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
        remaining : remaining,
        fmt: function() {
            return ['F', this.owner, this.ships, this.source, this.dest,
                    this.totalLength, this.remaining].join(' ');
        }
    };
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
    return {planets: planets, fleets: fleets};
}

function formatState(state) {
    var acc = '';
    state.planets.forEach(function(v, i, a) {
        acc += v.fmt() + '\n';});
    state.fleets.forEach(function(v, i, a) {
        acc += v.fmt() + '\n';});
    return acc;
}

function startClockwork(state, args, players, callback) {
    var state = formatState(state);
    sys.puts(state);
}

function startGame(rawArgs){
    var args = parseArgs(rawArgs);
    var state = readState(args.map);
    if (state.fleets.length > 0) {
        p("Didn't expect to find fleets in a starter map.");
    }
    var players = args.players.map(function(val, index, array) {
        return {cmdLine: val, child: child_process.spawn(val[0], val.slice(1))};
    });
    state.turn = 0;
    startClockwork(state, args, players,
            function(winner) {
                p(['Clockwork result', winner]);
            });
}

startGame(process.argv.slice(2));
