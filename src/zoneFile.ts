import { makeZoneFile } from './makeZoneFile';
import { parseZoneFile } from './parseZoneFile';

export type SoaType = {
  name?: string;
  ttl?: number | string;
  minimum?: number;
  expire?: number;
  retry?: number;
  refresh?: number;
  serial?: number;
  rname?: string;
  mname?: string;
};
export type NSType = { name: string; ttl?: number; host: string; fullname?: string };
export type AType = { name: string; ttl?: number; ip: string };
export type CNAMEType = { name: string; ttl?: number; alias: string };
export type MXType = { name: string; ttl?: number; host: string; preference: number };
export type TXTType = { name: string; ttl?: number; txt: string | string[] };
export type SRVType = { name: string; ttl?: number; priority: number; weight: number; port: number; target: string };
export type SPFType = { name: string; ttl?: number; data: string };
export type URIType = { name: string; ttl?: number; priority: number; weight: number; target: string };

export type ZoneFileObject = {
  $origin?: string;
  $ttl?: number;
  soa?: SoaType;
  ns?: NSType[];
  a?: AType[];
  aaaa?: AType[];
  cname?: CNAMEType[];
  mx?: MXType[];
  ptr?: NSType[];
  txt?: TXTType[];
  srv?: SRVType[];
  spf?: SPFType[];
  uri?: URIType[];
  $domain?: string;
};

export class ZoneFile {
  jsonZoneFile: ZoneFileObject;

  constructor(zoneFile: ZoneFileObject | string) {
    if (typeof zoneFile === 'object') {
      this.jsonZoneFile = JSON.parse(JSON.stringify(zoneFile));
    } else if (typeof zoneFile === 'string') {
      this.jsonZoneFile = parseZoneFile(zoneFile);
    } else {
      this.jsonZoneFile = (undefined as unknown) as ZoneFileObject;
    }
  }

  toJSON() {
    return this.jsonZoneFile;
  }

  toString() {
    return makeZoneFile(this.toJSON());
  }
}
