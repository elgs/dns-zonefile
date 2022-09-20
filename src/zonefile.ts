import { DNSZone, ParseResult, SOA } from "./types.js";

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

; DS Records
{ds}

; TLSA Records
{tlsa}

`;

/////////////////////////////////////////////////////////////////////////////////////
//                                                               __                //
//                                                              /  |               //
//   ______    ______   _______    ______    ______   ______   _$$ |_     ______   //
//  /      \  /      \ /       \  /      \  /      \ /      \ / $$   |   /      \  //
// /$$$$$$  |/$$$$$$  |$$$$$$$  |/$$$$$$  |/$$$$$$  |$$$$$$  |$$$$$$/   /$$$$$$  | //
// $$ |  $$ |$$    $$ |$$ |  $$ |$$    $$ |$$ |  $$/ /    $$ |  $$ | __ $$    $$ | //
// $$ \__$$ |$$$$$$$$/ $$ |  $$ |$$$$$$$$/ $$ |     /$$$$$$$ |  $$ |/  |$$$$$$$$/  //
// $$    $$ |$$       |$$ |  $$ |$$       |$$ |     $$    $$ |  $$  $$/ $$       | //
//  $$$$$$$ | $$$$$$$/ $$/   $$/  $$$$$$$/ $$/       $$$$$$$/    $$$$/   $$$$$$$/  //
// /  \__$$ |                                                                      //
// $$    $$/                                                                       //
//  $$$$$$/                                                                        //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
const generate = (options: DNSZone, template: string) => {
  const json = JSON.parse(JSON.stringify(options));
  template = template || defaultTemplate;
  template = process$ORIGIN(json[`$origin`], template);
  template = process$TTL(json[`$ttl`], template);
  template = processSOA(json[`soa`], template);
  template = processNS(json[`ns`] || [], template);
  template = processA(json[`a`] || [], template);
  template = processAAAA(json[`aaaa`] || [], template);
  template = processCNAME(json[`cname`] || [], template);
  template = processMX(json[`mx`] || [], template);
  template = processPTR(json[`ptr`] || [], template);
  template = processTXT(json[`txt`] || [], template);
  template = processSRV(json[`srv`] || [], template);
  template = processSPF(json[`spf`] || [], template);
  template = processCAA(json[`caa`] || [], template);
  template = processDS(json[`ds`] || [], template);
  template = processTLSA(json[`tlsa`] || [], template);
  template = processValues(json, template);
  return template.replace(/\n{2,}/gim, `\n\n`);
};

const process$ORIGIN = (data: string, template: string) => {
  let ret = ``;
  if (typeof data !== `undefined`) {
    ret += `$ORIGIN ` + data;
  }
  return template.replace(`{$origin}`, ret);
};

const process$TTL = (data: string, template: string) => {
  let ret = ``;
  if (typeof data !== `undefined`) {
    ret += `$TTL ` + data;
  }
  return template.replace(`{$ttl}`, ret);
};

const processSOA = (data: { [x: string]: string; name?: any; ttl?: any }, template: string) => {
  let ret = template;
  data.name = data.name || `@`;
  data.ttl = data.ttl || ``;
  Object.keys(data).map((key) => {
    ret = ret.replace(`{` + key + `}`, data[key] + `\t`);
  });
  return ret;
};

const processNS = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tNS\t` + value.host + `\n`;
  }
  return template.replace(`{ns}`, ret);
};

const processA = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tA\t` + value.ip + `\n`;
  }
  return template.replace(`{a}`, ret);
};

const processAAAA = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tAAAA\t` + value.ip + `\n`;
  }
  return template.replace(`{aaaa}`, ret);
};

const processCNAME = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tCNAME\t` + value.alias + `\n`;
  }
  return template.replace(`{cname}`, ret);
};

const processMX = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tMX\t` + value.preference + `\t` + value.host + `\n`;
  }
  return template.replace(`{mx}`, ret);
};

