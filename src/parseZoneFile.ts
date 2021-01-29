import {
  NSType,
  AType,
  CNAMEType,
  MXType,
  TXTType,
  SRVType,
  SPFType,
  URIType,
  ZoneFileObject,
  SoaType,
} from './zoneFile';

export function parseZoneFile(text: string) {
  text = removeComments(text);
  text = flatten(text);
  return parseRRs(text);
}

function removeComments(text: string) {
  const re = /(^|[^\\]);.*/g;
  return text.replace(re, function(_m, g1) {
    return g1 ? g1 : ''; // if g1 is set/matched, re-insert it, else remove
  });
}

function flatten(text: string) {
  const captured = [];
  const re = /\([\s\S]*?\)/gim;
  let match = re.exec(text);
  while (match !== null) {
    const replacement = match[0].replace(/\s+/gm, ' ');
    captured.push({ match, replacement });
    // captured Text, index, input
    match = re.exec(text);
  }
  const arrText = text.split('');
  for (const cur of captured) {
    const { match, replacement } = cur;
    arrText.splice(match.index, match[0].length, replacement);
  }
  return arrText.join('').replace(/\(|\)/gim, ' ');
}

function parseRRs(text: string) {
  const ret: ZoneFileObject = {};
  const rrs = text.split('\n');
  for (const rr of rrs) {
    if (!rr || !rr.trim()) {
      continue;
    }
    const uRR = rr.toUpperCase();
    if (/\s+TXT\s+/.test(uRR)) {
      ret.txt = ret.txt || [];
      ret.txt.push(parseTXT(rr));
    } else if (uRR.indexOf('$ORIGIN') === 0) {
      ret.$origin = rr.split(/\s+/g)[1];
    } else if (uRR.indexOf('$TTL') === 0) {
      ret.$ttl = parseInt(rr.split(/\s+/g)[1], 10);
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
    } else if (/\s+URI\s+/.test(uRR)) {
      ret.uri = ret.uri || [];
      ret.uri.push(parseURI(rr));
    }
  }
  return ret;
}

function parseSOA(rr: string) {
  const soa: SoaType = {};
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  soa.name = rrTokens[0];
  soa.minimum = parseInt(rrTokens[l - 1], 10);
  soa.expire = parseInt(rrTokens[l - 2], 10);
  soa.retry = parseInt(rrTokens[l - 3], 10);
  soa.refresh = parseInt(rrTokens[l - 4], 10);
  soa.serial = parseInt(rrTokens[l - 5], 10);
  soa.rname = rrTokens[l - 6];
  soa.mname = rrTokens[l - 7];
  if (!isNaN((rrTokens[1] as unknown) as number)) soa.ttl = parseInt(rrTokens[1], 10);
  return soa;
}

function parseNS(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: NSType = {
    name: rrTokens[0],
    host: rrTokens[l - 1],
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseA(rr: string, recordsSoFar: AType[]) {
  const rrTokens = rr.trim().split(/\s+/g);
  const urrTokens = rr
    .trim()
    .toUpperCase()
    .split(/\s+/g);
  const l = rrTokens.length;
  const result: AType = {
    name: rrTokens[0],
    ip: rrTokens[l - 1],
  };

  if (urrTokens.lastIndexOf('A') === 0) {
    if (recordsSoFar.length) {
      result.name = recordsSoFar[recordsSoFar.length - 1].name;
    } else {
      result.name = '@';
    }
  }

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseAAAA(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: AType = {
    name: rrTokens[0],
    ip: rrTokens[l - 1],
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseCNAME(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: CNAMEType = {
    name: rrTokens[0],
    alias: rrTokens[l - 1],
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseMX(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: MXType = {
    name: rrTokens[0],
    preference: parseInt(rrTokens[l - 2], 10),
    host: rrTokens[l - 1],
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseTXT(rr: string) {
  const rrTokens = rr.trim().match(/[^\s"']+|"[^"]*"|'[^']*'/g);
  if (!rrTokens) throw new Error('Failure to tokenize TXT record');
  const l = rrTokens.length;
  const indexTXT = rrTokens.indexOf('TXT');

  function stripText(txt: string) {
    if (txt.indexOf('"') > -1) {
      txt = txt.split('"')[1];
    }
    return txt;
  }

  let tokenTxt: string | string[];
  if (l - indexTXT - 1 > 1) {
    tokenTxt = [...rrTokens.slice(indexTXT + 1).map(stripText)];
  } else {
    tokenTxt = stripText(rrTokens[l - 1]);
  }

  const result: TXTType = {
    name: rrTokens[0],
    txt: tokenTxt,
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parsePTR(rr: string, recordsSoFar: NSType[], currentOrigin: string | undefined) {
  const rrTokens = rr.trim().split(/\s+/g);
  const urrTokens = rr
    .trim()
    .toUpperCase()
    .split(/\s+/g);

  if (urrTokens.lastIndexOf('PTR') === 0 && recordsSoFar[recordsSoFar.length - 1]) {
    rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name as string);
  }

  const l = rrTokens.length;
  const result: NSType = {
    name: rrTokens[0],
    fullname: rrTokens[0] + '.' + currentOrigin,
    host: rrTokens[l - 1],
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseSRV(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: SRVType = {
    name: rrTokens[0],
    target: rrTokens[l - 1],
    priority: parseInt(rrTokens[l - 4], 10),
    weight: parseInt(rrTokens[l - 3], 10),
    port: parseInt(rrTokens[l - 2], 10),
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseSPF(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const result: SPFType = {
    name: rrTokens[0],
    data: '',
  };

  let l = rrTokens.length;
  while (l-- > 4) {
    result.data = rrTokens[l] + ' ' + result.data.trim();
  }

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}

function parseURI(rr: string) {
  const rrTokens = rr.trim().split(/\s+/g);
  const l = rrTokens.length;
  const result: URIType = {
    name: rrTokens[0],
    target: rrTokens[l - 1].replace(/"/g, ''),
    priority: parseInt(rrTokens[l - 3], 10),
    weight: parseInt(rrTokens[l - 2], 10),
  };

  if (!isNaN((rrTokens[1] as unknown) as number)) result.ttl = parseInt(rrTokens[1], 10);
  return result;
}
