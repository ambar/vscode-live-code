declare module 'node-fetch-cache' {
  export class MemoryCache {}
  export type Builder = {
    withCache(cache: MemoryCache): typeof fetch
  }
  export const fetchBuilder: Builder
}
