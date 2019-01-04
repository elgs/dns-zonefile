/* @flow */

'use strict'
import type { ZoneFileObject } from './zoneFile'

import { getZoneFileTemplate } from './zoneFileTemplate'

export function makeZoneFile(jsonZoneFile: ZoneFileObject,
                             template: string =getZoneFileTemplate()) {
  if (jsonZoneFile['$origin'])
    template = processOrigin(jsonZoneFile['$origin'], template)
  if (jsonZoneFile['$ttl'])
    template = processTTL(jsonZoneFile['$ttl'], template)
  if (jsonZoneFile['soa'])
    template = processSOA(jsonZoneFile['soa'], template)
  if (jsonZoneFile['ns'])
    template = processNS(jsonZoneFile['ns'], template)
  if (jsonZoneFile['a'])
    template = processA(jsonZoneFile['a'], template)
  if (jsonZoneFile['aaaa'])
    template = processAAAA(jsonZoneFile['aaaa'], template)
  if (jsonZoneFile['cname'])
    template = processCNAME(jsonZoneFile['cname'], template)
  if (jsonZoneFile['mx'])
    template = processMX(jsonZoneFile['mx'], template)
  if (jsonZoneFile['ptr'])
    template = processPTR(jsonZoneFile['ptr'], template)
  if (jsonZoneFile['txt'])
    template = processTXT(jsonZoneFile['txt'], template)
  if (jsonZoneFile['srv'])
    template = processSRV(jsonZoneFile['srv'], template)
  if (jsonZoneFile['spf'])
    template = processSPF(jsonZoneFile['spf'], template)
  if (jsonZoneFile['uri'])
    template = processURI(jsonZoneFile['uri'], template)
  template = processValues(jsonZoneFile, template)
  return template.replace(/\n{2,}/gim, '\n\n')
};

function processOrigin(data, template) {
  let ret = ''
  if (typeof data !== 'undefined') {
    ret += '$ORIGIN ' + data
  }
  return template.replace('{$origin}', ret)
};

function processTTL(data, template) {
  let ret = ''
  if (typeof data !== 'undefined') {
    ret += '$TTL ' + data
  }
  return template.replace('{$ttl}', ret)
};

function processSOA(data, template) {
  let ret = template
  if (typeof data !== 'undefined') {
    data.name = data.name || '@'
    data.ttl = data.ttl || ''
    for (const key in data) {
      const value = data[key]
      ret = ret.replace('{' + key + '}', value + '\t')
    }
  }
  return ret
};

function processNS(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tNS\t' + record.host + '\n'
  }
  return template.replace('{ns}', ret)
};

function processA(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tA\t' + record.ip + '\n'
  }
  return template.replace('{a}', ret)
};

function processAAAA(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tAAAA\t' + record.ip + '\n'
  }
  return template.replace('{aaaa}', ret)
};

function processCNAME(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tCNAME\t' + record.alias + '\n'
  }
  return template.replace('{cname}', ret)
};

function processMX(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tMX\t' + record.preference + '\t' + record.host + '\n'
  }
  return template.replace('{mx}', ret)
};

function processPTR(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tPTR\t' + record.host + '\n'
  }
  return template.replace('{ptr}', ret)
};

function processTXT(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tTXT\t'
    const txtData = record.txt
    if (typeof(txtData) === 'string') {
      ret += '"' + txtData + '"'
    } else if (txtData instanceof Array) {
      ret += txtData
        .map(
          function (datum) {
            return '"' + datum + '"'
          })
        .join(' ')
    }
    ret += '\n'
  }
  return template.replace('{txt}', ret)
};

function processSRV(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tSRV\t' + record.priority + '\t'
    ret += record.weight + '\t'
    ret += record.port + '\t'
    ret += record.target + '\n'
  }
  return template.replace('{srv}', ret)
};

function processSPF(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tSPF\t' + record.data + '\n'
  }
  return template.replace('{spf}', ret)
};

function processURI(data, template) {
  let ret = ''
  for (const record of data) {
    ret += (record.name || '@') + '\t'
    if (record.ttl) ret += record.ttl + '\t'
    ret += 'IN\tURI\t' + record.priority + '\t'
    ret += record.weight + '\t'
    ret += '"' + record.target + '"\n'
  }
  return template.replace('{uri}', ret)
};

function processValues(jsonZoneFile, template) {
  template = template.replace('{zone}', jsonZoneFile['$origin'] || (jsonZoneFile['soa'] ? jsonZoneFile['soa']['name']: false) || '')
  template = template.replace('{datetime}', (new Date()).toISOString())
  const time = Math.round(Date.now() / 1000)
  return template.replace('{time}', `${time}`)
};
