const fs = require('fs');
const zonefile = require('../lib/zonefile.js');
const deepEqual = require('deep-equal');

/////////////////////////////////////////////////////////////////////////////////
//                  _______                                                    //
//     __          /       \                                                   //
//    /  |         $$$$$$$  | ______    ______    _______   ______    ______   //
//  __$$ |__       $$ |__$$ |/      \  /      \  /       | /      \  /      \  //
// /  $$    |      $$    $$/ $$$$$$  |/$$$$$$  |/$$$$$$$/ /$$$$$$  |/$$$$$$  | //
// $$$$$$$$/       $$$$$$$/  /    $$ |$$ |  $$/ $$      \ $$    $$ |$$ |  $$/  //
//    $$ |         $$ |     /$$$$$$$ |$$ |       $$$$$$  |$$$$$$$$/ $$ |       //
//    $$/          $$ |     $$    $$ |$$ |      /     $$/ $$       |$$ |       //
//                 $$/       $$$$$$$/ $$/       $$$$$$$/   $$$$$$$/ $$/        //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
describe('forward parser', () => {
   let parsed;
   beforeEach(() => {
      const text = fs.readFileSync(__dirname + '/zonefile_forward.txt', 'utf8');
      parsed = zonefile.parse(text);
   });

   it('should parse global info', () => {
      expect(parsed['$origin']).toEqual('MYDOMAIN.COM.');
      expect(parsed['$ttl']).toEqual('3600');
   });

   it('should parse soa records', () => {
      const records = parsed['soa'];
      expect(records?.['name']).toEqual('@');
      expect(records?.['minimum']).toEqual(86400);
      expect(records?.['expire']).toEqual(604800);
      expect(records?.['retry']).toEqual(600);
      expect(records?.['refresh']).toEqual(3600);
      expect(records?.['serial']).toEqual(1406291485);
      expect(records?.['rname']).toEqual('HOSTMASTER.MYDOMAIN.COM.');
      expect(records?.['mname']).toEqual('NS1.NAMESERVER.NET.');
   });

   it('should parse ns records', () => {
      const records = parsed['ns'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['host']).toEqual('NS1.NAMESERVER.NET.');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['host']).toEqual('NS2.NAMESERVER.NET.');
   });

   it('should parse mx records', () => {
      const records = parsed['mx'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['preference']).toEqual(0);
      expect(records?.[0]?.['host']).toEqual('mail1');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['preference']).toEqual(10);
      expect(records?.[1]?.['host']).toEqual('mail2');
   });

   it('should parse a records', () => {
      const records = parsed['a'];
      expect(records?.length).toEqual(7);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['ip']).toEqual('2.2.2.2');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['ip']).toEqual('1.1.1.1');
      expect(records?.[2]?.['name']).toEqual('@');
      expect(records?.[2]?.['ip']).toEqual('127.0.0.1');
      expect(records?.[3]?.['name']).toEqual('www');
      expect(records?.[3]?.['ip']).toEqual('127.0.0.1');
      expect(records?.[4]?.['name']).toEqual('mail');
      expect(records?.[4]?.['ip']).toEqual('127.0.0.1');
      expect(records?.[5]?.['name']).toEqual('mail');
      expect(records?.[5]?.['ip']).toEqual('1.2.3.4');
      expect(records?.[6]?.['name']).toEqual('tst');
      expect(records?.[6]?.['ip']).toEqual('101.228.10.127');
      expect(records?.[6]?.['ttl']).toEqual(300);
   });

   it('should parse aaaa records', () => {
      const records = parsed['aaaa'];
      expect(records?.length).toEqual(3);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['ip']).toEqual('::1');
      expect(records?.[1]?.['name']).toEqual('mail');
      expect(records?.[1]?.['ip']).toEqual('2001:db8::1');
      expect(records?.[2]?.['name']).toEqual('A');
      expect(records?.[2]?.['ip']).toEqual('2001:db8::1');
      expect(records?.[2]?.['ttl']).toEqual(200);
   });

   it('should parse cname records', () => {
      const records = parsed['cname'];
      expect(records?.length).toEqual(4);
      expect(records?.[0]?.['name']).toEqual('mail1');
      expect(records?.[0]?.['alias']).toEqual('mail');
      expect(records?.[1]?.['name']).toEqual('mail2');
      expect(records?.[1]?.['alias']).toEqual('mail');
      expect(records?.[2]?.['name']).toEqual('CNAME');
      expect(records?.[2]?.['alias']).toEqual('CNAME');
      expect(records?.[3]?.['name']).toEqual('CNAME');
      expect(records?.[3]?.['alias']).toEqual('CNAME');
   });

   it('should parse caa records', () => {
      const records = parsed['caa'];
      expect(records?.length).toEqual(3);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['flags']).toEqual(0);
      expect(records?.[0]?.['tag']).toEqual('issue');
      expect(records?.[0]?.['value']).toEqual('"ca.example.net; account=230123"');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['flags']).toEqual(0);
      expect(records?.[1]?.['tag']).toEqual('iodef');
      expect(records?.[1]?.['value']).toEqual('"mailto:security@example.com"');
      expect(records?.[2]?.['name']).toEqual('@');
      expect(records?.[2]?.['flags']).toEqual(0);
      expect(records?.[2]?.['tag']).toEqual('iodef');
      expect(records?.[2]?.['value']).toEqual('"http://iodef.example.com/"');
   });

   it('should parse txt records', () => {
      const records = parsed['txt'];
      expect(records?.length).toEqual(4);
      expect(records?.[0]?.['name']).toEqual('treefrog.ca.');
      expect(records?.[0]?.['txt']).toEqual('"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" "sdfsadfdasf"');
      expect(records?.[1]?.['name']).toEqual('treefrog.ca.');
      expect(records?.[1]?.['txt']).toEqual('"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" sdfsadfdasf');
      expect(records?.[2]?.['name']).toEqual('treemonkey.ca.');
      expect(records?.[2]?.['txt']).toEqual('"v=DKIM1\\; k=rsa\\; p=MIGf..."');
      expect(records?.[3]?.['name']).toEqual('treemonkey.ca.');
      expect(records?.[3]?.['txt']).toEqual('"v=DKIM1\\; k=rsa\\; p=MIGf..."');
   });

   it('should parse spf records', () => {
      const records = parsed['spf'];
      expect(records?.length).toEqual(4);
      expect(records?.[0]?.['name']).toEqual('test');
      expect(records?.[0]?.['data']).toEqual('"v=spf1" "mx:gcloud-node.com." "-all"');
      expect(records?.[1]?.['name']).toEqual('test1');
      expect(records?.[1]?.['data']).toEqual('"v=spf2" "mx:gcloud-node.com." "-all"');
      expect(records?.[2]?.['name']).toEqual('test1');
      expect(records?.[2]?.['data']).toEqual('"v=spf3" "mx:gcloud-node.com." "-all    " "aasdfsadfdsafdasf"');
      expect(records?.[3]?.['name']).toEqual('test1');
      expect(records?.[3]?.['data']).toEqual('"v=spf4" "mx:gcloud-node.com." "-all"');
   });

   it('should parse ds records', () => {
      const records = parsed['ds'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('secure.example.');
      expect(records?.[0]?.['key_tag']).toEqual('tag=12345');
      expect(records?.[0]?.['algorithm']).toEqual('alg=3');
      expect(records?.[0]?.['digest_type']).toEqual('digest_type=1');
      expect(records?.[0]?.['digest']).toEqual('<foofoo>');
      expect(records?.[1]?.['name']).toEqual('secure.example.');
      expect(records?.[1]?.['key_tag']).toEqual('tag=12345');
      expect(records?.[1]?.['algorithm']).toEqual('alg=3');
      expect(records?.[1]?.['digest_type']).toEqual('digest_type=1');
      expect(records?.[1]?.['digest']).toEqual('"<foofoo>"');
   });

   it('should parse srv records', () => {
      const records = parsed['srv'];
      expect(records?.length).toEqual(6);
      expect(records?.[0]?.['name']).toEqual('_foobar._tcp');
      expect(records?.[0]?.['target']).toEqual('old-slow-box.example.com.');
      expect(records?.[0]?.['priority']).toEqual(0);
      expect(records?.[0]?.['weight']).toEqual(1);
      expect(records?.[0]?.['port']).toEqual(9);
      expect(records?.[0]?.['ttl']).toEqual(200);

      expect(records?.[1]?.['name']).toEqual('_foobar._tcp');
      expect(records?.[1]?.['target']).toEqual('new-fast-box.example.com.');
      expect(records?.[1]?.['priority']).toEqual(0);
      expect(records?.[1]?.['weight']).toEqual(3);
      expect(records?.[1]?.['port']).toEqual(9);

      expect(records?.[2]?.['name']).toEqual('_foobar._tcp');
      expect(records?.[2]?.['target']).toEqual('sysadmins-box.example.com.');
      expect(records?.[2]?.['priority']).toEqual(1);
      expect(records?.[2]?.['weight']).toEqual(0);
      expect(records?.[2]?.['port']).toEqual(9);

      expect(records?.[3]?.['name']).toEqual('_foobar._tcp');
      expect(records?.[3]?.['target']).toEqual('server.example.com.');
      expect(records?.[3]?.['priority']).toEqual(1);
      expect(records?.[3]?.['weight']).toEqual(0);
      expect(records?.[3]?.['port']).toEqual(9);

      expect(records?.[4]?.['name']).toEqual('*._tcp');
      expect(records?.[4]?.['target']).toEqual('.');
      expect(records?.[4]?.['priority']).toEqual(0);
      expect(records?.[4]?.['weight']).toEqual(0);
      expect(records?.[4]?.['port']).toEqual(0);

      expect(records?.[5]?.['name']).toEqual('*._udp');
      expect(records?.[5]?.['target']).toEqual('.');
      expect(records?.[5]?.['priority']).toEqual(0);
      expect(records?.[5]?.['weight']).toEqual(0);
      expect(records?.[5]?.['port']).toEqual(0);
   });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                   ______                                                      __                          //
//     __           /      \                                                    /  |                         //
//    /  |         /$$$$$$  |  ______   _______    ______    ______   ______   _$$ |_     ______    ______   //
//  __$$ |__       $$ | _$$/  /      \ /       \  /      \  /      \ /      \ / $$   |   /      \  /      \  //
// /  $$    |      $$ |/    |/$$$$$$  |$$$$$$$  |/$$$$$$  |/$$$$$$  |$$$$$$  |$$$$$$/   /$$$$$$  |/$$$$$$  | //
// $$$$$$$$/       $$ |$$$$ |$$    $$ |$$ |  $$ |$$    $$ |$$ |  $$/ /    $$ |  $$ | __ $$ |  $$ |$$ |  $$/  //
//    $$ |         $$ \__$$ |$$$$$$$$/ $$ |  $$ |$$$$$$$$/ $$ |     /$$$$$$$ |  $$ |/  |$$ \__$$ |$$ |       //
//    $$/          $$    $$/ $$       |$$ |  $$ |$$       |$$ |     $$    $$ |  $$  $$/ $$    $$/ $$ |       //
//                  $$$$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/ $$/       $$$$$$$/    $$$$/   $$$$$$/  $$/        //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('forward generator', () => {
   let generated;
   let lines;
   beforeEach(() => {
      const json = require(__dirname + '/zonefile_forward.json');
      generated = zonefile.generate(json);
      lines = generated.split('\n');
   });

   it('should generate global info', () => {
      expect(lines.includes('$ORIGIN MYDOMAIN.COM.')).toBeTrue();
      expect(lines.includes('$TTL 3600')).toBeTrue();
   });

   it('should generate soa records', () => {
      const records = `
      @	 		IN	SOA	NS1.NAMESERVER.NET.	HOSTMASTER.MYDOMAIN.COM.	(
      1406291485	 ;serial
      3600	 ;refresh
      600	 ;retry
      604800	 ;expire
      86400	 ;minimum ttl`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ns records', () => {
      const records = `
      @	IN	NS	NS1.NAMESERVER.NET.
      @	IN	NS	NS2.NAMESERVER.NET.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate mx records', () => {
      const records = `
      @	IN	MX	0	mail1
      @	IN	MX	10	mail2`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate a records', () => {
      const records = `
      @	IN	A	2.2.2.2
      @	IN	A	1.1.1.1
      @	IN	A	127.0.0.1
      www	IN	A	127.0.0.1
      mail	IN	A	127.0.0.1
      mail	IN	A	1.2.3.4
      tst	300	IN	A	101.228.10.127`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate aaaa records', () => {
      const records = ``;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate  records', () => {
      const records = `
      @	IN	AAAA	::1
      mail	IN	AAAA	2001:db8::1
      A	200	IN	AAAA	2001:db8::1`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate cname records', () => {
      const records = `
      mail1	IN	CNAME	mail
      mail2	IN	CNAME	mail
      CNAME	IN	CNAME	CNAME
      CNAME	IN	CNAME	CNAME`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate txt records', () => {
      const records = `
      treefrog.ca.	IN	TXT	"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" "sdfsadfdasf"
      treefrog.ca.	IN	TXT	"v=spf1 a mx a:mail.treefrog.ca a:webmail.treefrog.ca ip4:76.75.250.33 ?all" "asdfsdaf" sdfsadfdasf
      treemonkey.ca.	IN	TXT	"v=DKIM1\\; k=rsa\\; p=MIGf..."
      treemonkey.ca.	IN	TXT	"v=DKIM1\\; k=rsa\\; p=MIGf..."`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate srv records', () => {
      const records = `
      _foobar._tcp	200	IN	SRV	0	1	9	old-slow-box.example.com.
      _foobar._tcp	IN	SRV	0	3	9	new-fast-box.example.com.
      _foobar._tcp	IN	SRV	1	0	9	sysadmins-box.example.com.
      _foobar._tcp	IN	SRV	1	0	9	server.example.com.
      *._tcp	IN	SRV	0	0	0	.
      *._udp	IN	SRV	0	0	0	.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate spf records', () => {
      const records = `
      test	IN	SPF	"v=spf1" "mx:gcloud-node.com." "-all"
      test1	IN	SPF	"v=spf2" "mx:gcloud-node.com." "-all"
      test1	IN	SPF	"v=spf3" "mx:gcloud-node.com." "-all    " "aasdfsadfdsafdasf"
      test1	IN	SPF	"v=spf4" "mx:gcloud-node.com." "-all"`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate caa records', () => {
      const records = `
      @	IN	CAA	0	issue	"ca.example.net; account=230123"
      @	IN	CAA	0	iodef	"mailto:security@example.com"
      @	IN	CAA	0	iodef	"http://iodef.example.com/"`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ds records', () => {
      const records = `
      secure.example.	IN	DS	tag=12345	alg=3	digest_type=1	<foofoo>
      secure.example.	IN	DS	tag=12345	alg=3	digest_type=1	"<foofoo>"`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                  ______        __                                                __                                              //
//     __          /      |      /  |                                              /  |                                             //
//    /  |         $$$$$$/   ____$$ |  ______   _____  ____    ______    ______   _$$ |_     ______   _______    _______   ______   //
//  __$$ |__         $$ |   /    $$ | /      \ /     \/    \  /      \  /      \ / $$   |   /      \ /       \  /       | /      \  //
// /  $$    |        $$ |  /$$$$$$$ |/$$$$$$  |$$$$$$ $$$$  |/$$$$$$  |/$$$$$$  |$$$$$$/   /$$$$$$  |$$$$$$$  |/$$$$$$$/ /$$$$$$  | //
// $$$$$$$$/         $$ |  $$ |  $$ |$$    $$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ |  $$ | __ $$    $$ |$$ |  $$ |$$ |      $$    $$ | //
//    $$ |          _$$ |_ $$ \__$$ |$$$$$$$$/ $$ | $$ | $$ |$$ |__$$ |$$ \__$$ |  $$ |/  |$$$$$$$$/ $$ |  $$ |$$ \_____ $$$$$$$$/  //
//    $$/          / $$   |$$    $$ |$$       |$$ | $$ | $$ |$$    $$/ $$    $$/   $$  $$/ $$       |$$ |  $$ |$$       |$$       | //
//                 $$$$$$/  $$$$$$$/  $$$$$$$/ $$/  $$/  $$/ $$$$$$$/   $$$$$$/     $$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/  $$$$$$$/  //
//                                                           $$ |                                                                   //
//                                                           $$ |                                                                   //
//                                                           $$/                                                                    //
//                                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('forward idempotence tests', () => {
   it('should be idempotent', () => {
      const text = fs.readFileSync(__dirname + '/zonefile_forward.txt', 'utf8');
      const json = zonefile.parse(text);

      const text1 = zonefile.generate(json);
      const json1 = zonefile.parse(text1);

      expect(deepEqual(json, json1)).toBeTrue();

      const text2 = zonefile.generate(json1);

      // exclude the date time line
      expect(deepEqual(text1.split('\n').slice(2), text2.split('\n').slice(2))).toBeTrue();
   });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                _______                                                                     __    __  //
//               /       \                                                                   /  |  /  | //
//               $$$$$$$  | ______    ______    _______   ______    ______         __     __ $$ |  $$ | //
//  ______       $$ |__$$ |/      \  /      \  /       | /      \  /      \       /  \   /  |$$ |__$$ | //
// /      |      $$    $$/ $$$$$$  |/$$$$$$  |/$$$$$$$/ /$$$$$$  |/$$$$$$  |      $$  \ /$$/ $$    $$ | //
// $$$$$$/       $$$$$$$/  /    $$ |$$ |  $$/ $$      \ $$    $$ |$$ |  $$/        $$  /$$/  $$$$$$$$ | //
//               $$ |     /$$$$$$$ |$$ |       $$$$$$  |$$$$$$$$/ $$ |              $$ $$/         $$ | //
//               $$ |     $$    $$ |$$ |      /     $$/ $$       |$$ |               $$$/          $$ | //
//               $$/       $$$$$$$/ $$/       $$$$$$$/   $$$$$$$/ $$/                 $/           $$/  //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv4 parser', () => {
   let parsed;
   beforeEach(() => {
      const text = fs.readFileSync(__dirname + '/zonefile_reverse_ipv4.txt', 'utf8');
      parsed = zonefile.parse(text);
   });

   it('should parse global info', () => {
      expect(parsed['$origin']).toEqual('0.168.192.IN-ADDR.ARPA.');
      expect(parsed['$ttl']).toEqual('3600');
   });

   it('should parse soa records', () => {
      const records = parsed['soa'];
      expect(records?.['name']).toEqual('@');
      expect(records?.['minimum']).toEqual(86400);
      expect(records?.['expire']).toEqual(604800);
      expect(records?.['retry']).toEqual(600);
      expect(records?.['refresh']).toEqual(3600);
      expect(records?.['serial']).toEqual(1406291485);
      expect(records?.['rname']).toEqual('HOSTMASTER.MYDOMAIN.COM.');
      expect(records?.['mname']).toEqual('NS1.NAMESERVER.NET.');
   });

   it('should parse ns records', () => {
      const records = parsed['ns'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['host']).toEqual('NS1.NAMESERVER.NET.');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['host']).toEqual('NS2.NAMESERVER.NET.');
   });

   it('should parse ptr records', () => {
      const records = parsed['ptr'];
      expect(records?.length).toEqual(8);
      expect(records?.[0]?.['name']).toEqual('1');
      expect(records?.[0]?.['fullname']).toEqual(records?.[0]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[0]?.['host']).toEqual('HOST1.MYDOMAIN.COM.');
      expect(records?.[0]?.['ttl']).toEqual(400);

      expect(records?.[1]?.['name']).toEqual('2');
      expect(records?.[1]?.['fullname']).toEqual(records?.[1]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[1]?.['host']).toEqual('HOST2.MYDOMAIN.COM.');

      expect(records?.[2]?.['name']).toEqual('3');
      expect(records?.[2]?.['fullname']).toEqual(records?.[2]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[2]?.['host']).toEqual('HOST3.MYDOMAIN.COM.');

      expect(records?.[3]?.['name']).toEqual('4');
      expect(records?.[3]?.['fullname']).toEqual(records?.[3]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[3]?.['host']).toEqual('HOST4.MYDOMAIN.COM.');

      expect(records?.[4]?.['name']).toEqual('4');
      expect(records?.[4]?.['fullname']).toEqual(records?.[4]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[4]?.['host']).toEqual('HOST5.MYDOMAIN.COM.');

      expect(records?.[5]?.['name']).toEqual('4');
      expect(records?.[5]?.['fullname']).toEqual(records?.[5]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[5]?.['host']).toEqual('HOST6.MYDOMAIN.COM.');

      expect(records?.[6]?.['name']).toEqual('10.3');
      expect(records?.[6]?.['fullname']).toEqual(records?.[6]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[6]?.['host']).toEqual('HOST3.MYDOMAIN.COM.');

      expect(records?.[7]?.['name']).toEqual('10.4');
      expect(records?.[7]?.['fullname']).toEqual(records?.[7]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[7]?.['host']).toEqual('HOST4.MYDOMAIN.COM.');
   });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                 ______                                                      __                                           __    __  //
//                /      \                                                    /  |                                         /  |  /  | //
//               /$$$$$$  |  ______   _______    ______    ______   ______   _$$ |_     ______    ______         __     __ $$ |  $$ | //
//  ______       $$ | _$$/  /      \ /       \  /      \  /      \ /      \ / $$   |   /      \  /      \       /  \   /  |$$ |__$$ | //
// /      |      $$ |/    |/$$$$$$  |$$$$$$$  |/$$$$$$  |/$$$$$$  |$$$$$$  |$$$$$$/   /$$$$$$  |/$$$$$$  |      $$  \ /$$/ $$    $$ | //
// $$$$$$/       $$ |$$$$ |$$    $$ |$$ |  $$ |$$    $$ |$$ |  $$/ /    $$ |  $$ | __ $$ |  $$ |$$ |  $$/        $$  /$$/  $$$$$$$$ | //
//               $$ \__$$ |$$$$$$$$/ $$ |  $$ |$$$$$$$$/ $$ |     /$$$$$$$ |  $$ |/  |$$ \__$$ |$$ |              $$ $$/         $$ | //
//               $$    $$/ $$       |$$ |  $$ |$$       |$$ |     $$    $$ |  $$  $$/ $$    $$/ $$ |               $$$/          $$ | //
//                $$$$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/ $$/       $$$$$$$/    $$$$/   $$$$$$/  $$/                 $/           $$/  //
//                                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv4 generator', () => {
   let generated;
   let lines;
   beforeEach(() => {
      const json = require(__dirname + '/zonefile_reverse_ipv4.json');
      generated = zonefile.generate(json);
      lines = generated.split('\n');
   });

   it('should generate global info', () => {
      expect(lines.includes('$ORIGIN 0.168.192.IN-ADDR.ARPA.')).toBeTrue();
      expect(lines.includes('$TTL 3600')).toBeTrue();
   });

   it('should generate soa records', () => {
      const records = `
      @	 		IN	SOA	NS1.NAMESERVER.NET.	HOSTMASTER.MYDOMAIN.COM.	(
      1406291485	 ;serial
      3600	 ;refresh
      600	 ;retry
      604800	 ;expire
      86400	 ;minimum ttl`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ns records', () => {
      const records = `
      @	IN	NS	NS1.NAMESERVER.NET.
      @	IN	NS	NS2.NAMESERVER.NET.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ptr records', () => {
      const records = `
      1	400	IN	PTR	HOST1.MYDOMAIN.COM.
      2	IN	PTR	HOST2.MYDOMAIN.COM.
      3	IN	PTR	HOST3.MYDOMAIN.COM.
      4	IN	PTR	HOST4.MYDOMAIN.COM.
      4	IN	PTR	HOST5.MYDOMAIN.COM.
      4	IN	PTR	HOST6.MYDOMAIN.COM.
      10.3	IN	PTR	HOST3.MYDOMAIN.COM.
      10.4	IN	PTR	HOST4.MYDOMAIN.COM.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                ______        __                                                __                                                               __    __  //
//               /      |      /  |                                              /  |                                                             /  |  /  | //
//               $$$$$$/   ____$$ |  ______   _____  ____    ______    ______   _$$ |_     ______   _______    _______   ______         __     __ $$ |  $$ | //
//  ______         $$ |   /    $$ | /      \ /     \/    \  /      \  /      \ / $$   |   /      \ /       \  /       | /      \       /  \   /  |$$ |__$$ | //
// /      |        $$ |  /$$$$$$$ |/$$$$$$  |$$$$$$ $$$$  |/$$$$$$  |/$$$$$$  |$$$$$$/   /$$$$$$  |$$$$$$$  |/$$$$$$$/ /$$$$$$  |      $$  \ /$$/ $$    $$ | //
// $$$$$$/         $$ |  $$ |  $$ |$$    $$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ |  $$ | __ $$    $$ |$$ |  $$ |$$ |      $$    $$ |       $$  /$$/  $$$$$$$$ | //
//                _$$ |_ $$ \__$$ |$$$$$$$$/ $$ | $$ | $$ |$$ |__$$ |$$ \__$$ |  $$ |/  |$$$$$$$$/ $$ |  $$ |$$ \_____ $$$$$$$$/         $$ $$/         $$ | //
//               / $$   |$$    $$ |$$       |$$ | $$ | $$ |$$    $$/ $$    $$/   $$  $$/ $$       |$$ |  $$ |$$       |$$       |         $$$/          $$ | //
//               $$$$$$/  $$$$$$$/  $$$$$$$/ $$/  $$/  $$/ $$$$$$$/   $$$$$$/     $$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/  $$$$$$$/           $/           $$/  //
//                                                         $$ |                                                                                              //
//                                                         $$ |                                                                                              //
//                                                         $$/                                                                                               //
//                                                                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv4 idempotence tests', () => {
   it('should be idempotent', () => {
      const text = fs.readFileSync(__dirname + '/zonefile_reverse_ipv4.txt', 'utf8');
      const json = zonefile.parse(text);

      const text1 = zonefile.generate(json);
      const json1 = zonefile.parse(text1);

      expect(deepEqual(json, json1)).toBeTrue();

      const text2 = zonefile.generate(json1);

      // exclude the date time line
      expect(deepEqual(text1.split('\n').slice(2), text2.split('\n').slice(2))).toBeTrue();
   });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//                _______                                                                      ______   //
//               /       \                                                                    /      \  //
//               $$$$$$$  | ______    ______    _______   ______    ______         __     __ /$$$$$$  | //
//  ______       $$ |__$$ |/      \  /      \  /       | /      \  /      \       /  \   /  |$$ \__$$/  //
// /      |      $$    $$/ $$$$$$  |/$$$$$$  |/$$$$$$$/ /$$$$$$  |/$$$$$$  |      $$  \ /$$/ $$      \  //
// $$$$$$/       $$$$$$$/  /    $$ |$$ |  $$/ $$      \ $$    $$ |$$ |  $$/        $$  /$$/  $$$$$$$  | //
//               $$ |     /$$$$$$$ |$$ |       $$$$$$  |$$$$$$$$/ $$ |              $$ $$/   $$ \__$$ | //
//               $$ |     $$    $$ |$$ |      /     $$/ $$       |$$ |               $$$/    $$    $$/  //
//               $$/       $$$$$$$/ $$/       $$$$$$$/   $$$$$$$/ $$/                 $/      $$$$$$/   //
//                                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv6 parser', () => {
   let parsed;
   beforeEach(() => {
      const text = fs.readFileSync(__dirname + '/zonefile_reverse_ipv6.txt', 'utf8');
      parsed = zonefile.parse(text);
   });

   it('should parse global info', () => {
      expect(parsed['$origin']).toEqual('0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa.');
      expect(parsed['$ttl']).toEqual('3600');
   });

   it('should parse soa records', () => {
      const records = parsed['soa'];
      expect(records?.['name']).toEqual('@');
      expect(records?.['minimum']).toEqual(86400);
      expect(records?.['expire']).toEqual(604800);
      expect(records?.['retry']).toEqual(600);
      expect(records?.['refresh']).toEqual(3600);
      expect(records?.['serial']).toEqual(1406291485);
      expect(records?.['rname']).toEqual('HOSTMASTER.MYDOMAIN.COM.');
      expect(records?.['mname']).toEqual('NS1.NAMESERVER.NET.');
   });

   it('should parse ns records', () => {
      const records = parsed['ns'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('@');
      expect(records?.[0]?.['host']).toEqual('NS1.NAMESERVER.NET.');
      expect(records?.[1]?.['name']).toEqual('@');
      expect(records?.[1]?.['host']).toEqual('NS2.NAMESERVER.NET.');
   });

   it('should parse ptr records', () => {
      const records = parsed['ptr'];
      expect(records?.length).toEqual(2);
      expect(records?.[0]?.['name']).toEqual('1');
      expect(records?.[0]?.['fullname']).toEqual(records?.[0]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[0]?.['host']).toEqual('HOST1.MYDOMAIN.COM.');
      expect(records?.[0]?.['ttl']).toEqual(400);

      expect(records?.[1]?.['name']).toEqual('2');
      expect(records?.[1]?.['fullname']).toEqual(records?.[1]?.['name'] + '.' + parsed['$origin']);
      expect(records?.[1]?.['host']).toEqual('HOST2.MYDOMAIN.COM.');
   });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                 ______                                                      __                                            ______   //
//                /      \                                                    /  |                                          /      \  //
//               /$$$$$$  |  ______   _______    ______    ______   ______   _$$ |_     ______    ______         __     __ /$$$$$$  | //
//  ______       $$ | _$$/  /      \ /       \  /      \  /      \ /      \ / $$   |   /      \  /      \       /  \   /  |$$ \__$$/  //
// /      |      $$ |/    |/$$$$$$  |$$$$$$$  |/$$$$$$  |/$$$$$$  |$$$$$$  |$$$$$$/   /$$$$$$  |/$$$$$$  |      $$  \ /$$/ $$      \  //
// $$$$$$/       $$ |$$$$ |$$    $$ |$$ |  $$ |$$    $$ |$$ |  $$/ /    $$ |  $$ | __ $$ |  $$ |$$ |  $$/        $$  /$$/  $$$$$$$  | //
//               $$ \__$$ |$$$$$$$$/ $$ |  $$ |$$$$$$$$/ $$ |     /$$$$$$$ |  $$ |/  |$$ \__$$ |$$ |              $$ $$/   $$ \__$$ | //
//               $$    $$/ $$       |$$ |  $$ |$$       |$$ |     $$    $$ |  $$  $$/ $$    $$/ $$ |               $$$/    $$    $$/  //
//                $$$$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/ $$/       $$$$$$$/    $$$$/   $$$$$$/  $$/                 $/      $$$$$$/   //
//                                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv4 generator', () => {
   let generated;
   let lines;
   beforeEach(() => {
      const json = require(__dirname + '/zonefile_reverse_ipv6.json');
      generated = zonefile.generate(json);
      lines = generated.split('\n');
   });

   it('should generate global info', () => {
      expect(lines.includes('$ORIGIN 0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa.')).toBeTrue();
      expect(lines.includes('$TTL 3600')).toBeTrue();
   });

   it('should generate soa records', () => {
      const records = `
      @	 		IN	SOA	NS1.NAMESERVER.NET.	HOSTMASTER.MYDOMAIN.COM.	(
      1406291485	 ;serial
      3600	 ;refresh
      600	 ;retry
      604800	 ;expire
      86400	 ;minimum ttl`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ns records', () => {
      const records = `
      @	IN	NS	NS1.NAMESERVER.NET.
      @	IN	NS	NS2.NAMESERVER.NET.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });

   it('should generate ptr records', () => {
      const records = `
      1	400	IN	PTR	HOST1.MYDOMAIN.COM.
      2	IN	PTR	HOST2.MYDOMAIN.COM.`;
      records.trim().split('\n').forEach(record => {
         expect(lines).toContain(record.trim());
      });
   });
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                ______        __                                                __                                                                ______   //
//               /      |      /  |                                              /  |                                                              /      \  //
//               $$$$$$/   ____$$ |  ______   _____  ____    ______    ______   _$$ |_     ______   _______    _______   ______         __     __ /$$$$$$  | //
//  ______         $$ |   /    $$ | /      \ /     \/    \  /      \  /      \ / $$   |   /      \ /       \  /       | /      \       /  \   /  |$$ \__$$/  //
// /      |        $$ |  /$$$$$$$ |/$$$$$$  |$$$$$$ $$$$  |/$$$$$$  |/$$$$$$  |$$$$$$/   /$$$$$$  |$$$$$$$  |/$$$$$$$/ /$$$$$$  |      $$  \ /$$/ $$      \  //
// $$$$$$/         $$ |  $$ |  $$ |$$    $$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ |  $$ | __ $$    $$ |$$ |  $$ |$$ |      $$    $$ |       $$  /$$/  $$$$$$$  | //
//                _$$ |_ $$ \__$$ |$$$$$$$$/ $$ | $$ | $$ |$$ |__$$ |$$ \__$$ |  $$ |/  |$$$$$$$$/ $$ |  $$ |$$ \_____ $$$$$$$$/         $$ $$/   $$ \__$$ | //
//               / $$   |$$    $$ |$$       |$$ | $$ | $$ |$$    $$/ $$    $$/   $$  $$/ $$       |$$ |  $$ |$$       |$$       |         $$$/    $$    $$/  //
//               $$$$$$/  $$$$$$$/  $$$$$$$/ $$/  $$/  $$/ $$$$$$$/   $$$$$$/     $$$$/   $$$$$$$/ $$/   $$/  $$$$$$$/  $$$$$$$/           $/      $$$$$$/   //
//                                                         $$ |                                                                                              //
//                                                         $$ |                                                                                              //
//                                                         $$/                                                                                               //
//                                                                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('reverse ipv4 idempotence tests', () => {
   it('should be idempotent', () => {
      const text = fs.readFileSync(__dirname + '/zonefile_reverse_ipv6.txt', 'utf8');
      const json = zonefile.parse(text);

      const text1 = zonefile.generate(json);
      const json1 = zonefile.parse(text1);

      expect(deepEqual(json, json1)).toBeTrue();

      const text2 = zonefile.generate(json1);

      // exclude the date time line
      expect(deepEqual(text1.split('\n').slice(2), text2.split('\n').slice(2))).toBeTrue();
   });
});