(function () {
    var fs = require('fs');
    var zonefile = require('../lib/zonefile.js');
    console.log('##########', 'Generating forward zone file from JSON', '##########');
    var options = require('./zonefile_forward.json');
    var output = zonefile.generate(options);
    console.log(output);

    console.log('##########', 'Generating reverse zone file from JSON', '##########');
    options = require('./zonefile_reverse.json');
    output = zonefile.generate(options);
    console.log(output);

    console.log('##########', 'Generating reverse zone file (IPv6) from JSON', '##########');
    options = require('./zonefile_reverse_ipv6.json');
    output = zonefile.generate(options);
    console.log(output);

    console.log('##########', 'Parsing forward zone file to JSON', '##########');
    var text = fs.readFileSync('./zonefile_forward.txt', 'utf8');
    output = zonefile.parse(text);
    console.log(output);

    console.log('\n');
    console.log('##########', 'Parsing reverse zone file to JSON', '##########');
    text = fs.readFileSync('./zonefile_reverse.txt', 'utf8');
    output = zonefile.parse(text);
    console.log(output);

    console.log('\n');
    console.log('##########', 'Parsing reverse zone file (IPv6) to JSON', '##########');
    text = fs.readFileSync('./zonefile_reverse_ipv6.txt', 'utf8');
    output = zonefile.parse(text);
    console.log(output);
})();
