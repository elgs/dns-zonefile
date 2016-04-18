import { makeZoneFile } from './makeZoneFile'
import { parseZoneFile } from './parseZoneFile'

export class ZoneFile {
  constructor(zoneFile) {
    if (typeof zoneFile === 'object') {
      this.jsonZoneFile = JSON.parse(JSON.stringify(zoneFile))
    } else if (typeof zoneFile === 'string') {
      this.jsonZoneFile = parseZoneFile(zoneFile)
    }
  }

  toJSON() {
    return this.jsonZoneFile
  }

  toString() {
    return makeZoneFile(this.toJSON())
  }
}