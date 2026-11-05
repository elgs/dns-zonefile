export interface DNSZone {
  $origin?: string;
  /** The $TTL directive. parse keeps the value as written, such as "3600" or "1h"; generate accepts a number or a string. */
  $ttl?: number | string;
  soa?: {
    name: string;
    minimum: number;
    expire: number;
    retry: number;
    refresh: number;
    /** Zone serial. parse returns a number; generate also accepts the string "{time}", which is replaced with the current Unix time. */
    serial: number | string;
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

export function parse(zoneFile: string): DNSZone;
export function generate(dnsZone: DNSZone, template?: string): string;

declare const zonefile: {
  parse: typeof parse;
  generate: typeof generate;
};
export default zonefile;
