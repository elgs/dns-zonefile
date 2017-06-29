(function () {
  'use strict';

  let defaultTemplate = `; Zone: {zone}
  ; Exported  (yyyy-mm-ddThh:mm:ss.sssZ): {datetime}

  {$origin}
  {$ttl}

  ; SOA Record
  {name} {ttl}	IN	SOA	{mname}{rname}(
    {serial} ;serial
    {refresh} ;refresh
    {retry} ;retry
    {expire} ;expire
    {minimum} ;minimum ttl
  )

  ; NS Records
  {ns}

  ; MX Records
  {mx}

  ; A Records
  {a}

  ; AAAA Records
  {aaaa}

  ; CNAME Records
  {cname}

  ; PTR Records
  {ptr}

  ; TXT Records
  {txt}

  ; SRV Records
  {srv}

  ; SPF Records
  {spf}

  ; DS Records
  {ds}
  `;

  let generate = function (options, template) {
    template = template || defaultTemplate;
    template = process$ORIGIN(options['$origin'], template);
    template = process$TTL(options['$ttl'], template);
    template = processSOA(options['soa'], template);
    template = processNS(options['ns'] || [], template);
    template = processA(options['a'] || [], template);
    template = processAAAA(options['aaaa'] || [], template);
    template = processCNAME(options['cname'] || [], template);
    template = processMX(options['mx'] || [], template);
    template = processPTR(options['ptr'] || [], template);
    template = processTXT(options['txt'] || [], template);
    template = processSRV(options['srv'] || [], template);
    template = processSPF(options['spf'] || [], template);
    template = processDS(options['ds'] || [], template);
    template = processValues(options, template);
    return template.replace(/\n{2,}/gim, '\n\n');
  };

  let process$ORIGIN = function (data, template) {
    let ret = '';
    if (typeof data !== 'undefined') {
      ret += '$ORIGIN ' + data;
    }
    return template.replace('{$origin}', ret);
  };

  let process$TTL = function (data, template) {
    let ret = '';
    if (typeof data !== 'undefined') {
      ret += '$TTL ' + data;
    }
    return template.replace('{$ttl}', ret);
  };

  let processSOA = function (data, template) {
    let ret = template;
    data.name = data.name || '@';
    data.ttl = data.ttl || '';
    Object.keys(data).map(key => {
      ret = ret.replace('{' + key + '}', data[key] + '\t');
    });
    return ret;
  };

  let processNS = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tNS\t' + value.host + '\n';
    }
    return template.replace('{ns}', ret);
  };

  let processA = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tA\t' + value.ip + '\n';
    }
    return template.replace('{a}', ret);
  };

  let processAAAA = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tAAAA\t' + value.ip + '\n';
    }
    return template.replace('{aaaa}', ret);
  };

  let processCNAME = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tCNAME\t' + value.alias + '\n';
    }
    return template.replace('{cname}', ret);
  };

  let processMX = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tMX\t' + value.preference + '\t' + value.host + '\n';
    }
    return template.replace('{mx}', ret);
  };

  let processPTR = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tPTR\t' + value.host + '\n';
    }
    return template.replace('{ptr}', ret);
  };

  let processTXT = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tTXT\t' + value.txt + '\n';
    }
    return template.replace('{txt}', ret);
  };

  let processSRV = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tSRV\t' + value.priority + '\t';
      ret += value.weight + '\t';
      ret += value.port + '\t';
      ret += value.target + '\n';
    }
    return template.replace('{srv}', ret);
  };

  let processDS = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tDS\t' + value.keyTag + '\t';
      ret += value.keyAlgorithm + '\t';
      ret += value.hashType + '\t';
      ret += value.hash + '\n';
    }
    return template.replace('{ds}', ret);
  };

  let processSPF = function (data, template) {
    let ret = '';
    for (let value of data) {
      ret += (value.name || '@') + '\t';
      if (value.ttl) ret += value.ttl + '\t';
      ret += 'IN\tSPF\t' + value.data + '\n';
    }
    return template.replace('{spf}', ret);
  };

  let processValues = function (options, template) {
    template = template.replace('{zone}', options['$origin'] || options['soa']['name'] || '');
    template = template.replace('{datetime}', (new Date()).toISOString());
    return template.replace('{time}', Math.round(Date.now() / 1000));
  };

  //////////////////////////////////////////////////////////////////////////////

  let parse = function (text) {
    text = removeComments(text);
    text = flatten(text);
    return parseRRs(text);
  };

  let removeComments = function (text) {
    let re = /\\"|"(?:\\"|[^"])*"|((^|[^\\])(?!;.*key id.*);.*)/g;
    return text.replace(re, function (m, g1) {
      return !g1 ? m : ""; // if g1 is not set/matched, re-insert it, else remove
    });
  };

  let flatten = function (text) {
    let captured = [];
    let re = /\([\s\S]*?\)/gim;
    let matches = text.match(re);
    for (var i = 0; i < matches.length; i++) {
      let code = matches[i].replace(/\n|\r/g, "").replace(/\s{2,}/g,' ').trim().replace(/(\( | \))/g, '');
      text = text.replace(matches[i], code);
    }
    return text;

  };

  let normalizeRR = function (rr, rrType) {
    let hasName = false;
    let hasTtl = false;
    if (rr.match(/^\s+/)) {
      hasName = false;
    } else {
      hasName = true;
    }
    let rrArray = splitArgs(rr, null, true);
    let typeIndex = rrArray.lastIndexOf(rrType);
    if (typeIndex === 0 || rrArray[typeIndex - 1] !== 'IN') {
      rrArray.splice(typeIndex, 0, 'IN');
    }

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

  let parseRRs = function (text) {
    let ret = {};
    let rrs = text.split('\n');
    let origin = '';
    for (let i in rrs) {
      let rr = rrs[i] || '';
      if (!rr.trim()) {
        continue;
      }
      let rrArray = splitArgs(rr, null, true);
      if(rrArray.indexOf('NSEC') >= 0) {
        if(rrArray.indexOf('RRSIG') > rrArray.indexOf('NSEC')) {
          ret.nsec = ret.nsec || [];
          ret.nsec.push(parseNSEC(normalizeRR(rr, 'NSEC')));
        }
      }else if(rrArray.indexOf('NSEC3') >= 0) {
        if(rrArray.indexOf('RRSIG') > rrArray.indexOf('NSEC3')) {
          ret.nsec3 = ret.nsec3 || [];
          ret.nsec3.push(parseNSEC3(normalizeRR(rr, 'NSEC3')));
        }
      } else if (rrArray.indexOf('RRSIG') > 0) {
        if(rrArray.indexOf('NSEC3PARAM') < 0) {
          let index = rrArray.indexOf('RRSIG');
          let rrType = rrArray[index + 1].toLowerCase();
          ret.rrsig = ret.rrsig || [];
          if(rrType === 'soa') {
            origin = ret.soa.name;
          }
          else  {
            origin = ret[rrType][ret[rrType].length - 1].name;
          }
          ret.rrsig.push(parseRRSIG(normalizeRR(rr, 'RRSIG'), origin));
        }
      } else if (rrArray.indexOf('TXT') >= 0) {
        ret.txt = ret.txt || [];
        ret.txt.push(parseTXT(normalizeRR(rr, 'TXT'), ret.txt));
      } else if (rrArray.indexOf('$ORIGIN') === 0) {
        ret.$origin = rrArray[1];
      } else if (rrArray.indexOf('$TTL') === 0) {
        ret.$ttl = rrArray[1];
      } else if (rrArray.indexOf('SOA') >= 0) {
        ret.soa = ret.soa || [];
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
      } else if (rrArray.indexOf('DS') >= 0) {
        ret.ds = ret.ds || [];
        ret.ds.push(parseDS(normalizeRR(rr, 'DS'), ret.ns));
      } else if (rrArray.indexOf('DNSKEY') >= 0) {
        ret.dnskey = ret.dnskey || [];
        ret.dnskey.push(parseDNSKEY(normalizeRR(rr, 'DNSKEY')));
      }
    }
    return ret;
  };

  let parseSOA = function (rrTokens) {
    let soa = {};
    let l = rrTokens.length;
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

  let parseNS = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      host: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseA = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      ip: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseAAAA = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      ip: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseCNAME = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      alias: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseMX = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      preference: parseInt(rrTokens[l - 2], 10),
      host: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseTXT = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let index = rrTokens.indexOf('TXT');

    let l = rrTokens.length;
    console.log(rrTokens);
    console.log(l);
    let result = {
      name: rrTokens[0],
      txt: ''
    };

    for (var i = 1; (i + index) < l; i++) {
      result.txt += rrTokens[index + i];
    }

    result.txt = result.txt.split('"').join('');

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parsePTR = function (rrData, recordsSoFar, currentOrigin) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName && recordsSoFar[recordsSoFar.length - 1]) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      fullname: rrTokens[0] + '.' + currentOrigin,
      host: rrTokens[l - 1]
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseSRV = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      target: rrTokens[l - 1],
      priority: parseInt(rrTokens[l - 4], 10),
      weight: parseInt(rrTokens[l - 3], 10),
      port: parseInt(rrTokens[l - 2], 10)
    };

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseSPF = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let result = {
      name: rrTokens[0],
      data: ''
    };

    let l = rrTokens.length;
    while (l-- > (rrData.hasTtl ? 4 : 3)) {
      result.data = rrTokens[l] + ' ' + result.data.trim();
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseDS = function (rrData, recordsSoFar) {
    let rrTokens = rrData.tokens;
    if (!rrData.hasName) {
      if (recordsSoFar.length) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
      } else {
        rrTokens.unshift('@');
      }
    }

    let index = rrTokens.indexOf('DS');

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      hash: '',
      keyTag: parseInt(rrTokens[index + 1], 10),
      keyAlgorithm: parseInt(rrTokens[index + 2], 10),
      hashType: parseInt(rrTokens[index + 3], 10)
    };

    for (var i = 4; (i + index) < l; i++) {
      result.hash += rrTokens[index + i];
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
    return result;
  };

  let parseDNSKEY = function (rrData) {
    let rrTokens = rrData.tokens;

    let index = rrTokens.indexOf('DNSKEY');

    let l = rrTokens.length;
    let result = {
      name: '@',
      algorithm: parseInt(rrTokens[index + 3], 10),
      keyType: parseInt(rrTokens[index + 1], 10),
      keyId: rrTokens[l - 1],
      key: ''
    };

    for (var i = 4; i < (l - 11); i++) {
      result.key += rrTokens[index + i];
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[0], 10);
    return result;
  };

  let parseNSEC = function (rrData) {
    let rrTokens = rrData.tokens;

    let index = rrTokens.indexOf('NSEC');

    let l = rrTokens.length;
    let result = {
      name: rrTokens[0],
      nextName: rrTokens[index + 1],
      ownerRR: []
    };

    for (var i = 2; i < (l - 3); i++) {
      result.ownerRR.push(rrTokens[index + i]);
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);

    return result;
  };

  let parseNSEC3 = function (rrData) {
    let rrTokens = rrData.tokens;

    let index = rrTokens.indexOf('NSEC3');

    let l = rrTokens.length;
    let result = {
      hash: rrTokens[0],
      algorithm: rrTokens[index + 1],
      flag: rrTokens[index + 2],
      iterations: rrTokens[index + 3],
      salt: rrTokens[index + 4],
      nextHash: rrTokens[index + 5],
      ownerRR: []
    };

    for (var i = 6; i < (l - 3); i++) {
      result.ownerRR.push(rrTokens[index + i]);
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);

    return result;
  };

  let parseRRSIG = function (rrData, origin) {
    let rrTokens = rrData.tokens;

    let index = rrTokens.indexOf('RRSIG');

    let result = {
      name: origin,
      rr: rrTokens[index + 1],
      algorithm: rrTokens[index + 2],
      label: parseInt(rrTokens[index + 3], 10),
      origTTL: parseInt(rrTokens[index + 4], 10),
      startDate: rrTokens[index + 6],
      endDate: rrTokens[index + 5],
      keyTag: parseInt(rrTokens[index + 7], 10),
      origin:  rrTokens[index + 8],
      signature: ''
    };

    let l = rrTokens.length;

    for (var i = 9; i < (l - 3); i++) {
      result.signature += rrTokens[index + i];
    }

    if (rrData.hasTtl) result.ttl = parseInt(rrTokens[0], 10);

    return result;
  };

  let splitArgs = function (input, sep, keepQuotes) {
    let separator = sep || /\s/g;
    let singleQuoteOpen = false;
    let doubleQuoteOpen = false;
    let tokenBuffer = [];
    let ret = [];

    let arr = input.split('');
    for (let i = 0; i < arr.length; ++i) {
      let element = arr[i];
      let matches = element.match(separator);
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
