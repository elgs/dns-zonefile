dns-zonefile
============
An [RFC1537 compliant](http://www.ietf.org/rfc/rfc1537.txt) DNS zone file
generator for Node.js.

# Installation

## Standalone

`sudo npm install dns-zonefile -g`

## Module

`npm install dns-zonefile`

# Usage

## Zone Information

_dns-zonefile_ accepts zone data expressed as a JSON object. It supports `SOA`,
`NS`, `A`, `CNAME`, `MX` and `PTR` record types as well as the `$ORIGIN`
keyword (for zone-wide use only). Each record type (and the `$ORIGIN` keyword)
is optional, though _bind_ expects to find at least an `SOA` record in a valid
zone file.

### Examples

#### Forward DNS Zone

The following JSON produces a zone file for a forward DNS zone:

```json
{
    "$origin": "NAMESERVER.NET.",
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

_dns-zonefile_ will produce the following zone file from the above information:

```
$ORIGIN NAMESERVER.NET.
$TTL	3600
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

### Reverse DNS Zone

This JSON will produce a zone file for a reverse DNS zone (the `$ORIGIN`
keyword is recommended for reverse DNS zones):

```json
{
    "$origin": "0.168.192.IN_ADDR.ARPA.",
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
    "ptr": {
        "1": "HOST1.MYDOMAIN.COM.",
        "2": "HOST2.MYDOMAIN.COM."
    }
}
```

_dns-zonefile_ will produce the following zone file from the above information:

```
$ORIGIN 0.168.192.in-addr.arpa.
$TTL	3600
@   IN  SOA   NS1.NAMESERVER.NET.	   HOSTMASTER.MYDOMAIN.COM.	 (
               45	 ;serial
               3600	 ;refresh
               600	 ;retry
               3600000	 ;expire
               86400	 );minimum
IN		NS		NS1.NAMESERVER.NET
IN		NS		NS2.NAMESERVER.NET

1       IN      PTR     HOST1.MYDOMAIN.COM.
2       IN      PTR     HOST2.MYDOMAIN.COM.
```

## Standalone Usage

To use _dns-zonefile_ from the command line, place the desired JSON data in a
file (`zonefile_data.json` in this example) and run the following command. Note
that the resulting zone file will be printed to the console; to save the zone
file to disk (`my_zone.conf` in this example), use redirection as in this
example:

```
zonefile zonefile_data.json > my_zone.conf
```

## Module Usage

_dns-zonefile_ can also be used as a module. Simply use `require()` to include
it, then invoke its `generate()` function as shown in the following example:

```javascript
var zonefile = require('dns-zonefile');
var options = require('./zonefile_data.json');
var output = zonefile.generate(options);
console.log(output);
```

`options` can either be a parsed JSON object as shown above, or a regular
Javascript object containing the same required fields.

