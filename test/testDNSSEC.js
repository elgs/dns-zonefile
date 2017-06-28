(function () {
    let fs = require('fs');
    let zonefile = require('../lib/zonefile.js');

    console.log('##########', 'Parsing forward signed zone file to JSON', '##########');
    let text = fs.readFileSync('./zonefile_forward_unsigned.txt', 'utf8');
    output = zonefile.parse(text);
    console.log(output);
})();
