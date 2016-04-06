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
        var re = /(^|[^\\])\;(?=([^"]*"[^"]*")*[^"]*$).*/g;
        return text.replace(re, function (m, g1) {
            return g1 ? g1 : ""; // if g1 is set/matched, re-insert it, else remove
        });
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

    var normalizeRR = function (rr, rrType) {
        var hasName = false;
        var hasTtl = false;
        if (rr.match(/^\s+/)) {
            hasName = false;
        } else {
            hasName = true;
        }
        var rrArray = splitArgs(rr, null, true);
        var typeIndex = rrArray.lastIndexOf(rrType);
        if (typeIndex === 0 || rrArray[typeIndex - 1] !== 'IN') {
            rrArray.splice(typeIndex, 0, 'IN');
        }

        // According to RFC 1035:
        // <rr> contents take one of the following forms:
        // [<TTL>] [<class>] <type> <RDATA> -- We assume this one
        // [<class>] [<TTL>] <type> <RDATA>
        if (hasName) {
            if (!isNaN(rrArray[1])) {
                hasTtl = true;
            }
        } else {
            if (!isNaN(rrArray[0])) {
                hasTtl = true;
            }
        }
        return {
            tokens: rrArray,
            hasName: hasName,
            hasTtl: hasTtl,
            typeIndex: typeIndex
        };
    };

    var parseRRs = function (text) {
        var ret = {};
        var rrs = text.split('\n');
        for (var i in rrs) {
            var rr = rrs[i] || '';
            if (!rr.trim()) {
                continue;
            }
            var rrArray = splitArgs(rr, null, true);
            if (rrArray.indexOf('TXT') >= 0) {
                ret.txt = ret.txt || [];
                ret.txt.push(parseTXT(normalizeRR(rr, 'TXT'), ret.txt));
            } else if (rrArray.indexOf('$ORIGIN') === 0) {
                ret.$origin = rrArray[1];
            } else if (rrArray.indexOf('$TTL') === 0) {
                ret.$ttl = rrArray[1];
            } else if (rrArray.indexOf('SOA') >= 0) {
                ret.soa = parseSOA(rrArray);
            } else if (rrArray.indexOf('NS') >= 0) {
                ret.ns = ret.ns || [];
                ret.ns.push(parseNS(normalizeRR(rr, 'NS'), ret.ns));
            } else if (rrArray.indexOf('A') >= 0) {
                ret.a = ret.a || [];
                ret.a.push(parseA(normalizeRR(rr, 'A'), ret.a));
            } else if (rrArray.indexOf('AAAA') >= 0) {
                ret.aaaa = ret.aaaa || [];
                ret.aaaa.push(parseAAAA(normalizeRR(rr, 'AAAA'), ret.aaaa));
            } else if (rrArray.indexOf('CNAME') >= 0) {
                ret.cname = ret.cname || [];
                ret.cname.push(parseCNAME(normalizeRR(rr, 'CNAME'), ret.cname));
            } else if (rrArray.indexOf('MX') >= 0) {
                ret.mx = ret.mx || [];
                ret.mx.push(parseMX(normalizeRR(rr, 'MX'), ret.mx));
            } else if (rrArray.indexOf('PTR') >= 0) {
                ret.ptr = ret.ptr || [];
                ret.ptr.push(parsePTR(normalizeRR(rr, 'PTR'), ret.ptr, ret.$origin));
            } else if (rrArray.indexOf('SRV') >= 0) {
                ret.srv = ret.srv || [];
                ret.srv.push(parseSRV(normalizeRR(rr, 'SRV'), ret.srv));
            } else if (rrArray.indexOf('SPF') >= 0) {
                ret.spf = ret.spf || [];
                ret.spf.push(parseSPF(normalizeRR(rr, 'SPF'), ret.spf));
            }
        }
        return ret;
    };

    var parseSOA = function (rrTokens) {
        var soa = {};
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

    var parseNS = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            host: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseA = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            ip: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseAAAA = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            ip: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseCNAME = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            alias: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseMX = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            preference: parseInt(rrTokens[l - 2], 10),
            host: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseTXT = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            txt: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parsePTR = function (rrData, recordsSoFar, currentOrigin) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName && recordsSoFar[recordsSoFar.length - 1]) {
            rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            fullname: rrTokens[0] + '.' + currentOrigin,
            host: rrTokens[l - 1]
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseSRV = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var l = rrTokens.length;
        var result = {
            name: rrTokens[0],
            target: rrTokens[l - 1],
            priority: parseInt(rrTokens[l - 4], 10),
            weight: parseInt(rrTokens[l - 3], 10),
            port: parseInt(rrTokens[l - 2], 10)
        };

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var parseSPF = function (rrData, recordsSoFar) {
        var rrTokens = rrData.tokens;
        if (!rrData.hasName) {
            if (recordsSoFar.length) {
                rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
            } else {
                rrTokens.unshift('@');
            }
        }

        var result = {
            name: rrTokens[0],
            data: ''
        };

        var l = rrTokens.length;
        while (l-- > (rrData.hasTtl ? 4 : 3)) {
            result.data = rrTokens[l] + ' ' + result.data.trim();
        }

        if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
        return result;
    };

    var splitArgs = function (input, sep, keepQuotes) {
        var separator = sep || /\s/g;
        var singleQuoteOpen = false;
        var doubleQuoteOpen = false;
        var tokenBuffer = [];
        var ret = [];

        var arr = input.split('');
        for (var i = 0; i < arr.length; ++i) {
            var element = arr[i];
            var matches = element.match(separator);
            if (element === "'" && !doubleQuoteOpen) {
                if (keepQuotes === true) {
                    tokenBuffer.push(element);
                }
                singleQuoteOpen = !singleQuoteOpen;
                continue;
            } else if (element === '"' && !singleQuoteOpen) {
                if (keepQuotes === true) {
                    tokenBuffer.push(element);
                }
                doubleQuoteOpen = !doubleQuoteOpen;
                continue;
            }

            if (!singleQuoteOpen && !doubleQuoteOpen && matches) {
                if (tokenBuffer.length > 0) {
                    ret.push(tokenBuffer.join(''));
                    tokenBuffer = [];
                } else if (!!sep) {
                    ret.push(element);
                }
            } else {
                tokenBuffer.push(element);
            }
        }
        if (tokenBuffer.length > 0) {
            ret.push(tokenBuffer.join(''));
        } else if (!!sep) {
            ret.push('');
        }
        return ret;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        exports.generate = generate;
        exports.parse = parse;
    } else {
        window.zonefile_generate = generate;
        window.zonefile_parse = parse;
    }

})();
