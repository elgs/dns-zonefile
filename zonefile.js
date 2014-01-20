(function () {
    var fs = require('fs');

    var generate = function (template, options) {
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
            ret += 'IN\t\tNS\t\t' + data[i] + '\n';
        }
        return template.replace('{ns}', ret);
    };

    var processA = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\t\tIN\t\tA\t\t' + value + '\n';
        }
        return template.replace('{a}', ret);
    };

    var processCNAME = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\t\tIN\t\tCNAME\t\t' + value + '\n';
        }
        return template.replace('{cname}', ret);
    };

    var processMX = function (template, data) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += 'IN\t\tMX\t\t' + key + '\t\t' + value + '\n';
        }
        return template.replace('{mx}', ret);
    };

    var template = fs.readFileSync('./zonefile_template', 'utf8');
    var options = require('./zonefile_data.json');
    generate(template, options);
})();