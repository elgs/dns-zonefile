let fs = require('fs');
let zonefile = require('../lib/zonefile.js');

fdescribe('forward parser', () => {

   let parsed;
   beforeEach(() => {
      const text = fs.readFileSync(__dirname + '/zonefile_forward.txt', 'utf8');
      parsed = zonefile.parse(text);
   });

   it('should parse global info', () => {
      expect(parsed['$origin']).toBe('MYDOMAIN.COM.');
      expect(parsed['$ttl']).toBe('3600');
   });

   it('should parse soa records', () => {
      const records = parsed['soa'];
      expect(records?.['name']).toBe('@');
      expect(records?.['minimum']).toBe(86400);
      expect(records?.['expire']).toBe(604800);
      expect(records?.['retry']).toBe(600);
      expect(records?.['refresh']).toBe(3600);
      expect(records?.['serial']).toBe(1406291485);
      expect(records?.['rname']).toBe('HOSTMASTER.MYDOMAIN.COM.');
      expect(records?.['mname']).toBe('NS1.NAMESERVER.NET.');
   });

   it('should parse ns records', () => {
      const records = parsed['ns'];
      expect(records?.length).toBe(2);
      expect(records?.[0]?.['name']).toBe('@');
      expect(records?.[0]?.['host']).toBe('NS1.NAMESERVER.NET.');
      expect(records?.[1]?.['name']).toBe('@');
      expect(records?.[1]?.['host']).toBe('NS2.NAMESERVER.NET.');
   });

   it('should parse mx records', () => {
      const records = parsed['mx'];
      expect(records?.length).toBe(2);
      expect(records?.[0]?.['name']).toBe('@');
      expect(records?.[0]?.['preference']).toBe(0);
      expect(records?.[0]?.['host']).toBe('mail1');
      expect(records?.[1]?.['name']).toBe('@');
      expect(records?.[1]?.['preference']).toBe(10);
      expect(records?.[1]?.['host']).toBe('mail2');
   });

   it('should parse a records', () => {
      const records = parsed['a'];
      expect(records?.length).toBe(7);
      expect(records?.[0]?.['name']).toBe('@');
      expect(records?.[0]?.['ip']).toBe('2.2.2.2');
      expect(records?.[1]?.['name']).toBe('@');
      expect(records?.[1]?.['ip']).toBe('1.1.1.1');
      expect(records?.[2]?.['name']).toBe('@');
      expect(records?.[2]?.['ip']).toBe('127.0.0.1');
      expect(records?.[3]?.['name']).toBe('www');
      expect(records?.[3]?.['ip']).toBe('127.0.0.1');
      expect(records?.[4]?.['name']).toBe('mail');
      expect(records?.[4]?.['ip']).toBe('127.0.0.1');
      expect(records?.[5]?.['name']).toBe('mail');
      expect(records?.[5]?.['ip']).toBe('1.2.3.4');
      expect(records?.[6]?.['name']).toBe('tst');
      expect(records?.[6]?.['ip']).toBe('101.228.10.127');
      expect(records?.[6]?.['ttl']).toBe(300);
   });

   it('should parse aaaa records', () => {
      const records = parsed['aaaa'];
      expect(records?.length).toBe(3);
      expect(records?.[0]?.['name']).toBe('@');
      expect(records?.[0]?.['ip']).toBe('::1');
      expect(records?.[1]?.['name']).toBe('mail');
      expect(records?.[1]?.['ip']).toBe('2001:db8::1');
      expect(records?.[2]?.['name']).toBe('A');
      expect(records?.[2]?.['ip']).toBe('2001:db8::1');
      expect(records?.[2]?.['ttl']).toBe(200);
   });

   it('should parse cname records', () => {
      const records = parsed['cname'];
      expect(records?.length).toBe(4);
      expect(records?.[0]?.['name']).toBe('mail1');
      expect(records?.[0]?.['alias']).toBe('mail');
      expect(records?.[1]?.['name']).toBe('mail2');
      expect(records?.[1]?.['alias']).toBe('mail');
      expect(records?.[2]?.['name']).toBe('CNAME');
      expect(records?.[2]?.['alias']).toBe('CNAME');
      expect(records?.[3]?.['name']).toBe('CNAME');
      expect(records?.[3]?.['alias']).toBe('CNAME');
   });

   it('should parse caa records', () => {
      const records = parsed['caa'];
      expect(records?.length).toBe(3);
      expect(records?.[0]?.['name']).toBe('@');
      expect(records?.[0]?.['flags']).toBe(0);
      expect(records?.[0]?.['tag']).toBe('issue');
      expect(records?.[0]?.['value']).toBe('"ca.example.net; account=230123"');
      expect(records?.[1]?.['name']).toBe('@');
      expect(records?.[1]?.['flags']).toBe(0);
      expect(records?.[1]?.['tag']).toBe('iodef');
      expect(records?.[1]?.['value']).toBe('"mailto:security@example.com"');
      expect(records?.[2]?.['name']).toBe('@');
      expect(records?.[2]?.['flags']).toBe(0);
      expect(records?.[2]?.['tag']).toBe('iodef');
      expect(records?.[2]?.['value']).toBe('"http://iodef.example.com/"');
   });

   it('should parse txt records', () => {
      const records = parsed['txt'];
      expect(records?.length).toBe(4);
      expect(records?.[0]?.['name']).toBe('treefrog.ca.');
      expect(records?.[0]?.['txt']).toBe('"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" "sdfsadfdasf"');
      expect(records?.[1]?.['name']).toBe('treefrog.ca.');
      expect(records?.[1]?.['txt']).toBe('"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" sdfsadfdasf');
      expect(records?.[2]?.['name']).toBe('treemonkey.ca.');
      expect(records?.[2]?.['txt']).toBe('"v=DKIM1\\; k=rsa\\; p=MIGf..."');
      expect(records?.[3]?.['name']).toBe('treemonkey.ca.');
      expect(records?.[3]?.['txt']).toBe('"v=DKIM1\\; k=rsa\\; p=MIGf..."');
   });

   it('should parse spf records', () => {
      const records = parsed['spf'];
      expect(records?.length).toBe(4);
      expect(records?.[0]?.['name']).toBe('test');
      expect(records?.[0]?.['data']).toBe('"v=spf1" "mx:gcloud-node.com." "-all"');
      expect(records?.[1]?.['name']).toBe('test1');
      expect(records?.[1]?.['data']).toBe('"v=spf2" "mx:gcloud-node.com." "-all"');
      expect(records?.[2]?.['name']).toBe('test1');
      expect(records?.[2]?.['data']).toBe('"v=spf3" "mx:gcloud-node.com." "-all    " "aasdfsadfdsafdasf"');
      expect(records?.[3]?.['name']).toBe('test1');
      expect(records?.[3]?.['data']).toBe('"v=spf4" "mx:gcloud-node.com." "-all"');
   });

   it('should parse ds records', () => {
      const records = parsed['ds'];
      expect(records?.length).toBe(2);
      expect(records?.[0]?.['name']).toBe('secure.example.');
      expect(records?.[0]?.['key_tag']).toBe('tag=12345');
      expect(records?.[0]?.['algorithm']).toBe('alg=3');
      expect(records?.[0]?.['digest_type']).toBe('digest_type=1');
      expect(records?.[0]?.['digest']).toBe('<foofoo>');
      expect(records?.[1]?.['name']).toBe('secure.example.');
      expect(records?.[1]?.['key_tag']).toBe('tag=12345');
      expect(records?.[1]?.['algorithm']).toBe('alg=3');
      expect(records?.[1]?.['digest_type']).toBe('digest_type=1');
      expect(records?.[1]?.['digest']).toBe('"<foofoo>"');
   });

   it('should parse srv records', () => {
      const records = parsed['srv'];
      expect(records?.length).toBe(6);
      expect(records?.[0]?.['name']).toBe('_foobar._tcp');
      expect(records?.[0]?.['target']).toBe('old-slow-box.example.com.');
      expect(records?.[0]?.['priority']).toBe(0);
      expect(records?.[0]?.['weight']).toBe(1);
      expect(records?.[0]?.['port']).toBe(9);
      expect(records?.[0]?.['ttl']).toBe(200);

      expect(records?.[1]?.['name']).toBe('_foobar._tcp');
      expect(records?.[1]?.['target']).toBe('new-fast-box.example.com.');
      expect(records?.[1]?.['priority']).toBe(0);
      expect(records?.[1]?.['weight']).toBe(3);
      expect(records?.[1]?.['port']).toBe(9);

      expect(records?.[2]?.['name']).toBe('_foobar._tcp');
      expect(records?.[2]?.['target']).toBe('sysadmins-box.example.com.');
      expect(records?.[2]?.['priority']).toBe(1);
      expect(records?.[2]?.['weight']).toBe(0);
      expect(records?.[2]?.['port']).toBe(9);

      expect(records?.[3]?.['name']).toBe('_foobar._tcp');
      expect(records?.[3]?.['target']).toBe('server.example.com.');
      expect(records?.[3]?.['priority']).toBe(1);
      expect(records?.[3]?.['weight']).toBe(0);
      expect(records?.[3]?.['port']).toBe(9);

      expect(records?.[4]?.['name']).toBe('*._tcp');
      expect(records?.[4]?.['target']).toBe('.');
      expect(records?.[4]?.['priority']).toBe(0);
      expect(records?.[4]?.['weight']).toBe(0);
      expect(records?.[4]?.['port']).toBe(0);

      expect(records?.[5]?.['name']).toBe('*._udp');
      expect(records?.[5]?.['target']).toBe('.');
      expect(records?.[5]?.['priority']).toBe(0);
      expect(records?.[5]?.['weight']).toBe(0);
      expect(records?.[5]?.['port']).toBe(0);
   });
});



describe('generator', () => {
   it('should generate', () => {
      let options = require(__dirname + '/zonefile_forward.json');
      let output = zonefile.generate(options);
      console.log(output);
   });
});