const processPTR = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tPTR\t` + value.host + `\n`;
  }
  return template.replace(`{ptr}`, ret);
};

const processTXT = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tTXT\t` + value.txt + `\n`;
  }
  return template.replace(`{txt}`, ret);
};

const processSRV = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tSRV\t` + value.priority + `\t`;
    ret += value.weight + `\t`;
    ret += value.port + `\t`;
    ret += value.target + `\n`;
  }
  return template.replace(`{srv}`, ret);
};

const processSPF = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tSPF\t` + value.data + `\n`;
  }
  return template.replace(`{spf}`, ret);
};

const processCAA = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tCAA\t${value.flags}\t${value.tag}\t${value.value}\n`;
  }
  return template.replace(`{caa}`, ret);
};

const processDS = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tDS\t${value.key_tag}\t${value.algorithm}\t${value.digest_type}\t${value.digest}\n`;
  }
  return template.replace(`{ds}`, ret);
};

const processTLSA = (data: any, template: string) => {
  let ret = ``;
  for (const value of data) {
    ret += (value.name || `@`) + `\t`;
    if (value.ttl) ret += value.ttl + `\t`;
    ret += `IN\tTLSA\t` + value.cert_usage + `\t`;
    ret += value.selector + `\t`;
    ret += value.matching + `\t`;
    ret += value.cert_data + `\n`;
  }
  return template.replace(`{tlsa}`, ret);
};

const processValues = (options: any, template: string) => {
  template = template.replace(`{zone}`, options[`$origin`] || options[`soa`][`name`] || ``);
  template = template.replace(`{datetime}`, new Date().toISOString());
  return template.replace(`{time}`, Math.round(Date.now() / 1000).toString());
};

////////////////////////////////////////////////////////
//   ______    ______    ______    _______   ______   //
//  /      \  /      \  /      \  /       | /      \  //
// /$$$$$$  | $$$$$$  |/$$$$$$  |/$$$$$$$/ /$$$$$$  | //
// $$ |  $$ | /    $$ |$$ |  $$/ $$      \ $$    $$ | //
// $$ |__$$ |/$$$$$$$ |$$ |       $$$$$$  |$$$$$$$$/  //
// $$    $$/ $$    $$ |$$ |      /     $$/ $$       | //
// $$$$$$$/   $$$$$$$/ $$/       $$$$$$$/   $$$$$$$/  //
// $$ |                                               //
// $$ |                                               //
// $$/                                                //
//                                                    //
////////////////////////////////////////////////////////
const parse = (text: string): DNSZone => {
  text = removeComments(text);
  text = flatten(text);
  return parseRRs(text);
};

const removeComments = (text: string) => {
  const lines = text.split(`\n`);
  let ret = ``;
  for (const line of lines) {
    if (line.trim().startsWith(`;`)) {
      continue;
    }
    const tokens = splitArgs(line, `;`, true);
    for (const token of tokens) {
      ret += token;
      if (token.endsWith(`\\`)) {
        ret += `;`;
      } else {
        ret += `\n`;
        break;
      }
    }
  }
  return ret;
};

const flatten = (text: string) => {
  const captured = [];
  const re = /\([\s\S]*?\)/gim;
  interface MEX extends RegExpExecArray {
    replacement: string;
  }
  let match: MEX = re.exec(text) as MEX;
  while (match !== null) {
    match.replacement = match[0].replace(/\s+/gm, ` `);
    captured.push(match);
    // captured Text, index, input
    /*@ts-ignore*/
    match = re.exec(text);
  }
  const arrText = text.split(``);
  for (match of captured) {
    arrText.splice(match.index, match[0].length, match.replacement);
  }
  return arrText.join(``).replace(/\(|\)/gim, ` `);
};

