import zonefile, { parse, generate } from '../lib/zonefile.js';

const soa = {
   name: '@', mname: 'ns.example.', rname: 'hostmaster.example.',
   serial: 1, refresh: 3600, retry: 600, expire: 86400, minimum: 300
};
const roundTrip = data => zonefile.parse(zonefile.generate({ soa, ...data }));

describe('owner name inheritance', () => {
   it('should inherit the previous owner across record types', () => {
      const parsed = zonefile.parse('www IN A 192.0.2.1\n    IN AAAA 2001:db8::1\n');
      expect(parsed.aaaa).toEqual([{ name: 'www', ip: '2001:db8::1' }]);
   });

   it('should inherit the most recent owner when types interleave', () => {
      const parsed = zonefile.parse('old IN A 192.0.2.1\nnew IN TXT "hi"\n    IN A 192.0.2.2\n');
      expect(parsed.a).toEqual([{ name: 'old', ip: '192.0.2.1' }, { name: 'new', ip: '192.0.2.2' }]);
   });

   it('should inherit the owner of a record whose type is not supported', () => {
      const parsed = zonefile.parse('foo IN NAPTR 100 10 "u" "E2U+sip" "" .\n    IN A 192.0.2.1\n');
      expect(parsed.a).toEqual([{ name: 'foo', ip: '192.0.2.1' }]);
   });

   it('should default the owner to the apex when no record precedes', () => {
      expect(zonefile.parse('   IN A 192.0.2.1\n').a).toEqual([{ name: '@', ip: '192.0.2.1' }]);
   });

   it('should take the SOA owner from the owner column', () => {
      const parsed = zonefile.parse('example.com. IN SOA ns. hostmaster. 1 2 3 4 5\n    IN NS ns.\n');
      expect(parsed.soa.name).toBe('example.com.');
      expect(parsed.ns).toEqual([{ name: 'example.com.', host: 'ns.' }]);
   });
});

describe('record headers', () => {
   it('should accept the class before the TTL', () => {
      expect(zonefile.parse('www IN 300 A 192.0.2.1\n').a).toEqual([{ name: 'www', ttl: 300, ip: '192.0.2.1' }]);
   });

   it('should accept the TTL before the class', () => {
      expect(zonefile.parse('www 300 IN A 192.0.2.1\n').a).toEqual([{ name: 'www', ttl: 300, ip: '192.0.2.1' }]);
   });

   it('should accept class and type mnemonics in any case', () => {
      expect(zonefile.parse('www in a 192.0.2.1\n').a).toEqual([{ name: 'www', ip: '192.0.2.1' }]);
      expect(zonefile.parse('www IN Aaaa 2001:db8::1\n').aaaa).toEqual([{ name: 'www', ip: '2001:db8::1' }]);
      expect(zonefile.parse('@ in soa ns. hostmaster. 1 2 3 4 5\n').soa.serial).toBe(1);
   });

   it('should preserve the case of owner names and RDATA', () => {
      expect(zonefile.parse('WwW in cname Target.Example.\n').cname).toEqual([{ name: 'WwW', alias: 'Target.Example.' }]);
   });

   it('should accept directives in any case', () => {
      const parsed = zonefile.parse('$origin example.com.\n$ttl 60\n1 PTR host.\n');
      expect(parsed.$origin).toBe('example.com.');
      expect(parsed.$ttl).toBe('60');
      expect(parsed.ptr).toEqual([{ name: '1', fullname: '1.example.com.', host: 'host.' }]);
   });
});

describe('DS records', () => {
   it('should keep all fields when the digest is split across whitespace', () => {
      const half = 'ABCDEFABCDEFABCDEFABCDEFABCDEFABCD';
      expect(zonefile.parse(`child IN DS 12345 13 2 ( ${half}\n ${half} )\n`).ds).toEqual([
         { name: 'child', key_tag: '12345', algorithm: '13', digest_type: '2', digest: half + half }
      ]);
   });
});

