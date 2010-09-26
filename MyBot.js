/*
// The DoTurn function is where your code goes. The PlanetWars object contains
// the state of the game, including information about all planets and fleets
// that currently exist. Inside this function, you issue orders using the
// pw.IssueOrder() function. For example, to send 10 ships from planet 3 to
// planet 8, you would say pw.IssueOrder(3, 8, 10).
//
// There is already a basic strategy in place here. You can use it as a
// starting point, or you can throw it out entirely and replace it with your
// own. Check out the tutorials and articles on the contest website at
// http://www.ai-contest.com/resources.
*/

var planetWars = require('./PlanetWars');

function doTurn(pw) {
    // (1) If we currently have a fleet in flight, just do nothing.
    if ( pw.myFleets.length >= 1 ) {
        return;
    }

    // (2) Find my strongest planet.
    var source = -1;
    var score;
    var sourceScore = -999999.0;
    var sourceShips = 0;
    var myPlanets = pw.myPlanets;
    var p, pi, plen;
    var dest, destScore, notMyPlanets;
    var numShips;
    plen = myPlanets.length;
    for (pi = 0; pi < plen; pi++) {
        p = myPlanets[pi];
        score = p.ships;
        if (score > sourceScore ) {
            sourceScore = score;
            source = p.id;
            sourceShips = p.ships;
        }
    }

    // (3) Find the weakest enemy or neutral planet.
    dest = -1;
    destScore = -999999.0;
    notMyPlanets = pw.notMyPlanets;
    plen = notMyPlanets.length;
    for (pi = 0; pi < plen; pi++) {
        p = notMyPlanets[pi];
        score = 1.0 / (1 + p.ships);
        if (score > destScore) {
            destScore = score;
            dest = p.id;
        }
    }

    // (4) Send half the ships from my strongest planet to the weakest
    // planet that I do not own.
    if ( source >= 0 && dest >= 0 ) {
        numShips = Math.floor(sourceShips / 2);
        pw.issueOrder(source, dest, numShips);
    }
}

// Play the game with my bot
planetWars.play(doTurn);
