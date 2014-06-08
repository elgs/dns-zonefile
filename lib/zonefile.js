(function () {
    var fs = require('fs');
    var generate = function (options, template) {
        template = template || fs.readFileSync(__dirname + '/zonefile_template', 'utf8');
        template = process$ORIGIN(options['$origin'], template);
        template = process$TTL(options['$ttl'], template);
        template = processSOA(options['soa'], template);
        template = processNS(options['ns'], template);
        template = processA(options['a'], template);
        template = processCNAME(options['cname'], template);
        template = processMX(options['mx'], template);
        template = processPTR(options['ptr'], template);
        template = processValues(template);
        return template.replace(/\n{2,}/gim, '\n\n');
    };

    var process$ORIGIN = function (data, template) {
        var ret = '';
        if (typeof data !== "undefined") {
            ret += '$ORIGIN ' + data;
        }
        return template.replace('{$origin}', ret);
    };

    var process$TTL = function (data, template) {
        var ret = '$TTL ' + data;
        return template.replace('{$ttl}', ret);
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
            ret += '@\tNS\t' + data[i] + '\n';
        }
        return template.replace('{ns}', ret);
    };

    var processA = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\tA\t' + value + '\n';
        }
        return template.replace('{a}', ret);
    };

    var processCNAME = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\tCNAME\t' + value + '\n';
        }
        return template.replace('{cname}', ret);
    };

    var processMX = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += '@\tMX\t' + key + '\t' + value + '\n';
        }
        return template.replace('{mx}', ret);
    };

    var processPTR = function (data, template) {
        var ret = '';
        for (var key in data) {
            var value = data[key];
            ret += key + '\tPTR\t' + value + '\n';
        }
        return template.replace('{ptr}', ret);
    };

    var processValues = function (template) {
        return template.replace('{time}', Math.round(Date.now() / 1000));
    };

    //////////////////////////////////////////////////////////////////////////////

    var parse = function (text) {
        text = removeComments(text);
        text = flatten(text);
        return parseRRs(text);
    };

    var removeComments = function (text) {
        return text.replace(/;[\s\S]*?$/gm, '');
    };

    var flatten = function (text) {
        var captured = [];
        var re = /\([\s\S]*?\)/gim;
        var match = re.exec(text);
        while (match != null) {
            match.replacement = match[0].replace(/\s+/gm, ' ');
            captured.push(match);
            // captured Text, index, input
            match = re.exec(text);
        }
        var arrText = text.split('');
        for (var i in captured) {
            match = captured[i];
            arrText.splice(match.index, match[0].length, match.replacement);
        }
        return arrText.join('').replace(/\(|\)/gim, ' ');
    };

    var parseRRs = function (text) {
        var ret = {};
        var rrs = text.split('\n');
        for (var i in rrs) {
            var rr = rrs[i];
            if (!rr || !rr.trim()) {
                continue;
            }
            var uRR = rr.toUpperCase();
            if (uRR.indexOf('$ORIGIN') === 0) {
                ret.$origin = rr.split(/\s+/g)[1];
            } else if (uRR.indexOf('$TTL') === 0) {
                ret.$ttl = rr.split(/\s+/g)[1];
            } else if (/\s+SOA\s+/.test(uRR)) {
                ret.soa = parseSOA(rr);
            } else if (/\s+NS\s+/.test(uRR)) {
                ret.ns = ret.ns || [];
                ret.ns.push(parseNS(rr));
            } else if (/\s+A\s+/.test(uRR)) {
                ret.a = ret.a || {};
                var a = parseA(rr);
                ret.a[a[0]] = a[1];
            } else if (/\s+CNAME\s+/.test(uRR)) {
                ret.cname = ret.cname || {};
                var cname = parseCNAME(rr);
                ret.cname[cname[0]] = cname[1];
            } else if (/\s+MX\s+/.test(uRR)) {
                ret.mx = ret.mx || {};
                var mx = parseMX(rr);
                ret.mx[mx[0]] = mx[1];
            } else if (/\s+PTR\s+/.test(uRR)) {
                ret.ptr = ret.ptr || {};
                var ptr = parsePTR(rr);
                ret.ptr[ptr[0]] = ptr[1];
            }
        }
        return ret;
    };

    var parseSOA = function (rr) {
        var soa = {};
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        soa.minimum = parseInt(rrTokens[l - 1]);
        soa.expire = parseInt(rrTokens[l - 2]);
        soa.retry = parseInt(rrTokens[l - 3]);
        soa.refresh = parseInt(rrTokens[l - 4]);
        soa.serial = parseInt(rrTokens[l - 5]);
        soa.rname = rrTokens[l - 6];
        soa.mname = rrTokens[l - 7];
        return soa;
    };

    var parseNS = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        return rrTokens[l - 1];
    };

    var parseA = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        return [rrTokens[0], rrTokens[l - 1]];
    };

    var parseCNAME = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        return [rrTokens[0], rrTokens[l - 1]];
    };

    var parseMX = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        return [rrTokens[l - 2], rrTokens[l - 1]];
    };

    var parsePTR = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        return [rrTokens[0], rrTokens[l - 1]];
    };

    exports.generate = generate;
    exports.parse = parse;
})();