describe('escapes, quotes and comments', () => {
   it('should keep a semicolon after an escaped quote inside a quoted string', () => {
      const txt = String.raw`"a\";b"`;
      expect(zonefile.parse(`foo IN TXT ${txt}\n`).txt).toEqual([{ name: 'foo', txt }]);
   });

   it('should keep a quoted semicolon', () => {
      expect(zonefile.parse('foo TXT "a;b" ; comment\n').txt).toEqual([{ name: 'foo', txt: '"a;b"' }]);
   });

   it('should keep an escaped space inside an owner name', () => {
      const name = String.raw`foo\ bar`;
      expect(zonefile.parse(`${name} IN A 192.0.2.1\n`).a).toEqual([{ name, ip: '192.0.2.1' }]);
   });

   it('should keep an escaped semicolon outside quotes', () => {
      const txt = String.raw`a\;b`;
      expect(zonefile.parse(`foo IN TXT ${txt} ; comment\n`).txt).toEqual([{ name: 'foo', txt }]);
   });

   it('should start a comment after an escaped backslash', () => {
      const txt = String.raw`abc\\`;
      expect(zonefile.parse(`foo IN TXT ${txt}; comment\n`).txt).toEqual([{ name: 'foo', txt }]);
   });

   it('should treat escaped parentheses and quotes as literal', () => {
      const txt = String.raw`\( \" \)`;
      expect(zonefile.parse(`foo TXT ${txt}\n`).txt).toEqual([{ name: 'foo', txt }]);
   });

   it('should keep a quoted string that spans lines, and the record after it', () => {
      const parsed = zonefile.parse('foo TXT ( "hello\r\n(world)" )\r\nbar A 192.0.2.1\r\n');
      expect(parsed.txt).toEqual([{ name: 'foo', txt: '"hello\r\n(world)"' }]);
      expect(parsed.a).toEqual([{ name: 'bar', ip: '192.0.2.1' }]);
      expect(zonefile.parse(zonefile.generate(parsed))).toEqual(parsed);
   });

   it('should not start a comment inside a quoted string that spans lines', () => {
      const parsed = zonefile.parse('foo TXT "a\n; b"\nbar A 192.0.2.1\n');
      expect(parsed.txt).toEqual([{ name: 'foo', txt: '"a\n; b"' }]);
      expect(parsed.a).toEqual([{ name: 'bar', ip: '192.0.2.1' }]);
   });

   it('should ignore quotes and escapes inside a comment', () => {
      const parsed = zonefile.parse('foo A 192.0.2.1 ; it\'s "quoted" \\\nbar A 192.0.2.2\n');
      expect(parsed.a).toEqual([{ name: 'foo', ip: '192.0.2.1' }, { name: 'bar', ip: '192.0.2.2' }]);
   });

   it('should end a comment at the end of the input', () => {
      expect(zonefile.parse('foo A 192.0.2.1 ; comment').a).toEqual([{ name: 'foo', ip: '192.0.2.1' }]);
   });
});

describe('TTL handling', () => {
   it('should write out a record TTL of zero', () => {
      const parsed = roundTrip({ $ttl: 3600, a: [{ name: 'www', ttl: 0, ip: '192.0.2.1' }] });
      expect(parsed.a).toEqual([{ name: 'www', ttl: 0, ip: '192.0.2.1' }]);
   });

   it('should write out an SOA TTL of zero', () => {
      expect(roundTrip({ $ttl: 3600, soa: { ...soa, ttl: 0 } }).soa.ttl).toBe(0);
   });

   it('should keep the effective TTL of records read under a later $TTL', () => {
      const parsed = zonefile.parse('$TTL 60\na IN A 192.0.2.1\n$TTL 300\nb IN A 192.0.2.2\n');
      expect(parsed.$ttl).toBe('60');
      expect(parsed.a).toEqual([{ name: 'a', ip: '192.0.2.1' }, { name: 'b', ip: '192.0.2.2', ttl: 300 }]);
      expect(zonefile.parse(zonefile.generate(parsed))).toEqual(parsed);
   });

   it('should not pin TTLs when $TTL is repeated with the same value', () => {
      const parsed = zonefile.parse('$TTL 60\na IN A 192.0.2.1\n$TTL 60\nb IN A 192.0.2.2\n');
      expect(parsed.a).toEqual([{ name: 'a', ip: '192.0.2.1' }, { name: 'b', ip: '192.0.2.2' }]);
   });

   it('should keep the effective TTL of records read under a later $TTL given with units', () => {
      const parsed = zonefile.parse('$TTL 60\na IN A 192.0.2.1\n$TTL 1h\nb IN A 192.0.2.2\n');
      expect(parsed.$ttl).toBe('60');
      expect(parsed.a).toEqual([{ name: 'a', ip: '192.0.2.1' }, { name: 'b', ip: '192.0.2.2', ttl: 3600 }]);
      expect(zonefile.parse(zonefile.generate(parsed))).toEqual(parsed);
   });

   it('should not pin TTLs when $TTL is repeated with the same value in other units', () => {
      const parsed = zonefile.parse('$TTL 1h\na IN A 192.0.2.1\n$TTL 3600\nb IN A 192.0.2.2\n');
      expect(parsed.$ttl).toBe('1h');
      expect(parsed.a).toEqual([{ name: 'a', ip: '192.0.2.1' }, { name: 'b', ip: '192.0.2.2' }]);
   });

   it('should read record TTLs given with units', () => {
      expect(zonefile.parse('www 1h30m IN A 192.0.2.1\n').a).toEqual([{ name: 'www', ttl: 5400, ip: '192.0.2.1' }]);
      expect(zonefile.parse('www IN 2D A 192.0.2.1\n').a).toEqual([{ name: 'www', ttl: 172800, ip: '192.0.2.1' }]);
      expect(zonefile.parse('   1w AAAA 2001:db8::1\n').aaaa).toEqual([{ name: '@', ttl: 604800, ip: '2001:db8::1' }]);
   });
});

