const defaultTemplate = `; Zone: {zone}
; Exported  (yyyy-mm-ddThh:mm:ss.sssZ): {datetime}

{$origin}
{$ttl}

{soa}

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

`;

// Rendered into the {soa} placeholder of the default template. The block is
// left out entirely when the zone has no SOA record, so that fragments can be
// generated without one.
const soaTemplate = `; SOA Record
{name} {ttl}\tIN\tSOA\t{mname}{rname}(
{serial} ;serial
{refresh} ;refresh
{retry} ;retry
{expire} ;expire
{minimum} ;minimum ttl
)
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
let generate = function (options, template) {
  const now = new Date();
  const time = Math.round(now.getTime() / 1000);
  const soa = options.soa;
  const values = {};

  // SOA fields are exposed as individual placeholders so that custom templates
  // can lay them out freely; the default template takes the whole block via
  // {soa}. "{time}" inside an SOA value (typically the serial, see README) is
  // the only substitution performed on record data: everything else is
  // inserted literally.
  const soaValues = {};
  if (soa) {
    for (const key of Object.keys(soa)) {
      const value = soa[key];
      soaValues[key] = (typeof value === 'string' ? value.split('{time}').join(time) : value) + '\t';
    }
    soaValues.name = ownerOf(soa) + '\t';
    soaValues.ttl = (hasTtl(soa) ? soa.ttl : '') + '\t';
  }
  Object.assign(values, soaValues);
  for (const type of Object.keys(rdataFormats)) {
    values[type] = (options[type] || []).map(record => formatRR(type, record)).join('');
  }
  values.soa = soa ? render(soaTemplate, soaValues) : '';
  values.$origin = options.$origin == null ? '' : '$ORIGIN ' + options.$origin;
  values.$ttl = options.$ttl == null ? '' : '$TTL ' + options.$ttl;
  values.zone = options.$origin || (soa ? ownerOf(soa) : '');
  values.datetime = now.toISOString();
  values.time = time;
  return render(template || defaultTemplate, values);
};

// Owner name of a record as written to the zone file: anything given
// explicitly (including the number 0) is kept; a missing or empty name means
// the zone apex.
let ownerOf = function (record) {
  return record.name === undefined || record.name === null || record.name === '' ? '@' : record.name;
};

// Whether a record carries its own TTL. 0 is a valid TTL and must be written.
let hasTtl = function (record) {
  return record.ttl !== undefined && record.ttl !== null && record.ttl !== '';
};

// RDATA presentation by record type (keys double as the template placeholders).
const rdataFormats = {
  ns: record => record.host,
  mx: record => `${record.preference}\t${record.host}`,
  a: record => record.ip,
  aaaa: record => record.ip,
  cname: record => record.alias,
  ptr: record => record.host,
  txt: record => record.txt,
  srv: record => `${record.priority}\t${record.weight}\t${record.port}\t${record.target}`,
  spf: record => record.data,
  caa: record => `${record.flags}\t${record.tag}\t${record.value}`,
  ds: record => `${record.key_tag}\t${record.algorithm}\t${record.digest_type}\t${record.digest}`,
};

let formatRR = function (type, record) {
  const ttl = hasTtl(record) ? record.ttl + '\t' : '';
  return `${ownerOf(record)}\t${ttl}IN\t${type.toUpperCase()}\t${rdataFormats[type](record)}\n`;
};

// Fills the {placeholder}s of a template from values in a single pass, so that
// inserted data is never scanned for placeholders again and replacement
// patterns such as "$&" stay literal. Unknown placeholders are left alone.
// Runs of blank lines, as empty sections of the template leave behind, are
// then reduced to a single one. Only the template's own line breaks are
// dropped for that: those within inserted values all stay, so that record
// data such as a TXT string spanning several lines comes out unchanged.
let render = function (template, values) {
  let text = '';
  const inserted = []; // [start, end) ranges of text that came from values
  let last = 0;
  for (const match of template.matchAll(/\{([^{}]+)\}/g)) {
    if (!Object.prototype.hasOwnProperty.call(values, match[1])) {
      continue;
    }
    text += template.slice(last, match.index);
    const value = String(values[match[1]]);
    inserted.push([text.length, text.length + value.length]);
    text += value;
    last = match.index + match[0].length;
  }
  text += template.slice(last);
  return text.replace(/\n{3,}/g, (run, offset) => {
    const end = offset + run.length;
    let kept = 0; // line breaks of the run that belong to inserted values
    for (const [from, to] of inserted) {
      kept += Math.max(0, Math.min(to, end) - Math.max(from, offset));
    }
    return '\n'.repeat(Math.max(kept, 2));
  });
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
let parse = function (text) {
  return parseRRs(splitRecords(text));
};

// Calls visit(index, char) for every character of text that can carry
// syntactic meaning: one that is neither escaped by a preceding backslash
// (RFC 1035 section 5.1: \X and \DDD) nor inside a quoted string. The quote
// characters themselves are not reported. Line breaks are nothing special
// here, so a quoted string or an escape may run across lines. visit may
// return an index further on at which to resume the scan: whatever lies in
// between is skipped unseen.
let scanActive = function (text, visit) {
  let quoted = false;
  for (let i = 0; i < text.length; ++i) {
    const c = text[i];
    if (c === '\\') {
      ++i; // the escaped character is literal, whatever it is
    } else if (c === '"') {
      quoted = !quoted;
    } else if (!quoted) {
      const resume = visit(i, c);
      if (resume > i) {
        i = resume - 1;
      }
    }
  }
};

// Cuts a zone file into its entries (RFC 1035 section 5.1), one string each.
// Comments are dropped. Parentheses group data that crosses a line boundary,
// for every record type, not only SOA: they are replaced by spaces and the
// line breaks they enclose are left in as plain whitespace. Quoted strings
// and escapes are kept verbatim and nothing inside them counts, be it a ';',
// a parenthesis or a line break: RFC 1035 lets any character occur inside a
// quoted string. Blank entries are left out.
let splitRecords = function (text) {
  const records = [];
  let record = '';
  let last = 0; // start of the pending run of unchanged text
  let depth = 0;
  const cut = (i, replacement) => {
    // moves the pending run into the record, with text[i] replaced
    record += text.slice(last, i) + replacement;
    last = i + 1;
  };
  scanActive(text, (i, c) => {
    if (c === '(') {
      ++depth;
      cut(i, ' ');
    } else if (c === ')') {
      depth = Math.max(depth - 1, 0);
      cut(i, ' ');
    } else if (c === '\n' && depth === 0) {
      cut(i, '');
      records.push(record);
      record = '';
    } else if (c === ';') {
      record += text.slice(last, i);
      const end = text.indexOf('\n', i); // the comment runs to the end of the line
      last = end === -1 ? text.length : end;
      return last; // resumes at the line break ending the comment, which is kept
    }
  });
  records.push(record + text.slice(last));
  return records.filter(record => record.trim());
};

// Splits an entry into tokens at unquoted, unescaped whitespace. Quotes and
// escapes are kept verbatim in the tokens.
let splitArgs = function (input) {
  const tokens = [];
  let last = 0;
  scanActive(input, (i, c) => {
    if (/\s/.test(c)) {
      if (i > last) {
        tokens.push(input.slice(last, i));
      }
      last = i + 1;
    }
  });
  if (input.length > last) {
    tokens.push(input.slice(last));
  }
  return tokens;
};

const ttlUnits = { w: 7 * 24 * 3600, d: 24 * 3600, h: 3600, m: 60, s: 1 };

// Seconds denoted by a TTL token: a decimal count of seconds (RFC 1035) or,
// as BIND accepts them, counts with the units w, d, h, m and s, such as "1h"
// or "1h30m". Anything else gives undefined.
let parseTtl = function (token) {
  if (/^\d+$/.test(token)) {
    return toInt(token);
  }
  if (!/^(\d+[wdhms])+$/i.test(token)) {
    return undefined;
  }
  let seconds = 0;
  for (const [, count, unit] of token.matchAll(/(\d+)([wdhms])/gi)) {
    seconds += toInt(count) * ttlUnits[unit.toLowerCase()];
  }
  return seconds;
};

let isClass = function (token) {
  return token.toUpperCase() === 'IN';
};

let toInt = function (token) {
  return parseInt(token, 10);
};

// Reads the [<TTL>] [<class>] <type> header that follows the owner name; the
// TTL and the class may appear in either order (RFC 1035 section 5.1). The
// type is upper-cased for dispatch; the RDATA tokens are returned untouched.
let parseHeader = function (tokens, start) {
  let i = start;
  let ttl;
  let hasClass = false;
  while (i < tokens.length) {
    const seconds = parseTtl(tokens[i]);
    if (seconds !== undefined && ttl === undefined) {
      ttl = seconds;
    } else if (isClass(tokens[i]) && !hasClass) {
      hasClass = true;
    } else {
      break;
    }
    ++i;
  }
  return { ttl, type: (tokens[i] || '').toUpperCase(), rdata: tokens.slice(i + 1) };
};

let parseRRs = function (records) {
  const ret = {};
  let origin; // $ORIGIN in effect
  let defaultTtl; // $TTL in effect, in seconds
  let zoneTtl; // the first $TTL, in seconds: the default that $ttl gives back
  let owner = '@'; // owner of the previous record, inherited by records without one
  for (const rr of records) {
    const tokens = splitArgs(rr);
    if (tokens[0].startsWith('$')) {
      const directive = tokens[0].toUpperCase();
      if (directive === '$ORIGIN') {
        origin = tokens[1];
        ret.$origin = origin;
      } else if (directive === '$TTL') {
        defaultTtl = parseTtl(tokens[1]);
        if (ret.$ttl === undefined) {
          // Only the first $TTL is kept, as written.
          ret.$ttl = tokens[1];
          zoneTtl = defaultTtl;
        }
      }
      continue;
    }
    const hasName = !/^\s/.test(rr);
    if (hasName) {
      owner = tokens[0];
    }
    const header = parseHeader(tokens, hasName ? 1 : 0);
    if (!Object.prototype.hasOwnProperty.call(rdataParsers, header.type)) {
      continue;
    }
    const record = { name: owner, ...rdataParsers[header.type](header.rdata, { owner, origin }) };
    if (header.ttl !== undefined) {
      record.ttl = header.ttl;
    } else if (defaultTtl !== undefined && defaultTtl !== zoneTtl) {
      // A record read under a default other than $ttl gets that value
      // pinned, so that it keeps its effective TTL when written out again.
      record.ttl = defaultTtl;
    }
    if (header.type === 'SOA') {
      ret.soa = record;
    } else {
      const key = header.type.toLowerCase();
      ret[key] = ret[key] || [];
      ret[key].push(record);
    }
  }
  return ret;
};

// Whether a domain name is absolute: it ends with a dot that is not escaped,
// that is, preceded by an even number of backslashes (possibly none).
let isAbsolute = function (name) {
  return /(^|[^\\])(\\\\)*\.$/.test(name);
};

// Resolves a PTR owner against the $ORIGIN in effect: "@" is the origin
// itself, an absolute name stays as it is and a relative name gets the origin
// appended. Without an origin the name is left unchanged.
let fullName = function (name, origin) {
  if (origin === undefined) {
    return name;
  }
  if (name === '@') {
    return origin;
  }
  if (isAbsolute(name)) {
    return name;
  }
  return origin === '.' ? name + '.' : name + '.' + origin;
};

// RDATA parsers by record type. Each receives the RDATA tokens and returns the
// record's fields; the owner name and the TTL are added by parseRRs.
const rdataParsers = {
  SOA: ([mname, rname, serial, refresh, retry, expire, minimum]) => ({
    mname,
    rname,
    serial: toInt(serial),
    refresh: toInt(refresh),
    retry: toInt(retry),
    expire: toInt(expire),
    minimum: toInt(minimum),
  }),
  NS: ([host]) => ({ host }),
  A: ([ip]) => ({ ip }),
  AAAA: ([ip]) => ({ ip }),
  CNAME: ([alias]) => ({ alias }),
  MX: ([preference, host]) => ({ preference: toInt(preference), host }),
  PTR: ([host], { owner, origin }) => ({ fullname: fullName(owner, origin), host }),
  TXT: rdata => ({ txt: rdata.join(' ') }),
  SRV: ([priority, weight, port, target]) => ({
    priority: toInt(priority),
    weight: toInt(weight),
    port: toInt(port),
    target,
  }),
  SPF: rdata => ({ data: rdata.join(' ') }),
  CAA: ([flags, tag, ...value]) => ({ flags: toInt(flags), tag, value: value.join(' ') }),
  // RFC 4034 section 5.3: whitespace is allowed within the hexadecimal digest.
  DS: ([key_tag, algorithm, digest_type, ...digest]) => ({ key_tag, algorithm, digest_type, digest: digest.join('') }),
};

export { generate, parse };

export default {
  generate,
  parse,
};
