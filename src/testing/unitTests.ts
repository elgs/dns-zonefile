'use strict'

import test from 'tape'
import fs from 'fs'
import { makeZoneFile, parseZoneFile, ZoneFile } from '../index'

const zoneFileReferences = [{
  name: 'Forward',
  json: require('../../testData/zonefile_forward.json'),
  text: fs.readFileSync('./testData/zonefile_forward.txt', 'utf8'),
  records: ['soa', 'a', 'mx', 'txt']
}, {
  name: 'Forward 2',
  json: require('../../testData/zonefile_forward_2.json'),
  text: fs.readFileSync('./testData/zonefile_forward_2.txt', 'utf8'),
  records: ['soa', 'a', 'mx', 'txt']
}, {
  name: 'Forward 3',
  json: require('../../testData/zonefile_forward_3.json'),
  text: fs.readFileSync('./testData/zonefile_forward_3.txt', 'utf8'),
  records: ['uri']
}, {
  name: 'Multitext',
  json: require('../../testData/zonefile_forward_4.json'),
  text: fs.readFileSync('./testData/zonefile_reverse_multitxt.txt', 'utf8'),
  records: ['uri', 'txt']
},
                            {
                              name: 'blockstack-client CLI constructed zonefile',
                              json: require('../../testData/blockstack-cli-zonefile.json'),
                              text: fs.readFileSync('./testData/blockstack-cli-zonefile.txt', 'utf8'),
                              records: ['uri', 'txt']
                            },
                            {
                              name: 'onename transfer constructed zonefile',
                              json: require('../../testData/onename-transfer-zonefile.json'),
                              text: fs.readFileSync('./testData/onename-transfer-zonefile.txt', 'utf8'),
                              records: ['uri']
                            },
                            {
                              name: 'browser generated zonefile',
                              json: require('../../testData/browser-generated-zonefile.json'),
                              text: fs.readFileSync('./testData/browser-generated-zonefile.txt', 'utf8'),
                              records: ['uri']
                            }
]

function testZoneFileToText(zoneFileReference) {
  test(zoneFileReference.name + ' testToText', (t) => {
    t.plan(1)

    const zoneFileText = makeZoneFile(zoneFileReference.json)
    t.equal(zoneFileText.split('\n')[0], zoneFileReference.text.split('\n')[0])
  })
}

function testZoneFileToJson(zoneFileReference) {
  test(zoneFileReference.name + ' testToJson', (t) => {
    const numberOfTests = 2 + zoneFileReference.records.length
    t.plan(numberOfTests)

    const zoneFileJson = parseZoneFile(zoneFileReference.text)
    t.equal(zoneFileJson['$origin'], zoneFileReference.json['$origin'])
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'])

    if (zoneFileReference.records.indexOf('soa') > -1) {
      t.equal(zoneFileJson['soa']['refresh'], zoneFileReference.json['soa']['refresh'])
    }
    if (zoneFileReference.records.indexOf('a') > -1) {
      t.equal(zoneFileJson['a'][0]['ip'], zoneFileReference.json['a'][0]['ip'])
    }
    if (zoneFileReference.records.indexOf('mx') > -1) {
      t.equal(zoneFileJson['mx'][0]['preference'], zoneFileReference.json['mx'][0]['preference'])
    }
    if (zoneFileReference.records.indexOf('txt') > -1) {
      t.deepEqual(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'])
    }
    if (zoneFileReference.records.indexOf('uri') > -1) {
      t.equal(zoneFileJson['uri'][0]['target'], zoneFileReference.json['uri'][0]['target'])
    }
  })
}

function testZoneFileObjectFromJson(zoneFileReference) {
  test('zoneFileFromJson', function(t) {
    t.plan(5)

    const zoneFile = new ZoneFile(zoneFileReference.json)
    t.ok(zoneFile, 'ZoneFile object should have been created')

    const zoneFileJson = zoneFile.toJSON()
    t.ok(zoneFileJson, 'ZoneFile JSON should have been created')
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'], 'zone file TTL should match reference')
    t.equal(zoneFileJson['$domain'], zoneFileReference.json['$domain'], 'zone file domain should match reference')
    //t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    const zoneFileString = zoneFile.toString()
    t.ok(zoneFileString, 'ZoneFile text should have been created')
    //t.equal(zoneFileString.toString().split('; NS Records')[1], zoneFileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  })
}

function testZoneFileFromBlockstackJs() {
  test('test-zf-from-blockstack.js', function(t) {
    t.plan(2)
    const zf = {
      $origin: 'sweet.potato.pie',
      $ttl: 3600,
      uri: [
        {
          name: '_http._tcp',
          priority: 10,
          weight: 1,
          target: 'https://potatos.com/hub/whatever'
        }
      ]
    }
    const zfTemplate = '{$origin}\n{$ttl}\n{uri}\n'
    t.equal(makeZoneFile(zf, zfTemplate),
            '$ORIGIN sweet.potato.pie\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n')
    t.equal(makeZoneFile(zf),
            '$ORIGIN sweet.potato.pie\n$TTL 3600\n\n; SOA Record\n{name} {ttl}    IN  SOA {mname}{rname}(\n{serial} ;serial\n{refresh} ;refresh\n{retry} ;retry\n{expire} ;expire\n{minimum} ;minimum ttl\n)\n\n; NS Records\n\n; MX Records\n\n; A Records\n\n; AAAA Records\n\n; CNAME Records\n\n; PTR Records\n\n; TXT Records\n\n; SRV Records\n\n; SPF Records\n\n; URI Records\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n')
  })
}

function testZoneFileMakingFromExtendedArray() {
  test('makeZoneFileExtendedArray', function (t) {
    t.plan(1)
    Array.prototype.fail = 1
    try {
      t.ok(parseZoneFile('$ORIGIN sweet.potato.pie\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n'))
    } catch (e) {
      t.fail(`Error parsing zonefile when array.prototype is extended: ${e}`)
    } finally {
      delete Array.prototype.fail
    }
  })
}

function testZoneFileObjectFromString(zoneFileReference) {
  test('zoneFileFromString', function(t) {
    t.plan(5)

    const zoneFile = new ZoneFile(zoneFileReference.text)
    t.ok(zoneFile, 'ZoneFile object should have been created')

    const zoneFileJson = zoneFile.toJSON()
    t.ok(zoneFileJson, 'ZoneFile JSON should have been created')
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'], 'zone file TTL should match reference')
    t.equal(zoneFileJson['$domain'], zoneFileReference.json['$domain'], 'zone file domain should match reference')
    //t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    const zoneFileString = zoneFile.toString()
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

testZoneFileFromBlockstackJs()
testZoneFileMakingFromExtendedArray()

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
