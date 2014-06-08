dns-zonefile
============
An [RFC1035 compliant](http://www.ietf.org/rfc/rfc1035.txt) DNS zone file
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
    "$origin": "MYDOMAIN.COM.",
    "$ttl": 3600,
    "soa": {
        "mname": "NS1.NAMESERVER.NET.",
        "rname": "HOSTMASTER.MYDOMAIN.COM.",
        "serial": "{time}",
        "refresh": 3600,
        "retry": 600,
        "expire": 604800,
        "minimum": 86400
    },
    "ns": [
        "NS1.NAMESERVER.NET.",
        "NS2.NAMESERVER.NET."
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
$ORIGIN MYDOMAIN.COM.
$TTL	3600
@   IN  SOA   NS1.NAMESERVER.NET.	   HOSTMASTER.MYDOMAIN.COM.	 (
               1402203462	 ;serial
               3600	 ;refresh
               600	 ;retry
               604800	 ;expire
               86400	 ;minimum ttl
)

@	NS	NS1.NAMESERVER.NET.
@	NS	NS2.NAMESERVER.NET.

@	MX	0	mail1
@	MX	10	mail2

@	A	127.0.0.1
www	A	127.0.0.1
mail	A	127.0.0.1

mail1	CNAME	mail
mail2	CNAME	mail
```

### Reverse DNS Zone

This JSON will produce a zone file for a reverse DNS zone (the `$ORIGIN`
keyword is recommended for reverse DNS zones):

```json
{
    "$origin": "0.168.192.IN-ADDR.ARPA.",
    "$ttl": 3600,
    "soa": {
        "mname": "NS1.NAMESERVER.NET.",
        "rname": "HOSTMASTER.MYDOMAIN.COM.",
        "serial": "{time}",
        "refresh": 3600,
        "retry": 600,
        "expire": 604800,
        "minimum": 86400
    },
    "ns": [
        "NS1.NAMESERVER.NET.",
        "NS2.NAMESERVER.NET."
    ],
    "ptr": {
        "1": "HOST1.MYDOMAIN.COM.",
        "2": "HOST2.MYDOMAIN.COM."
    }
}
```

_dns-zonefile_ will produce the following zone file from the above information:

```
$ORIGIN 0.168.192.IN-ADDR.ARPA.
$TTL	3600
@   IN  SOA   NS1.NAMESERVER.NET.	   HOSTMASTER.MYDOMAIN.COM.	 (
               1402203462	 ;serial
               3600	 ;refresh
               600	 ;retry
               604800	 ;expire
               86400	 ;minimum ttl
)

@	NS	NS1.NAMESERVER.NET.
@	NS	NS2.NAMESERVER.NET.

1	PTR	HOST1.MYDOMAIN.COM.
2	PTR	HOST2.MYDOMAIN.COM.
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

It is also possible to parse a zone file to JSON by invoking its `parse()`
function as shown in the following example:

```javascript
var zonefile = require('dns-zonefile');
var text = fs.readFileSync('./zone_file_forward.txt', {encoding: 'utf8'});
output = zonefile.parse(text);
console.log(output);
```