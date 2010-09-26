//Node.js AI Challenge contents player

var child_process = require('child_process');
var fs = require('fs');
var sys = require('sys');
var async = require('./async');

var players = [
["node", "MyBot.js"]
 ];

var enemies = [
               ["java", "-jar", "example_bots/BullyBot.jar"],
               ["java", "-jar", "example_bots/DualBot.jar"],
               ["java", "-jar", "example_bots/ProspectorBot.jar"],
               ["java", "-jar", "example_bots/RageBot.jar"],
               ["java", "-jar", "example_bots/RandomBot.jar"],
               ];

var allBots = players.concat(enemies);

function formatPlayer(p) {
    return p.join(' ');
}

function playGame(a, b, map, resultCB) {
    // var player = ["java", "-jar", "tools/PlayGame-1.2.jar"];
    var player = ["node", "PlayGame.js"];
    // args to playgame: map, max turn time in ms, max turns in game, logfile,
    // player 1, player 2
    var args = [map, "1000", "200", "log.txt",
                formatPlayer(a), formatPlayer(b)];
    var player = child_process.spawn(player[0], player.slice(1).concat(args));

    var stdOutBuf = '';
    var stdErrBuf = '';

    player.stdout.on('data', function (data) {
        stdOutBuf += data;
    });

    player.stderr.on('data', function (data) {
        stdErrBuf += data;
    });

    player.on('exit', function (code) {
        resultCB(code, stdOutBuf, stdErrBuf);
    });
}

function readDir(path) {
    var files = fs.readdirSync(path);
    var i, filesLen = files.length;
    for (i = 0; i < filesLen; i++) {
        files[i] = path + "/" + files[i];
    }
    return files;
}

function panic(msg) {
    sys.log(msg);
    throw msg;
}

/* 0 == draw, 1 == player 1, 2 == player 2. */
function whoWins(str) {
    var strs = str.split('\n');
    var lastLine = strs[strs.length-2];
    if (lastLine === "Player 1 Wins!") {
        return 1;
    } else if (lastLine === "Player 2 Wins!") {
        return 2;
    } else if (lastLine === "Draw!") {
        return 0;
    } else {
        panic("Don't understand input lastLine: '" + lastLine + "'");
    }
}

function compareTwoPlayers(a, b, maps, callback) {
    async.foldl(
            function (acc, map, next) {
                playGame(a, b, map,
                        function(code, out, err) {
                    var winner = whoWins(err);
                    acc[winner] += 1;
                    next(acc);
                });
            }, [0, 0, 0], maps, callback);
}

function key(a, b) {
    return sys.inspect([a,b]);
}

function addGameDB(acc, a, b, result) {
    var aKey = sys.inspect(a);
    var bKey = sys.inspect(b);
    if (acc[aKey] === undefined) {
        acc[aKey] = {};
    }
    acc[aKey][bKey] =  result;
}

function compareAllPlayers(aList, bList, maps, callback) {
    async.innerProductFold(
            function (acc, a, b, next) {
                compareTwoPlayers(a, b, maps,
                        function (result) {
                    addGameDB(acc, a, b, result);
                    next(acc);
                });
            }, {}, aList, bList, callback);
}

function logResult(result) {
    console.log(JSON.stringify(result));
}

// compareAllPlayers(players, players, ["maps/map1.txt"], logResult);
compareAllPlayers(allBots, allBots, readDir("maps"), logResult);

/*
 * compareTwoPlayers(players[0], players[1], readDir("maps"), function (stats) {
 * sys.log("results= " + stats); });
 */
/*
 * playGame(players[0], players[1], "maps/map1.txt", function (code, out, err) {
 * sys.log("code = " + code + " out = " + out + " err = " + err); });
 */
