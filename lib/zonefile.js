const defaultTemplate = `; Zone: {zone}
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

; CAA Records
{caa}


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
  template = processCAA(options['caa'] || [], template);
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

let processSPF = function (data, template) {
  let ret = '';
  for (let value of data) {
    ret += (value.name || '@') + '\t';
    if (value.ttl) ret += value.ttl + '\t';
    ret += 'IN\tSPF\t' + value.data + '\n';
  }
  return template.replace('{spf}', ret);
};

let processCAA = function (data, template) {
  let ret = '';
  for (let value of data) {
    ret += (value.name || '@') + '\t';
    if (value.ttl) ret += value.ttl + '\t';
    ret += `CAA ${value.flags} ${value.tag} "${value.value}"\n`
  }
  return template.replace('{caa}', ret);
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
  // let re = /(^|[^\\])\;(?=([^"\\]*(\\.|"([^"\\]*\\.)*[^"\\]*"))*[^"]*$).*/g;
  // return text.replace(re, function (m, g1) {
  //     return g1 ? g1 : ""; // if g1 is set/matched, re-insert it, else remove
  // });

  let re = /\\"|"(?:\\"|[^"])*"|((^|[^\\])\;.*)/g;
  return text.replace(re, function (m, g1) {
    return !g1 ? m : ""; // if g1 is not set/matched, re-insert it, else remove
  });
};

let flatten = function (text) {
  let captured = [];
  let re = /\([\s\S]*?\)/gim;
  let match = re.exec(text);
  while (match !== null) {
    match.replacement = match[0].replace(/\s+/gm, ' ');
    captured.push(match);
    // captured Text, index, input
    match = re.exec(text);
  }
  let arrText = text.split('');
  for (match of captured) {
    arrText.splice(match.index, match[0].length, match.replacement);
  }
  return arrText.join('').replace(/\(|\)/gim, ' ');
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

let parseRRs = function (text) {
  let ret = {};
  let rrs = text.split('\n');
  for (let rr of rrs) {
    if (!rr.trim()) {
      continue;
    }
    let rrArray = splitArgs(rr, null, true);
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
    } else if (rrArray.indexOf('CAA') >= 0) {
      ret.caa = ret.caa || [];
      ret.caa.push(parseCAA(normalizeRR(rr, 'CAA'), ret.caa));
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
  const txtArray = rrTokens.slice(rrData.typeIndex + 1);
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift('@');
    }
  }

//   const splitTxtArray = [];
//   txtArray.forEach(txt => {
//     splitTxtArray.push(...splitStringBySize(txt, 255));
//   });

  let result = {
    name: rrTokens[0],
    txt: txtArray.join(' ')
  };

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
  const txtArray = rrTokens.slice(rrData.typeIndex + 1);
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift('@');
    }
  }

//   const splitTxtArray = [];
//   txtArray.forEach(txt => {
//     splitTxtArray.push(...splitStringBySize(txt, 255));
//   });

  let result = {
    name: rrTokens[0],
    data: txtArray.join(' ')
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

let parseCAA = function (rrData, recordsSoFar) {
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
    flags: parseInt(rrTokens[l - 3], 10),
    tag: rrTokens[l - 2],
    value: rrTokens[l - 1].replace(new RegExp('^"(.+?)"$'), "$1"),
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

// const splitStringBySize = function (input, chunkSize) {
//   const output = [];
//   const numOfChunks = Math.ceil(input.length / chunkSize);
//   for (let i = 0; i < numOfChunks; ++i) {
//     let chunkData = input.slice(i * chunkSize, (i + 1) * chunkSize);
//     if (!input.startsWith('"') || !input.endsWith('"')) {
//       chunkData = '"' + chunkData + '"';
//     }
//     output.push(chunkData)
//   }
//   return output;
// }

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
