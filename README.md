dns-zonefile
==================

A DNS zone file generator written in Nodejs.

Installation
===

Standalone
---
`sudo npm install dns-zonefile -g`

Module
---
`npm install dns-zonefile`

Run as standalone
===
In standalone mode, a JSON file as the argument like the following is expected:
```json
{
    "soa": {
        "ttl": 3600,
        "origin": "NS1.NAMESERVER.NET.",
        "person": "HOSTMASTER.MYDOMAIN.COM.",
        "serial": 45,
        "refresh": 3600,
        "retry": 600,
        "expire": 3600000,
        "minimum": 86400
    },
    "ns": [
        "NS1.NAMESERVER.NET",
        "NS2.NAMESERVER.NET"
    ],
    "a": {
        "@": "127.0.0.1",
        "www": "127.0.0.1",
        "mail": "127.0.0.1"
    },
    "cname": {
        "mail1": "mail",
        "mail2": "mail"
    },
    "mx": {
        "0": "mail1",
        "10": "mail2"
    }
}
```
Assuming a JSON file named zonefile_data.json contains the JSON data above, run:
```
zonefile zonefile_data.json
```
Output will be as follows:
```
$TTL	180
@   IN  SOA   NS1.NAMESERVER.NET.	   HOSTMASTER.MYDOMAIN.COM.	 (
               45	 ;serial
               3600	 ;refresh
               600	 ;retry
               3600000	 ;expire
               86400	 );minimum
IN		NS		NS1.NAMESERVER.NET
IN		NS		NS2.NAMESERVER.NET

@		IN		A		127.0.0.1
www		IN		A		127.0.0.1
mail		IN		A		127.0.0.1

mail1		IN		CNAME		mail
mail2		IN		CNAME		mail

IN		MX		0		mail1
IN		MX		10		mail2

```

Run as module
===
```javascript
var zonefile = require('dns-zonefile');
var options = require('./zonefile_data.json');
var output = zonefile.generate(options);
console.log(output);
```
where zonefile_data.json follows the configuration JSON format above.