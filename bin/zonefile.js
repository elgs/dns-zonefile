#!/usr/bin/env node

(function () {

    var zonefile = require('../lib/zonefile.js');

    var args = function () {
        var ret = [];
        process.argv.forEach(function (val, index, array) {
            if (index >= 2) {
                ret.push(val);
            }
        });
        if (ret.length === 0) {
            ret.push('../test/zonefile_data.json');
        }
        return ret;
    };

    var input = args();

    var options = require(input[0]);
    var output = zonefile.generate(options);
    console.log(output);
})();