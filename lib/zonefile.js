(function () {
    'use strict';

    var defaultTemplate = '; Zone: {zone}\n\
; Exported  (yyyy-mm-ddThh:mm:ss.sssZ): {datetime}\n\
\n\
{$origin}\n\
{$ttl}\n\
\n\
; SOA Record\n\
{name} {ttl}	IN	SOA	{mname}{rname}(\n\
{serial} ;serial\n\
{refresh} ;refresh\n\
{retry} ;retry\n\
{expire} ;expire\n\
{minimum} ;minimum ttl\n\
)\n\
\n\
; NS Records\n\
{ns}\n\
\n\
; MX Records\n\
{mx}\n\
\n\
; A Records\n\
{a}\n\
\n\
; AAAA Records\n\
{aaaa}\n\
\n\
; CNAME Records\n\
{cname}\n\
\n\
; PTR Records\n\
{ptr}\n\
\n\
; TXT Records\n\
{txt}\n\
\n\
; SRV Records\n\
{srv}\n\
\n\
; SPF Records\n\
{spf}\n\
';

    var generate = function (options, template) {
        template = template || defaultTemplate;
        template = process$ORIGIN(options['$origin'], template);
        template = process$TTL(options['$ttl'], template);
        template = processSOA(options['soa'], template);
        template = processNS(options['ns'], template);
        template = processA(options['a'], template);
        template = processAAAA(options['aaaa'], template);
        template = processCNAME(options['cname'], template);
        template = processMX(options['mx'], template);
        template = processPTR(options['ptr'], template);
        template = processTXT(options['txt'], template);
        template = processSRV(options['srv'], template);
        template = processSPF(options['spf'], template);
        template = processValues(options, template);
        return template.replace(/\n{2,}/gim, '\n\n');
    };

    var process$ORIGIN = function (data, template) {
        var ret = '';
        if (typeof data !== 'undefined') {
            ret += '$ORIGIN ' + data;
        }
        return template.replace('{$origin}', ret);
    };

    var process$TTL = function (data, template) {
        var ret = '';
        if (typeof data !== 'undefined') {
            ret += '$TTL ' + data;
        }
        return template.replace('{$ttl}', ret);
    };

    var processSOA = function (data, template) {
        var ret = template;
        data.name = data.name || '@';
        data.ttl = data.ttl || '';
        for (var key in data) {
            var value = data[key];
            ret = ret.replace('{' + key + '}', value + '\t');
        }
        return ret;
    };

    var processNS = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tNS\t' + data[i].host + '\n';
        }
        return template.replace('{ns}', ret);
    };

    var processA = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tA\t' + data[i].ip + '\n';
        }
        return template.replace('{a}', ret);
    };

    var processAAAA = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tAAAA\t' + data[i].ip + '\n';
        }
        return template.replace('{aaaa}', ret);
    };

    var processCNAME = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tCNAME\t' + data[i].alias + '\n';
        }
        return template.replace('{cname}', ret);
    };

    var processMX = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tMX\t' + data[i].preference + '\t' + data[i].host + '\n';
        }
        return template.replace('{mx}', ret);
    };

    var processPTR = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tPTR\t' + data[i].host + '\n';
        }
        return template.replace('{ptr}', ret);
    };

    var processTXT = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tTXT\t"' + data[i].txt + '"\n';
        }
        return template.replace('{txt}', ret);
    };

    var processSRV = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tSRV\t' + data[i].priority + '\t';
            ret += data[i].weight + '\t';
            ret += data[i].port + '\t';
            ret += data[i].target + '\n';
        }
        return template.replace('{srv}', ret);
    };

    var processSPF = function (data, template) {
        var ret = '';
        for (var i in data) {
            ret += (data[i].name || '@') + '\t';
            if (data[i].ttl) ret += data[i].ttl + '\t';
            ret += 'IN\tSPF\t' + data[i].data + '\n';
        }
        return template.replace('{spf}', ret);
    };

    var processValues = function (options, template) {
        template = template.replace('{zone}', options['$origin'] || options['soa']['name'] || '');
        template = template.replace('{datetime}', (new Date()).toISOString());
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
        while (match !== null) {
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
            if (/\s+TXT\s+/.test(uRR)) {
                ret.txt = ret.txt || [];
                ret.txt.push(parseTXT(rr));
            } else if (uRR.indexOf('$ORIGIN') === 0) {
                ret.$origin = rr.split(/\s+/g)[1];
            } else if (uRR.indexOf('$TTL') === 0) {
                ret.$ttl = rr.split(/\s+/g)[1];
            } else if (/\s+SOA\s+/.test(uRR)) {
                ret.soa = parseSOA(rr);
            } else if (/\s+NS\s+/.test(uRR)) {
                ret.ns = ret.ns || [];
                ret.ns.push(parseNS(rr));
            } else if (/\s+A\s+/.test(uRR)) {
                ret.a = ret.a || [];
                ret.a.push(parseA(rr, ret.a));
            } else if (/\s+AAAA\s+/.test(uRR)) {
                ret.aaaa = ret.aaaa || [];
                ret.aaaa.push(parseAAAA(rr));
            } else if (/\s+CNAME\s+/.test(uRR)) {
                ret.cname = ret.cname || [];
                ret.cname.push(parseCNAME(rr));
            } else if (/\s+MX\s+/.test(uRR)) {
                ret.mx = ret.mx || [];
                ret.mx.push(parseMX(rr));
            } else if (/\s+PTR\s+/.test(uRR)) {
                ret.ptr = ret.ptr || [];
                ret.ptr.push(parsePTR(rr, ret.ptr, ret.$origin));
            } else if (/\s+SRV\s+/.test(uRR)) {
                ret.srv = ret.srv || [];
                ret.srv.push(parseSRV(rr));
            } else if (/\s+SPF\s+/.test(uRR)) {
                ret.spf = ret.spf || [];
                ret.spf.push(parseSPF(rr));
            }
        }
        return ret;
    };

    var parseSOA = function (rr) {
        var soa = {};
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        soa.name = rrTokens[0];
        soa.minimum = parseInt(rrTokens[l - 1], 10);
        soa.expire = parseInt(rrTokens[l - 2], 10);
        soa.retry = parseInt(rrTokens[l - 3], 10);
        soa.refresh = parseInt(rrTokens[l - 4], 10);
        soa.serial = parseInt(rrTokens[l - 5], 10);
        soa.rname = rrTokens[l - 6];
        soa.mname = rrTokens[l - 7];
        if (!isNaN(rrTokens[1])) soa.ttl = parseInt(rrTokens[1], 10);
        return soa;
    };

    var parseNS = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            host: rrTokens[l - 1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseA = function (rr, recordsSoFar) {
        var rrTokens = rr.trim().split(/\s+/g);
        var urrTokens = rr.trim().toUpperCase().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            ip: rrTokens[l - 1]
        };

        if (urrTokens.lastIndexOf('A') === 0) {
            if (recordsSoFar.length) {
                result.name = recordsSoFar[recordsSoFar.length - 1].name;
            }
            else {
                result.name = '@';
            }
        }

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseAAAA = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            ip: rrTokens[l - 1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseCNAME = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            alias: rrTokens[l - 1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseMX = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            preference: parseInt(rrTokens[l - 2], 10),
            host: rrTokens[l - 1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseTXT = function (rr) {
        var rrTokens = rr.trim().match(/[^\s\"']+|\"[^\"]*\"|'[^']*'/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            txt: rrTokens[l - 1].split('\"')[1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parsePTR = function (rr, recordsSoFar, currentOrigin) {
        var rrTokens = rr.trim().split(/\s+/g);
        var urrTokens = rr.trim().toUpperCase().split(/\s+/g);

        if (urrTokens.lastIndexOf('PTR') === 0 && recordsSoFar[recordsSoFar.length - 1]) {
            rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            fullname: rrTokens[0] + '.' + currentOrigin,
            host: rrTokens[l - 1]
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseSRV = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            target: rrTokens[l - 1],
            priority: parseInt(rrTokens[l - 4], 10),
            weight: parseInt(rrTokens[l - 3], 10),
            port: parseInt(rrTokens[l - 2], 10)
        };

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseSPF = function (rr) {
        var rrTokens = rr.trim().split(/\s+/g);
        var result = {
            name: rrTokens[0],
            data: ''
        };

        var l = rrTokens.length;
        while (l-- > 4) {
            result.data = rrTokens[l] + ' ' + result.data.trim();
        }

        if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        exports.generate = generate;
        exports.parse = parse;
    } else {
        window.zonefile_generate = generate;
        window.zonefile_parse = parse;
    }

})();
