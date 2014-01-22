(function () {
    var zonefile = require('../lib/zonefile.js');
    var options = require('./zonefile_data.json');
    var output = zonefile.generate(options);
    console.log(output);
})();