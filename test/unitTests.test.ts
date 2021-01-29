import * as fs from 'fs';
import { makeZoneFile, parseZoneFile, ZoneFile } from '../src';
import { ZoneFileObject } from '../src/zoneFile';

type ZoneFileReference = { name: string; json: ZoneFileObject; text: string; records: string[] };
const zoneFileReferences: ZoneFileReference[] = [
  {
    name: 'Forward',
    json: require('../testData/zonefile_forward.json'),
    text: fs.readFileSync('./testData/zonefile_forward.txt', 'utf8'),
    records: ['soa', 'a', 'mx', 'txt'],
  },
  {
    name: 'Forward 2',
    json: require('../testData/zonefile_forward_2.json'),
    text: fs.readFileSync('./testData/zonefile_forward_2.txt', 'utf8'),
    records: ['soa', 'a', 'mx', 'txt'],
  },
  {
    name: 'Forward 3',
    json: require('../testData/zonefile_forward_3.json'),
    text: fs.readFileSync('./testData/zonefile_forward_3.txt', 'utf8'),
    records: ['uri'],
  },
  {
    name: 'Multitext',
    json: require('../testData/zonefile_forward_4.json'),
    text: fs.readFileSync('./testData/zonefile_reverse_multitxt.txt', 'utf8'),
    records: ['uri', 'txt'],
  },
  {
    name: 'blockstack-client CLI constructed zonefile',
    json: require('../testData/blockstack-cli-zonefile.json'),
    text: fs.readFileSync('./testData/blockstack-cli-zonefile.txt', 'utf8'),
    records: ['uri', 'txt'],
  },
  {
    name: 'onename transfer constructed zonefile',
    json: require('../testData/onename-transfer-zonefile.json'),
    text: fs.readFileSync('./testData/onename-transfer-zonefile.txt', 'utf8'),
    records: ['uri'],
  },
  {
    name: 'browser generated zonefile',
    json: require('../testData/browser-generated-zonefile.json'),
    text: fs.readFileSync('./testData/browser-generated-zonefile.txt', 'utf8'),
    records: ['uri'],
  },
];

function testZoneFileToText(zoneFileReference: ZoneFileReference) {
  test(zoneFileReference.name + ' testToText', () => {
    const zoneFileText = makeZoneFile(zoneFileReference.json);
    expect(zoneFileText.split('\n')[0]).toBe(zoneFileReference.text.split('\n')[0]);
  });
}

function testZoneFileToJson(zoneFileReference: ZoneFileReference) {
  test(zoneFileReference.name + ' testToJson', () => {
    const zoneFileJson = parseZoneFile(zoneFileReference.text);
    expect(zoneFileJson['$origin']).toBe(zoneFileReference.json['$origin']);
    expect(zoneFileJson['$ttl']).toBe(zoneFileReference.json['$ttl']);

    if (zoneFileReference.records.indexOf('soa') > -1) {
      expect(zoneFileJson['soa']?.['refresh']).toBe(zoneFileReference.json['soa']?.['refresh']);
    }
    if (zoneFileReference.records.indexOf('a') > -1) {
      expect(zoneFileJson['a']?.[0]['ip']).toBe(zoneFileReference.json['a']?.[0]['ip']);
    }
    if (zoneFileReference.records.indexOf('mx') > -1) {
      expect(zoneFileJson['mx']?.[0]['preference']).toBe(zoneFileReference.json['mx']?.[0]['preference']);
    }
    if (zoneFileReference.records.indexOf('txt') > -1) {
      expect(zoneFileJson['txt']?.[0]['txt']).toEqual(zoneFileReference.json['txt']?.[0]['txt']);
    }
    if (zoneFileReference.records.indexOf('uri') > -1) {
      expect(zoneFileJson['uri']?.[0]['target']).toBe(zoneFileReference.json['uri']?.[0]['target']);
    }
  });
}

