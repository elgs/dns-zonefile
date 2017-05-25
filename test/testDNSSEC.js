(function () {
    let fs = require('fs');
    let zonefile = require('../lib/zonefile.js');

    console.log('##########', 'Generating forward zone file from JSON', '##########');
    let options = require('./zonefile_forward_unsigned.json');
    let output = zonefile.generate(options);
    console.log(output);
})();
