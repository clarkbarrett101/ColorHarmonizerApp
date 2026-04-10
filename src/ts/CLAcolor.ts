export class CLARColor {
  c: number;
  l: number;
  ar: number;
  constructor(chroma: number, lightness: number, angleR: number) {
    this.c = chroma;
    this.l = lightness;
    this.ar = angleR;
    if(angleR>88/7){
      console.log("High angle:", angleR);
    }
  }
  toRGB() {
    const [y, u, v] = this.toYUV();
    const r =( y + 1.13983 * v)*255;
    const g = (y - 0.39465 * u - 0.58060 * v)*255;
    const b = (y + 2.03211 * u)*255;
    return [r, g, b];
  }
  toYUV() {  
    let u = Math.cos(this.ar)*.5;
    let v = Math.sin(this.ar) *.5;
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
    distanceFrom(other: CLARColor) {
        const deltaC = this.c - other.c;
        const deltaL = this.l - other.l;
        const deltaA = Math.min(
            Math.abs(this.ar - other.ar),
            22/7 - Math.abs(this.ar - other.ar)
        ) ;
        return Math.sqrt(deltaC * deltaC + deltaL * deltaL + deltaA * deltaA);
    }
    toArray() {
        return [this.c, this.l, this.ar];
    }
}

export type tCLARColor = {
  c: number;
  l: number;
  ar: number;
};