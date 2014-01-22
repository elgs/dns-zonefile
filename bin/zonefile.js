#!/usr/bin/env node

(function () {
    var fs = require('fs');
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
    console.log(input[0]);
    var template = fs.readFileSync('../lib/zonefile_template', 'utf8');
    var options = require(input[0]);
    zonefile.generate(template, options);
})();