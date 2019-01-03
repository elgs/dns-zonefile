/* @flow */

'use strict'

import { getZoneFileTemplate } from './zoneFileTemplate'

export function makeZoneFile(jsonZoneFile, template=getZoneFileTemplate()) {
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
};

let processOrigin = function(data, template) {
    let ret = '';
    if (typeof data !== 'undefined') {
        ret += '$ORIGIN ' + data;
    }
    return template.replace('{$origin}', ret);
};

let processTTL = function(data, template) {
    let ret = '';
    if (typeof data !== 'undefined') {
        ret += '$TTL ' + data;
    }
    return template.replace('{$ttl}', ret);
};

let processSOA = function(data, template) {
    let ret = template;
    if (typeof data !== 'undefined') {
        data.name = data.name || '@';
        data.ttl = data.ttl || '';
        for (let key in data) {
            let value = data[key];
            ret = ret.replace('{' + key + '}', value + '\t');
        }
    }
    return ret;
};

let processNS = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tNS\t' + data[i].host + '\n';
    }
    return template.replace('{ns}', ret);
};

let processA = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tA\t' + data[i].ip + '\n';
    }
    return template.replace('{a}', ret);
};

let processAAAA = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tAAAA\t' + data[i].ip + '\n';
    }
    return template.replace('{aaaa}', ret);
};

let processCNAME = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tCNAME\t' + data[i].alias + '\n';
    }
    return template.replace('{cname}', ret);
};

let processMX = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tMX\t' + data[i].preference + '\t' + data[i].host + '\n';
    }
    return template.replace('{mx}', ret);
};

let processPTR = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tPTR\t' + data[i].host + '\n';
    }
    return template.replace('{ptr}', ret);
};

let processTXT = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tTXT\t';
        const txtData = data[i].txt
        if (txtData instanceof String || typeof(txtData) === 'string') {
          ret += '"' + txtData + '"';
        } else if (txtData instanceof Array) {
          ret += txtData
            .map(
              function (datum) {
                return '"' + datum + '"';
              })
            .join(' ');
        }
        ret += '\n';
    }
    return template.replace('{txt}', ret);
};

let processSRV = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tSRV\t' + data[i].priority + '\t';
        ret += data[i].weight + '\t';
        ret += data[i].port + '\t';
        ret += data[i].target + '\n';
    }
    return template.replace('{srv}', ret);
};

let processSPF = function(data, template) {
    let ret = '';
    for (let i in data) {
        ret += (data[i].name || '@') + '\t';
        if (data[i].ttl) ret += data[i].ttl + '\t';
        ret += 'IN\tSPF\t' + data[i].data + '\n';
    }
    return template.replace('{spf}', ret);
};

let processURI = function(data, template) {
    let ret = '';
    for (let i in data) {
       ret += (data[i].name || '@') + '\t';
       if (data[i].ttl) ret += data[i].ttl + '\t';
       ret += 'IN\tURI\t' + data[i].priority + '\t';
       ret += data[i].weight + '\t';
       ret += '"' + data[i].target + '"\n';
    }
    return template.replace('{uri}', ret);
};

let processValues = function(jsonZoneFile, template) {
    template = template.replace('{zone}', jsonZoneFile['$origin'] || jsonZoneFile['soa']['name'] || '');
    template = template.replace('{datetime}', (new Date()).toISOString());
    return template.replace('{time}', Math.round(Date.now() / 1000));
};