describe('template rendering', () => {
   it('should insert record data literally', () => {
      expect(roundTrip({ txt: [{ name: 'foo', txt: '"$&"' }] }).txt[0].txt).toBe('"$&"');
      expect(roundTrip({ txt: [{ name: 'foo', txt: '"{srv}"' }] }).txt[0].txt).toBe('"{srv}"');
      expect(roundTrip({ txt: [{ name: 'foo', txt: '"{datetime}"' }] }).txt[0].txt).toBe('"{datetime}"');
   });

   it('should still substitute {time} in the SOA serial', () => {
      const before = Math.floor(Date.now() / 1000);
      const serial = roundTrip({ soa: { ...soa, serial: '{time}' } }).soa.serial;
      expect(serial).toBeGreaterThanOrEqual(before);
      expect(serial).toBeLessThanOrEqual(Math.ceil(Date.now() / 1000));
   });

   it('should generate a fragment without an SOA record', () => {
      const text = zonefile.generate({ a: [{ name: 'www', ip: '192.0.2.1' }] });
      expect(text).not.toContain('SOA');
      const parsed = zonefile.parse(text);
      expect(parsed.soa).toBeUndefined();
      expect(parsed.a).toEqual([{ name: 'www', ip: '192.0.2.1' }]);
   });

   it('should render SOA fields in a custom template', () => {
      expect(zonefile.generate({ soa }, '{name}{mname}')).toBe('@\tns.example.\t');
   });

   it('should leave unknown placeholders of a custom template alone', () => {
      expect(zonefile.generate({ a: [{ name: 'www', ip: '192.0.2.1' }] }, '{a}{unknown}')).toBe('www\tIN\tA\t192.0.2.1\n{unknown}');
   });

   it('should keep consecutive line breaks inside record data', () => {
      const txt = '"a\n\n\nb"';
      const parsed = zonefile.parse(`foo TXT ${txt}\nbar A 192.0.2.1\n`);
      expect(parsed.txt).toEqual([{ name: 'foo', txt }]);
      expect(zonefile.parse(zonefile.generate(parsed))).toEqual(parsed);
   });

   it('should collapse blank lines of the template but not those of inserted data', () => {
      const a = [{ name: 'www', ip: '192.0.2.1' }];
      expect(zonefile.generate({ a }, '{a}\n\n\n\n{a}')).toBe('www\tIN\tA\t192.0.2.1\n\nwww\tIN\tA\t192.0.2.1\n');
      expect(zonefile.generate({ a }, 'x\n\n\n\ny')).toBe('x\n\ny');
      expect(zonefile.generate({ a })).not.toMatch(/\n{3}/);
   });
});

describe('PTR fullname', () => {
   it('should keep absolute owner names', () => {
      const name = '1.2.0.192.in-addr.arpa.';
      expect(zonefile.parse(`$ORIGIN 2.0.192.in-addr.arpa.\n${name} IN PTR host.example.\n`).ptr[0].fullname).toBe(name);
   });

   it('should resolve @ to the origin', () => {
      const origin = '2.0.192.in-addr.arpa.';
      expect(zonefile.parse(`$ORIGIN ${origin}\n@ IN PTR host.example.\n`).ptr[0].fullname).toBe(origin);
   });

   it('should append the origin to relative owner names', () => {
      expect(zonefile.parse('$ORIGIN 2.0.192.in-addr.arpa.\n1 IN PTR host.example.\n').ptr[0].fullname).toBe('1.2.0.192.in-addr.arpa.');
   });

   it('should leave the name alone when no origin is known', () => {
      expect(zonefile.parse('1 IN PTR host.example.\n').ptr[0].fullname).toBe('1');
   });

   it('should keep a numeric zero owner', () => {
      expect(roundTrip({ $origin: '2.0.192.in-addr.arpa.', ptr: [{ name: 0, host: 'host.example.' }] }).ptr[0].name).toBe('0');
   });

   it('should treat an escaped final dot as part of the owner name', () => {
      const name = String.raw`foo\.`;
      expect(zonefile.parse(`$ORIGIN example.\n${name} IN PTR host.example.\n`).ptr[0].fullname).toBe(name + '.example.');
   });

   it('should keep an owner name ending in an escaped backslash and a dot absolute', () => {
      const name = String.raw`foo\\.`;
      expect(zonefile.parse(`$ORIGIN example.\n${name} IN PTR host.example.\n`).ptr[0].fullname).toBe(name);
   });
});

describe('module exports', () => {
   it('should expose parse and generate as named and default exports', () => {
      expect(parse).toBe(zonefile.parse);
      expect(generate).toBe(zonefile.generate);
      expect(typeof parse).toBe('function');
      expect(typeof generate).toBe('function');
   });
});
