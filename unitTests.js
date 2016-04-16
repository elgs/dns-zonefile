'use strict'

let test = require('tape')
let fs = require('fs')
let zonefile = require('./lib/index')

let zoneFileReferences = [{
  name: 'Forward',
  json: require('./test/zonefile_forward.json'),
  text: fs.readFileSync('./test/zonefile_forward.txt', 'utf8')
}, {
  name: 'Forward 2',
  json: require('./test/zonefile_forward_2.json'),
  text: fs.readFileSync('./test/zonefile_forward_2.txt', 'utf8')
}]

function testZoneFileToText(zoneFileReference) {
  test(zoneFileReference.name + ' testToText', function(t) {
    t.plan(1)

    let zoneFileText = zonefile.generate(zoneFileReference.json)
    t.equal(zoneFileText.split('\n')[0], zoneFileReference.text.split('\n')[0])
  })
}

function testZoneFileToJson(zoneFileReference) {
  test(zoneFileReference.name + ' testToJson', function(t) {
    t.plan(6)

    let zoneFileJson = zonefile.parse(zoneFileReference.text)
    t.equal(zoneFileJson['$origin'], zoneFileReference.json['$origin'])
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl'])
    t.equal(zoneFileJson['soa']['refresh'], zoneFileReference.json['soa']['refresh'])
    t.equal(zoneFileJson['a'][0]['ip'], zoneFileReference.json['a'][0]['ip'])
    t.equal(zoneFileJson['mx'][0]['preference'], zoneFileReference.json['mx'][0]['preference'])
    t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'])
  })
}

zoneFileReferences.forEach((zoneFileReference) => {
  testZoneFileToText(zoneFileReference)
  testZoneFileToJson(zoneFileReference)
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