'use strict'

export function parseZoneFile(text) {
    text = removeComments(text)
    text = flatten(text)
    return parseRRs(text)
};

const removeComments = function(text) {
    const re = /(^|[^\\]);.*/g
    return text.replace(re, function(m, g1) {
        return g1 ? g1 : '' // if g1 is set/matched, re-insert it, else remove
    })
}

const flatten = function(text) {
    const captured = []
    const re = /\([\s\S]*?\)/gim
    let match = re.exec(text)
    while (match !== null) {
        match.replacement = match[0].replace(/\s+/gm, ' ')
        captured.push(match)
        // captured Text, index, input
        match = re.exec(text)
    }
    const arrText = text.split('')
    for (const match of captured) {
        arrText.splice(match.index, match[0].length, match.replacement)
    }
    return arrText.join('').replace(/\(|\)/gim, ' ')
}

const parseRRs = function(text) {
    const ret = {}
    const rrs = text.split('\n')
    for (const rr of rrs) {
        if (!rr || !rr.trim()) {
            continue
        }
        const uRR = rr.toUpperCase()
        if (/\s+TXT\s+/.test(uRR)) {
            ret.txt = ret.txt || []
            ret.txt.push(parseTXT(rr))
        } else if (uRR.indexOf('$ORIGIN') === 0) {
            ret.$origin = rr.split(/\s+/g)[1]
        } else if (uRR.indexOf('$TTL') === 0) {
            ret.$ttl = parseInt(rr.split(/\s+/g)[1], 10)
        } else if (/\s+SOA\s+/.test(uRR)) {
            ret.soa = parseSOA(rr)
        } else if (/\s+NS\s+/.test(uRR)) {
            ret.ns = ret.ns || []
            ret.ns.push(parseNS(rr))
        } else if (/\s+A\s+/.test(uRR)) {
            ret.a = ret.a || []
            ret.a.push(parseA(rr, ret.a))
        } else if (/\s+AAAA\s+/.test(uRR)) {
            ret.aaaa = ret.aaaa || []
            ret.aaaa.push(parseAAAA(rr))
        } else if (/\s+CNAME\s+/.test(uRR)) {
            ret.cname = ret.cname || []
            ret.cname.push(parseCNAME(rr))
        } else if (/\s+MX\s+/.test(uRR)) {
            ret.mx = ret.mx || []
            ret.mx.push(parseMX(rr))
        } else if (/\s+PTR\s+/.test(uRR)) {
            ret.ptr = ret.ptr || []
            ret.ptr.push(parsePTR(rr, ret.ptr, ret.$origin))
        } else if (/\s+SRV\s+/.test(uRR)) {
            ret.srv = ret.srv || []
            ret.srv.push(parseSRV(rr))
        } else if (/\s+SPF\s+/.test(uRR)) {
            ret.spf = ret.spf || []
            ret.spf.push(parseSPF(rr))
        } else if (/\s+URI\s+/.test(uRR)) {
            ret.uri = ret.uri || []
            ret.uri.push(parseURI(rr))
        }
    }
    return ret
}

const parseSOA = function(rr) {
    const soa = {}
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    soa.name = rrTokens[0]
    soa.minimum = parseInt(rrTokens[l - 1], 10)
    soa.expire = parseInt(rrTokens[l - 2], 10)
    soa.retry = parseInt(rrTokens[l - 3], 10)
    soa.refresh = parseInt(rrTokens[l - 4], 10)
    soa.serial = parseInt(rrTokens[l - 5], 10)
    soa.rname = rrTokens[l - 6]
    soa.mname = rrTokens[l - 7]
    if (!isNaN(rrTokens[1])) soa.ttl = parseInt(rrTokens[1], 10)
    return soa
}

const parseNS = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        host: rrTokens[l - 1]
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseA = function(rr, recordsSoFar) {
    const rrTokens = rr.trim().split(/\s+/g)
    const urrTokens = rr.trim().toUpperCase().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        ip: rrTokens[l - 1]
    }

    if (urrTokens.lastIndexOf('A') === 0) {
        if (recordsSoFar.length) {
            result.name = recordsSoFar[recordsSoFar.length - 1].name
        } else {
            result.name = '@'
        }
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseAAAA = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        ip: rrTokens[l - 1]
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseCNAME = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        alias: rrTokens[l - 1]
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseMX = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        preference: parseInt(rrTokens[l - 2], 10),
        host: rrTokens[l - 1]
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseTXT = function(rr) {
    const rrTokens = rr.trim().match(/[^\s\"']+|\"[^\"]*\"|'[^']*'/g)
    const l = rrTokens.length
    const indexTXT = rrTokens.indexOf('TXT')

    const stripText = function(txt) {
        if (txt.indexOf('\"') > -1) {
            txt = txt.split('\"')[1]
        }
        if (txt.indexOf('"') > -1) {
            txt = txt.split('"')[1]
        }
        return txt
    }

    let tokenTxt
    if (l - indexTXT - 1 > 1) {
        tokenTxt = rrTokens
            .slice(indexTXT + 1)
            .map(stripText)
    } else {
        tokenTxt = stripText(rrTokens[l - 1])
    }

    const result = {
        name: rrTokens[0],
        txt: tokenTxt
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parsePTR = function(rr, recordsSoFar, currentOrigin) {
    const rrTokens = rr.trim().split(/\s+/g)
    const urrTokens = rr.trim().toUpperCase().split(/\s+/g)

    if (urrTokens.lastIndexOf('PTR') === 0 && recordsSoFar[recordsSoFar.length - 1]) {
        rrTokens.unshift(recordsSoFar[recordsSoFar.length - 1].name)
    }

    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        fullname: rrTokens[0] + '.' + currentOrigin,
        host: rrTokens[l - 1]
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseSRV = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const l = rrTokens.length
    const result = {
        name: rrTokens[0],
        target: rrTokens[l - 1],
        priority: parseInt(rrTokens[l - 4], 10),
        weight: parseInt(rrTokens[l - 3], 10),
        port: parseInt(rrTokens[l - 2], 10)
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseSPF = function(rr) {
    const rrTokens = rr.trim().split(/\s+/g)
    const result = {
        name: rrTokens[0],
        data: ''
    }

    let l = rrTokens.length
    while (l-- > 4) {
        result.data = rrTokens[l] + ' ' + result.data.trim()
    }

    if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
    return result
}

const parseURI = function(rr) {
   const rrTokens = rr.trim().split(/\s+/g)
   const l = rrTokens.length
   const result = {
      name: rrTokens[0],
      target: rrTokens[l - 1].replace(/"/g, ''),
      priority: parseInt(rrTokens[l - 3], 10),
      weight: parseInt(rrTokens[l - 2], 10)
   }

   if (!isNaN(rrTokens[1])) result.ttl = parseInt(rrTokens[1], 10)
   return result
}
