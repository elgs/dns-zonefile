declare module "dns-zonefile" {
  interface DNSZone {
    $origin?: string;
    $ttl?: number;
    soa?: {
      name: string;
      minimum: number;
      expire: number;
      retry: number;
      refresh: number;
      serial: number;
      rname: string;
      mname: string;
      ttl?: number;
    };
    ns?: {
      name: string;
      host: string;
      ttl?: number;
    }[];
    a?: {
      name: string;
      ip: string;
      ttl?: number;
    }[];
    aaaa?: {
      name: string;
      ip: string;
      ttl?: number;
    }[];
    cname?: {
      name: string;
      alias: string;
      ttl?: number;
    }[];
    mx?: {
      name: string;
      preference: number;
      host: string;
      ttl?: number;
    }[];
    txt?: {
      name: string;
      txt: string;
      ttl?: number;
    }[];
    ptr?: {
      name: string;
      fullname: string;
      host: string;
      ttl?: number;
    }[];
    srv?: {
      name: string;
      target: string;
      priority: number;
      weight: number;
      port: number;
      ttl?: number;
    }[];
    spf?: {
      name: string;
      data: string;
      ttl?: number;
    }[];
    caa?: {
      name: string;
      flags: number;
      tag: string;
      value: string;
      ttl?: number;
    }[];
    ds?: {
      name: string;
      key_tag: string;
      algorithm: string;
      digest_type: string;
      digest: string;
      ttl?: number;
    }[];
  }

  function parse(zoneFile: string): DNSZone;
  function generate(dnsZone: DNSZone): string;
}