function testZoneFileObjectFromJson(zoneFileReference: ZoneFileReference) {
  test('zoneFileFromJson', function() {
    const zoneFile = new ZoneFile(zoneFileReference.json);
    expect(zoneFile).toBeTruthy();

    const zoneFileJson = zoneFile.toJSON();
    expect(zoneFileJson).toBeTruthy();
    expect(zoneFileJson['$ttl']).toBe(zoneFileReference.json['$ttl']);
    expect(zoneFileJson['$domain']).toBe(zoneFileReference.json['$domain']);
    //t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    const zoneFileString = zoneFile.toString();
    expect(zoneFileString).toBeTruthy();
    //t.equal(zoneFileString.toString().split('; NS Records')[1], zoneFileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  });
}

function testZoneFileFromBlockstackJs() {
  test('test-zf-from-blockstack.js', function() {
    const zf = {
      $origin: 'sweet.potato.pie',
      $ttl: 3600,
      uri: [
        {
          name: '_http._tcp',
          priority: 10,
          weight: 1,
          target: 'https://potatos.com/hub/whatever',
        },
      ],
    };
    const zfTemplate = '{$origin}\n{$ttl}\n{uri}\n';
    expect(makeZoneFile(zf, zfTemplate)).toBe(
      '$ORIGIN sweet.potato.pie\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n'
    );
    expect(makeZoneFile(zf)).toBe(
      '$ORIGIN sweet.potato.pie\n$TTL 3600\n\n; SOA Record\n{name} {ttl}    IN  SOA {mname}{rname}(\n{serial} ;serial\n{refresh} ;refresh\n{retry} ;retry\n{expire} ;expire\n{minimum} ;minimum ttl\n)\n\n; NS Records\n\n; MX Records\n\n; A Records\n\n; AAAA Records\n\n; CNAME Records\n\n; PTR Records\n\n; TXT Records\n\n; SRV Records\n\n; SPF Records\n\n; URI Records\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n'
    );
  });
}

function testZoneFileMakingFromExtendedArray() {
  test('makeZoneFileExtendedArray', function() {
    // @ts-expect-error
    Array.prototype.fail = 1;
    try {
      expect(
        parseZoneFile(
          '$ORIGIN sweet.potato.pie\n$TTL 3600\n_http._tcp\tIN\tURI\t10\t1\t"https://potatos.com/hub/whatever"\n\n'
        )
      ).toBeTruthy();
    } catch (e) {
      throw new Error(`Error parsing zonefile when array.prototype is extended: ${e}`);
    } finally {
      // @ts-expect-error
      delete Array.prototype.fail;
    }
  });
}

function testZoneFileObjectFromString(zoneFileReference: ZoneFileReference) {
  test('zoneFileFromString', function() {
    const zoneFile = new ZoneFile(zoneFileReference.text);
    expect(zoneFile).toBeTruthy();

    const zoneFileJson = zoneFile.toJSON();
    expect(zoneFileJson).toBeTruthy();
    expect(zoneFileJson['$ttl']).toBe(zoneFileReference.json['$ttl']);
    expect(zoneFileJson['$domain']).toBe(zoneFileReference.json['$domain']);
    //t.equal(zoneFileJson['txt'][0]['txt'], zoneFileReference.json['txt'][0]['txt'], 'zone file TXT record should match reference')
    //t.equal(JSON.stringify(zoneFileJson), JSON.stringify(zoneFileJsonReference), 'ZoneFile JSON should match the reference')

    const zoneFileString = zoneFile.toString();
    expect(zoneFileString).toBeTruthy();
    //t.equal(zoneFileString.split('; NS Records')[1], zoneFileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  });
}

zoneFileReferences.forEach(zoneFileReference => {
  testZoneFileToText(zoneFileReference);
  testZoneFileToJson(zoneFileReference);

  testZoneFileObjectFromJson(zoneFileReference);
  testZoneFileObjectFromString(zoneFileReference);
});

testZoneFileFromBlockstackJs();
testZoneFileMakingFromExtendedArray();

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