const normalizeRR = (rr: string) => {
  let rrArray = splitArgs(rr, null, true);
  let hasName = false;
  let hasTtl = false;
  if (rr.match(/^\s+/)) {
    hasName = false;
  } else {
    hasName = true;
  }

  // According to RFC 1035:
  // <rr> contents take one of the following forms:
  // [<TTL>] [<class>] <type> <RDATA> -- We assume this one
  // [<class>] [<TTL>] <type> <RDATA>
  if (hasName) {
    if (!isNaN(parseInt(rrArray[1]))) {
      hasTtl = true;
    }
  } else {
    if (!isNaN(parseInt(rrArray[0]))) {
      hasTtl = true;
    }
  }

  let rrTypeIndex = 0;
  if (hasName) {
    ++rrTypeIndex;
  }
  if (hasTtl) {
    ++rrTypeIndex;
  }
  let rrType = rrArray[rrTypeIndex];
  if (rrType === `IN`) {
    rrType = rrArray[rrTypeIndex + 1];
  }

  let typeIndex = rrArray.indexOf(rrType, hasName ? 1 : 0);
  if (typeIndex === 0 || rrArray[typeIndex - 1] !== `IN`) {
    rrArray.splice(typeIndex, 0, `IN`);
    ++typeIndex;
  }

  return {
    rrType,
    tokens: rrArray,
    hasName: hasName,
    hasTtl: hasTtl,
    typeIndex: typeIndex,
  };
};

const parseRRs = (text: string) => {
  let ret = {} as Record<string, any>;
  const rrs = text.split(`\n`);
  for (const rr of rrs) {
    if (!rr.trim()) {
      continue;
    }
    const rrArray = splitArgs(rr, null, true);
    if (rr.startsWith(`$ORIGIN`)) {
      ret.$origin = rrArray[1];
    } else if (rr.startsWith(`$TTL`)) {
      ret.$ttl = rrArray[1];
    } else {
      const nrr = normalizeRR(rr);
      // console.log(nrr);
      switch (nrr.rrType) {
        case `SOA`:
          ret.soa = parseSOA(rrArray);
          break;
        case `TXT`:
          ret.txt = ret.txt || [];
          ret.txt.push(parseTXT(nrr, ret.txt));
          break;
        case `NS`:
          ret.ns = ret.ns || [];
          ret.ns.push(parseNS(nrr, ret.ns));
          break;
        case `A`:
          ret.a = ret.a || [];
          ret.a.push(parseA(nrr, ret.a));
          break;
        case `AAAA`:
          ret.aaaa = ret.aaaa || [];
          ret.aaaa.push(parseAAAA(nrr, ret.aaaa));
          break;
        case `CNAME`:
          ret.cname = ret.cname || [];
          ret.cname.push(parseCNAME(nrr, ret.cname));
          break;
        case `MX`:
          ret.mx = ret.mx || [];
          ret.mx.push(parseMX(nrr, ret.mx));
          break;
        case `PTR`:
          ret.ptr = ret.ptr || [];
          ret.ptr.push(parsePTR(nrr, ret.ptr, ret.$origin));
          break;
        case `SRV`:
          ret.srv = ret.srv || [];
          ret.srv.push(parseSRV(nrr, ret.srv));
          break;
        case `SPF`:
          ret.spf = ret.spf || [];
          ret.spf.push(parseSPF(nrr, ret.spf));
          break;
        case `CAA`:
          ret.caa = ret.caa || [];
          ret.caa.push(parseCAA(nrr, ret.caa));
          break;
        case `DS`:
          ret.ds = ret.ds || [];
          ret.ds.push(parseDS(nrr, ret.ds));
          break;
        case `TLSA`:
          ret.tlsa = ret.tlsa || [];
          ret.tlsa.push(parseTLSA(nrr, ret.tlsa));
          break;
      }
    }
  }
  return ret;
};

const parseSOA = (rrTokens: string | any[]) => {
  const l = rrTokens.length;
  const soa: SOA = {
    name: rrTokens[0],
    minimum: parseInt(rrTokens[l - 1], 10),
    expire: parseInt(rrTokens[l - 2], 10),
    retry: parseInt(rrTokens[l - 3], 10),
    refresh: parseInt(rrTokens[l - 4], 10),
    serial: parseInt(rrTokens[l - 5], 10),
    rname: rrTokens[l - 6],
    mname: rrTokens[l - 7],
  };

  if (!isNaN(rrTokens[1])) soa.ttl = parseInt(rrTokens[1], 10);
  return soa;
};

