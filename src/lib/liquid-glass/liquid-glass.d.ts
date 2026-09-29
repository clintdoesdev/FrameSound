export type RGBA = [number, number, number, number];
export interface Rect { x: number; y: number; width: number; height: number }
export interface Material {
  thickness: number; refraction: number; dispersion: number; frost: number; zoom?: number; refractScale?: number;
  glare: number; glareConvergence: number; glareAngle: number; glareSharpness: number; glareRange: number;
  glareOppositeBias: number; shadow?: number; tint: { light: RGBA; dark: RGBA } | RGBA;
}
type Target = Element | (() => Rect);
type Num = number | (() => number);
export interface ShapeOptions { material?: Material; radius?: number | 'auto' | 'pill' | ((r: Rect) => number); layer?: number; opacity?: Num }
export interface FillOptions { color?: RGBA | (() => RGBA); radius?: number | 'auto' | 'pill' | ((r: Rect) => number); layer?: number; opacity?: Num }
export interface Handle { kind: 'shape' | 'fill'; material?: Material; opacity: Num }

export const presets: { regular(): Material; clear(): Material; lens(): Material; thumb(magnification?: number): Material };

export class LiquidGlass {
  constructor(opts?: { canvas?: HTMLCanvasElement; maxDpr?: number; theme?: 'light' | 'dark' });
  readonly supported: boolean;
  readonly maxTextureSize: number;
  theme: 'light' | 'dark';
  reducedMotion: boolean;
  setSource(source: TexImageSource, opts?: { fit?: 'cover' | 'page'; width?: number; height?: number; live?: boolean }): void;
  invalidateSource(): void;
  add(target: Target, opts?: ShapeOptions): Handle;
  addFill(target: Target, opts?: FillOptions): Handle;
  remove(item: Handle): void;
  setLayer(layer: number, opts: { merge?: number }): void;
  setTheme(theme: 'light' | 'dark'): void;
  onFrame(cb: (dt: number, now: number) => void): () => void;
  invalidate(): void;
  rectOf(el: Element): DOMRect;
  opacityOf(el: Element): number;
  destroy(): void;
}

export class Spring { constructor(value?: number, opts?: { response?: number; dampingRatio?: number }); value: number; target: number; velocity: number; step(dt: number): number; jump(v: number): void }
export class GlassSwitch { constructor(engine: LiquidGlass, host: HTMLElement, opts?: { checked?: boolean; onChange?: (v: boolean) => void; tint?: RGBA; layer?: number; opacity?: Num }); checked: boolean; set(v: boolean, emit?: boolean): void; destroy(): void }
export class GlassSlider { constructor(engine: LiquidGlass, host: HTMLElement, opts?: { min?: number; max?: number; value?: number; step?: number; onInput?: (v: number) => void; tint?: RGBA; layer?: number; opacity?: Num; label?: string }); value: number; setValue(v: number, emit?: boolean): void; destroy(): void }
export class GlassTabBar { constructor(engine: LiquidGlass, host: HTMLElement, opts?: { items?: HTMLElement[]; selected?: number; onSelect?: (i: number) => void; layer?: number; opacity?: Num; material?: Material }); selected: number; select(i: number, opts?: { animate?: boolean; lift?: boolean; emit?: boolean }): void; destroy(): void }
export class GlassDraggable { constructor(engine: LiquidGlass, el: HTMLElement, opts?: { material?: Material; layer?: number; x?: number; y?: number; margin?: number }); clampToViewport(): void; destroy(): void }
