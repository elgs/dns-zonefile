'use strict';

var _tape = require('tape');

var _tape2 = _interopRequireDefault(_tape);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var zoneFileReferences = [{
  name: 'Forward',
  json: require('../testData/zonefile_forward.json'),
  text: _fs2.default.readFileSync('./testData/zonefile_forward.txt', 'utf8')
}, {
  name: 'Forward 2',
  json: require('../testData/zonefile_forward_2.json'),
  text: _fs2.default.readFileSync('./testData/zonefile_forward_2.txt', 'utf8')
}];

function testZoneFileToText(zoneFileReference) {
  (0, _tape2.default)(zoneFileReference.name + ' testToText', function (t) {
    t.plan(1);

    var zoneFileText = _index2.default.generate(zoneFileReference.json);
    t.equal(zoneFileText.split('\n')[0], zoneFileReference.text.split('\n')[0]);
  });
}

function testZoneFileToJson(zoneFileReference) {
  (0, _tape2.default)(zoneFileReference.name + ' testToJson', function (t) {
    t.plan(6);

    var zoneFileJson = _index2.default.parse(zoneFileReference.text);
    t.equal(zoneFileJson['$origin'], zoneFileReference.json['$origin']);
    t.equal(zoneFileJson['$ttl'], zoneFileReference.json['$ttl']);
    t.equal(zoneFileJson['soa']['refresh'], zoneFileReference.json['soa']['refresh']);
    t.equal(zoneFileJson['a'][0]['ip'], zoneFileReference.json['a'][0]['ip']);
    t.equal(zoneFileJson['mx'][0]['preference'], zoneFileReference.json['mx'][0]['preference']);
    t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt']);
  });
}

zoneFileReferences.forEach(function (zoneFileReference) {
  testZoneFileToText(zoneFileReference);
  testZoneFileToJson(zoneFileReference);
});

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