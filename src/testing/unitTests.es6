'use strict'

import test from 'tape'
import fs from 'fs'
import { makeZoneFile, parseZoneFile, ZoneFile } from '../index'

let zoneFileReferences = [{
  name: 'Forward',
  json: require('../../testData/zonefile_forward.json'),
  text: fs.readFileSync('./testData/zonefile_forward.txt', 'utf8')
}, {
  name: 'Forward 2',
  json: require('../../testData/zonefile_forward_2.json'),
  text: fs.readFileSync('./testData/zonefile_forward_2.txt', 'utf8')
}]

function testZoneFileToText(zoneFileReference) {
  test(zoneFileReference.name + ' testToText', (t) => {
    t.plan(1)

    let zoneFileText = makeZoneFile(zoneFileReference.json)
    t.equal(zoneFileText.split('\n')[0], zoneFileReference.text.split('\n')[0])
  })
}

function testZoneFileToJson(zoneFileReference) {
  test(zoneFileReference.name + ' testToJson', (t) => {
    t.plan(6)

    let zoneFileJson = parseZoneFile(zoneFileReference.text)
    t.equal(zoneFileJson['$origin'], zoneFileReference.json['$origin'])
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'])
    t.equal(zoneFileJson['soa']['refresh'], zoneFileReference.json['soa']['refresh'])
    t.equal(zoneFileJson['a'][0]['ip'], zoneFileReference.json['a'][0]['ip'])
    t.equal(zoneFileJson['mx'][0]['preference'], zoneFileReference.json['mx'][0]['preference'])
    t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'])
  })
}

function testZoneFileObjectFromJson(zoneFileReference) {
  test('zoneFileFromJson', function(t) {
    t.plan(6)

    let zoneFile = new ZoneFile(zoneFileReference.json)
    t.ok(zoneFile, 'ZoneFile object should have been created')

    let zoneFileJson = zoneFile.toJSON()
    t.ok(zoneFileJson, 'ZoneFile JSON should have been created')
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'], 'zone file TTL should match reference')
    t.equal(zoneFileJson['$domain'], zoneFileReference.json['$domain'], 'zone file domain should match reference')
    t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    let zoneFileString = zoneFile.toString()
    t.ok(zoneFileString, 'ZoneFile text should have been created')
    //t.equal(zoneFileString.toString().split('; NS Records')[1], zoneFileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  })
}

function testZoneFileObjectFromString(zoneFileReference) {
  test('zoneFileFromString', function(t) {
    t.plan(6)

    let zoneFile = new ZoneFile(zoneFileReference.text)
    t.ok(zoneFile, 'ZoneFile object should have been created')

    let zoneFileJson = zoneFile.toJSON()
    t.ok(zoneFileJson, 'ZoneFile JSON should have been created')
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'], 'zone file TTL should match reference')
    t.equal(zoneFileJson['$domain'], zoneFileReference.json['$domain'], 'zone file domain should match reference')
    t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    let zoneFileString = zoneFile.toString()
    t.ok(zoneFileString, 'ZoneFile text should have been created')
    //t.equal(zoneFileString.split('; NS Records')[1], zoneFileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  })
}

zoneFileReferences.forEach((zoneFileReference) => {
  testZoneFileToText(zoneFileReference)
  testZoneFileToJson(zoneFileReference)

  testZoneFileObjectFromJson(zoneFileReference)
  testZoneFileObjectFromString(zoneFileReference)
})

/*
let zoneFileReverseReferences = [{
  name: 'Reverse',
  json: require('./test/zonefile_reverse.json'),
  text: fs.readFileSync('./test/zonefile_reverse.txt', 'utf8')
}, {
  name: 'Reverse IP V6',
  json: require('./test/zonefile_reverse_ipv6.json'),
  text: fs.readFileSync('./test/zonefile_reverse_ipv6.txt', 'utf8')
}]

zoneFileReverseReferences.forEach((zoneFileReference) => {
  testZoneFileToText(zoneFileReference)
  testZoneFileToJson(zoneFileReference)
})
*/