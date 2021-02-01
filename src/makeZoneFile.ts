import {
  AType,
  CNAMEType,
  MXType,
  NSType,
  SoaType,
  SPFType,
  SRVType,
  TXTType,
  URIType,
  ZoneFileObject,
} from './zoneFile';

import { getZoneFileTemplate } from './zoneFileTemplate';

export function makeZoneFile(jsonZoneFile: ZoneFileObject, template: string = getZoneFileTemplate()) {
  template = processOrigin(jsonZoneFile['$origin'], template);
  template = processTTL(jsonZoneFile['$ttl'], template);
  template = processSOA(jsonZoneFile['soa'], template);
  template = processNS(jsonZoneFile['ns'], template);
  template = processA(jsonZoneFile['a'], template);
  template = processAAAA(jsonZoneFile['aaaa'], template);
  template = processCNAME(jsonZoneFile['cname'], template);
  template = processMX(jsonZoneFile['mx'], template);
  template = processPTR(jsonZoneFile['ptr'], template);
  template = processTXT(jsonZoneFile['txt'], template);
  template = processSRV(jsonZoneFile['srv'], template);
  template = processSPF(jsonZoneFile['spf'], template);
  template = processURI(jsonZoneFile['uri'], template);
  template = processValues(jsonZoneFile, template);
  return template.replace(/\n{2,}/gim, '\n\n');
}

function processOrigin(data: string | undefined, template: string) {
  let ret = '';
  if (typeof data !== 'undefined') {
    ret += '$ORIGIN ' + data;
  }
  return template.replace('{$origin}', ret);
}

function processTTL(data: number | undefined, template: string) {
  let ret = '';
  if (typeof data !== 'undefined') {
    ret += '$TTL ' + data;
  }
  return template.replace('{$ttl}', ret);
}

function processSOA(data: SoaType | undefined, template: string) {
  let ret = template;
  if (typeof data !== 'undefined') {
    data.name = data.name || '@';
    data.ttl = data.ttl || '';
    for (const key in data) {
      const value = (data as Record<string, string>)[key];
      ret = ret.replace('{' + key + '}', value + '\t');
    }
  }
  return ret;
}

function processNS(data: NSType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tNS\t' + record.host + '\n';
    }
  }
  return template.replace('{ns}', ret);
}

function processA(data: AType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tA\t' + record.ip + '\n';
    }
  }
  return template.replace('{a}', ret);
}

function processAAAA(data: AType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tAAAA\t' + record.ip + '\n';
    }
  }
  return template.replace('{aaaa}', ret);
}

function processCNAME(data: CNAMEType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tCNAME\t' + record.alias + '\n';
    }
  }
  return template.replace('{cname}', ret);
}

function processMX(data: MXType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tMX\t' + record.preference + '\t' + record.host + '\n';
    }
  }
  return template.replace('{mx}', ret);
}

function processPTR(data: NSType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tPTR\t' + record.host + '\n';
    }
  }
  return template.replace('{ptr}', ret);
}

function processTXT(data: TXTType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tTXT\t';
      const txtData = record.txt;
      if (typeof txtData === 'string') {
        ret += '"' + txtData + '"';
      } else if (txtData instanceof Array) {
        ret += txtData
          .map(function(datum) {
            return '"' + datum + '"';
          })
          .join(' ');
      }
      ret += '\n';
    }
  }
  return template.replace('{txt}', ret);
}

function processSRV(data: SRVType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tSRV\t' + record.priority + '\t';
      ret += record.weight + '\t';
      ret += record.port + '\t';
      ret += record.target + '\n';
    }
  }
  return template.replace('{srv}', ret);
}

function processSPF(data: SPFType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tSPF\t' + record.data + '\n';
    }
  }
  return template.replace('{spf}', ret);
}

function processURI(data: URIType[] | undefined, template: string) {
  let ret = '';
  if (data) {
    for (const record of data) {
      ret += (record.name || '@') + '\t';
      if (record.ttl) ret += record.ttl + '\t';
      ret += 'IN\tURI\t' + record.priority + '\t';
      ret += record.weight + '\t';
      ret += '"' + record.target + '"\n';
    }
  }
  return template.replace('{uri}', ret);
}

function processValues(jsonZoneFile: ZoneFileObject, template: string) {
  template = template.replace(
    '{zone}',
    jsonZoneFile['$origin'] || (jsonZoneFile['soa'] ? jsonZoneFile['soa']['name'] : false) || ''
  );
  template = template.replace('{datetime}', new Date().toISOString());
  const time = Math.round(Date.now() / 1000);
  return template.replace('{time}', `${time}`);
}
