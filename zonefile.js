(function () {
    var fs = require('fs');

    var defaultOptions = {
        soa: {
            ttl: 1800,
            origin: 'NS1.NAMESERVER.NET.',
            person: 'HOSTMASTER.MYDOMAIN.COM.',
            serial: 45,
            refresh: 3600,
            retry: 600,
            expire: 3600000,
            minimum: 86400
        },
        ns: [
            'NS1.NAMESERVER.NET',
            'NS2.NAMESERVER.NET'
        ],
        a: {
            '@': '127.0.0.1',
            'www': '127.0.0.1',
            'mail': '127.0.0.1'
        },
        cname: {
            'mail1': 'mail',
            'mail2': 'mail'
        },
        mx: {
            '0': 'mail1',
            '10': 'mail2'
        }
    };

    var generate = function (options) {
        var template = fs.readFileSync('./zonefile_template', 'utf8');
        template = processSOA(template, options['soa']);
        template = processNS(template, options['ns']);
        template = processA(template, options['a']);
        template = processCNAME(template, options['cname']);
        template = processMX(template, options['mx']);
        console.log(template);
    };

    var processSOA = function (template, data) {
        var ret = template;
        for (var key in data) {
            var value = data[key];
            ret = ret.replace('{' + key + '}', value + '\t');
        }
        return ret;
    };

    var processNS = function (template, data) {
        var ret = '';
        for (var i in data) {
            ret += '\t\tNS\t\t' + data[i] + '\n';
        }
        return template.replace('{ns}', ret);
    };

    var processA = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\t\tA\t\t' + value + '\n';
        }
        return template.replace('{a}', ret);
    };

    var processCNAME = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\t\tCNAME\t\t' + value + '\n';
        }
        return template.replace('{cname}', ret);
    };

    var processMX = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += 'MX\t\t' + key + '\t\t' + value + '\n';
        }
        return template.replace('{mx}', ret);
    };

    generate(defaultOptions);
})();