const parseNS = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    host: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseA = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    ip: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseAAAA = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    ip: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseCNAME = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    alias: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseMX = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    preference: parseInt(rrTokens[l - 2], 10),
    host: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseTXT = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex: any },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  const txtArray = rrTokens.slice(rrData.typeIndex + 1);
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  //   const splitTxtArray = [];
  //   txtArray.forEach(txt => {
  //     splitTxtArray.push(...splitStringBySize(txt, 255));
  //   });

  const result: ParseResult = {
    name: rrTokens[0],
    txt: txtArray.join(` `),
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parsePTR = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[],
  currentOrigin: string
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName && recordsSoFar[recordsSoFar.length - 1]) {
    rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    fullname: rrTokens[0] + `.` + currentOrigin,
    host: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseSRV = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    target: rrTokens[l - 1],
    priority: parseInt(rrTokens[l - 4], 10),
    weight: parseInt(rrTokens[l - 3], 10),
    port: parseInt(rrTokens[l - 2], 10),
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseSPF = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex: any },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  const txtArray = rrTokens.slice(rrData.typeIndex + 1);
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  //   const splitTxtArray = [];
  //   txtArray.forEach(txt => {
  //     splitTxtArray.push(...splitStringBySize(txt, 255));
  //   });

  const result: ParseResult = {
    name: rrTokens[0],
    data: txtArray.join(` `),
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseCAA = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    flags: parseInt(rrTokens[l - 3], 10),
    tag: rrTokens[l - 2],
    value: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};

const parseDS = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    key_tag: rrTokens[l - 4],
    algorithm: rrTokens[l - 3],
    digest_type: rrTokens[l - 2],
    digest: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1], 10);
  return result;
};
const parseTLSA = (
  rrData: { rrType?: string; tokens: any; hasName: any; hasTtl: any; typeIndex?: number },
  recordsSoFar: string | any[]
) => {
  const rrTokens = rrData.tokens;
  if (!rrData.hasName) {
    if (recordsSoFar.length) {
      rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name);
    } else {
      rrTokens.unshift(`@`);
    }
  }

  const l = rrTokens.length;
  const result: ParseResult = {
    name: rrTokens[0],
    cert_usage: parseInt(rrTokens[l - 4]),
    selector: parseInt(rrTokens[l - 3]),
    matching: parseInt(rrTokens[l - 2]),
    cert_data: rrTokens[l - 1],
  };

  if (rrData.hasTtl) result.ttl = parseInt(rrTokens[1]);
  return result;
};

const splitArgs = (input: string, sep: string | RegExp | null, keepQuotes: boolean) => {
  const separator = sep || /\s/g;
  let singleQuoteOpen = false;
  let doubleQuoteOpen = false;
  let tokenBuffer = [];
  let ret = [];

  const arr = input.split(``);
  for (let i = 0; i < arr.length; ++i) {
    const element = arr[i];
    let matches = element.match(separator);
    if (element === `'` && !doubleQuoteOpen) {
      if (keepQuotes === true) {
        tokenBuffer.push(element);
      }
      singleQuoteOpen = !singleQuoteOpen;
      continue;
    } else if (element === `"` && !singleQuoteOpen) {
      if (keepQuotes === true) {
        tokenBuffer.push(element);
      }
      doubleQuoteOpen = !doubleQuoteOpen;
      continue;
    }

    if (!singleQuoteOpen && !doubleQuoteOpen && matches) {
      if (tokenBuffer.length > 0) {
        ret.push(tokenBuffer.join(``));
        tokenBuffer = [];
      }
    } else {
      tokenBuffer.push(element);
    }
  }
  if (tokenBuffer.length > 0) {
    ret.push(tokenBuffer.join(``));
  } else if (!!sep) {
    ret.push(``);
  }
  return ret;
};

export default {
  generate,
  parse,
};
