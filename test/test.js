(function () {
    var zonefile = require('../lib/zonefile.js');
    var options = require('./zonefile_data_forward.json');
    var output = zonefile.generate(options);
    console.log(output);

    options = require('./zonefile_data_reverse.json');
    output = zonefile.generate(options);
    console.log(output);
})();