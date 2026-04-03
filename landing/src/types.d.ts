export interface MetaDataImage {
    url: string;
    width?: number;
    height?: number;
}

export interface MetaDataRobots {
  index?: boolean
  follow?: boolean
}

export interface MetaDataOpenGraph {
  url?: string
  siteName?: string
  images?: MetaDataImage[]
  locale?: string
  type?: string
}

export interface MetaDataTwitter {
    handle?: string;
    site?: string;
    cardType?: string;
}

export interface MetaData {
  title?: string
  ignoreTitleTemplate?: boolean
  canonical?: string
  robots?: MetaDataRobots
  description?: string
  openGraph?: MetaDataOpenGraph
  twitter?: MetaDataTwitter
}