class CLAColor {
  c: number;
  l: number;
  a: number;
  constructor(chroma: number, lightness: number, angle: number) {
    this.c = chroma;
    this.l = lightness;
    this.a = angle;
  }
  toRGB() {
    const [y, u, v] = this.toYUV();
    const r =( y + 1.13983 * v)*255;
    const g = (y - 0.39465 * u - 0.58060 * v)*255;
    const b = (y + 2.03211 * u)*255;
    return [r, g, b];
  }
  toYUV() {  
    let u = Math.cos((this.a * Math.PI) / 180)*.5;
    let v = Math.sin((this.a * Math.PI) / 180)*.5;
    u = this.c * u ;
    v = this.c * v ;
    const y = this.l;
    return [y, u, v];
    }
    toString() {
        const [r, g, b] = this.toRGB();
        return `rgb(${r}, ${g}, ${b})`;
    }
    toHex() {
        const [r, g, b] = this.toRGB();
        const rHex = Math.round(r).toString(16).padStart(2, '0');
        const gHex = Math.round(g).toString(16).padStart(2, '0');
        const bHex = Math.round(b).toString(16).padStart(2, '0');
        return `#${rHex}${gHex}${bHex}`;
    }
}


export { CLAColor};