(function () {
    var fs = require('fs');
    var generate = function (options, template) {
        template = template || fs.readFileSync(__dirname + '/zonefile_template', 'utf8');
        template = processSOA(options['soa'], template);
        template = processNS(options['ns'], template);
        template = processA(options['a'], template);
        template = processCNAME(options['cname'], template);
        template = processMX(options['mx'], template);
        return template;
    };

    var processSOA = function (data, template) {
        var ret = template;
        for (var key in data) {
            var value = data[key];
            ret = ret.replace('{' + key + '}', value + '\t');
        }
        return ret;
    };

    var processNS = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += '@\tIN\tNS\t' + data[i] + '\n';
        }
        return template.replace('{ns}', ret);
    };

    var processA = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\tIN\tA\t' + value + '\n';
        }
        return template.replace('{a}', ret);
    };

    var processCNAME = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\tIN\tCNAME\t' + value + '\n';
        }
        return template.replace('{cname}', ret);
    };

    var processMX = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += 'IN\tMX\t' + key + '\t' + value + '\n';
        }
        return template.replace('{mx}', ret);
    };

    exports.generate = generate;
})();