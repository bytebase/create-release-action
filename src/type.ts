import * as hc from '@actions/http-client'

export interface httpClient {
  c: hc.HttpClient
  url: string
  token: string
}

export interface CheckReleaseResponse {
  results:
    | {
        file: string
        target: string
        advices: any[] | undefined
        affectedRows: number | undefined
        riskLevel: string
      }[]
    | undefined
  affectedRows: number | undefined
  riskLevel: string
}

export interface Sheet {
  title: string
  content: string // base64 encoded
}

export type ChangeType = 'DDL' | 'DML' | 'DDL_GHOST'

export interface File {
  content: string // base64 encoded
  path: string
  version: string
  type: 'VERSIONED'
  changeType: ChangeType
}

export interface ReleaseFile {
  path: string
  version: string
  sheet: string
  type: 'VERSIONED'
  changeType: ChangeType
}

export interface Release {
  title: string
  files: ReleaseFile[]
  vcsSource: {
    vcsType: 'GITHUB'
    url: string
  }
}
