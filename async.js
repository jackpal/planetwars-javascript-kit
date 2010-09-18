
// Asynchronous fold left
// step is a function of type (a, b, next) -> result, where a and b are the operends,
//   and next is a callback function of type (result) -> empty that you call with the
//   result.
// zero is the default value of the operation on an empty array.
// arr is the array of elements
// callback is a function of type (result) -> empty that is called with the
// ultimate result.

exports.foldl = function foldl(step, zero, arr, callback) {
    var length = arr.length,
        next = function (i, acc) {
        if (i >= length) {
            callback(acc);
        } else {
            step(acc, arr[i], function(result) { next(i+1, result); });
        }
    };
    next(0, zero);
};

exports.map = function map(f, arr, callback) {
    foldl(function (a, b, next) { 
        f(b, function (result) { next(a.push(result)); });
    }, [], arr, callback);
};

exports.each = function each(f, arr, callback) {
  foldl(function(a, b, next) { f(b, next); }, null, arr, callback);
};

function innerProduct(a, b) {
    var i, j, ai, alen = a.length, blen = b.length, accum = [];
    for (i = 0; i < alen; i++) {
        ai = a[i];
        for (j = 0; j < blen; j++) {
            accum.push([ai, b[i]]);
        }
    }
    return accum;
}

exports.innerProductFold = function innerProductFold(
    step, zero, a, b, callback) {
    var aLen = a.length,
        bLen = b.length,
        next = function(i, j, acc) {
            if (i >= aLen) {
                i = 0;
                j++;
            }
            if (j >= bLen) {
                callback(acc);
            } else {
                step(acc, a[i], b[j], function(result) { next(i+1, j, result); });
            }
        };
    next(0, 0, zero);
}
