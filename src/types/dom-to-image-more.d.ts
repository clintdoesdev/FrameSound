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

  const domToImageMore: {
    toPng(node: HTMLElement, options?: Options): Promise<string>
    toJpeg(node: HTMLElement, options?: Options): Promise<string>
    toBlob(node: HTMLElement, options?: Options): Promise<Blob>
    toSvg(node: HTMLElement, options?: Options): Promise<string>
    toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>
  }
  export default domToImageMore
}
