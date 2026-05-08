declare module 'dom-to-image-more' {
  interface Options {
    filter?: (node: Node) => boolean
    bgcolor?: string | null
    width?: number
    height?: number
    style?: Partial<CSSStyleDeclaration>
    quality?: number
    scale?: number
    imagePlaceholder?: string
    cacheBust?: boolean
  }

  function toPng(node: HTMLElement, options?: Options): Promise<string>
  function toJpeg(node: HTMLElement, options?: Options): Promise<string>
  function toBlob(node: HTMLElement, options?: Options): Promise<Blob>
  function toSvg(node: HTMLElement, options?: Options): Promise<string>
  function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>

  export default { toPng, toJpeg, toBlob, toSvg, toPixelData }
}
