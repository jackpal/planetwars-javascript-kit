// Compare two game visualation files
// TODO: sort fleets to avoid false differences.
var fs = require('fs');
var argv = process.argv.slice(2);

function readFile(path) {
    var txt = fs.readFileSync(path,'utf8');
    var parts = txt.split('|');
    var start = parts[0];
    var turns = parts[1];
    return start.split(':').concat(turns.split(':'));
}

var a = readFile(argv[0]);
var b = readFile(argv[1]);

console.log("length: " + a.length + ":" + b.length);

a.forEach(function(v,i,a) {
	var la = v;
	var lb = b[i];
	if (la != lb) {
	    console.log(i + ":");
	    console.log(la);
	    console.log(lb);
	    var n = la.length;
	    var j;
	    for (j = 0; j < n; j++) {
		if(la[j] != lb[j]) {
		    console.log(j + '!' + la[j] + '!=' + lb[j]);
		}
	    }
	}
    });