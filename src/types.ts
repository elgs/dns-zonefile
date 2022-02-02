export interface GenerateOptions {
    $origin: any;
    $ttl: any;
    soa?: any;
    ns?: any;
    a?: any;
    aaaa?: any;
    cname?: any;
    mx?: any;
    ptr?: any;
    txt?: any;
    srv?: any;
    spf?: any;
    caa?: any;
    ds?: any;
}

export interface ParseResult {
    name: string;
    ttl?: number;
    [field: string]: string | number | undefined;
}
export interface SOA {
    name: string;
    minimum: number;
    expire: number;
    retry: number;
    refresh: number;
    serial: number;
    rname: string;
    mname: string;
    ttl?: number;
}
