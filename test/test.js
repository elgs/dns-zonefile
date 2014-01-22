(function () {
    var fs = require('fs');
    var zonefile = require('../lib/zonefile.js');

    var template = fs.readFileSync('../lib/zonefile_template', 'utf8');
    var options = require('./zonefile_data.json');
    zonefile.generate(template, options);
})();