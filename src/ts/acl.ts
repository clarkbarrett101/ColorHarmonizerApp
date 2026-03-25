class acl {
    angle: number;
    chroma: number;
    lightness: number;
  constructor(angle: number, chroma: number, lightness: number) {
    this.angle = angle;
    this.chroma = chroma;
    this.lightness = lightness;
  }
  function toYUV(){
    const y = this.lightness;
    const u = this.chroma * Math.cos((this.angle * Math.PI) / 180);
    const v = this.chroma * Math.sin((this.angle * Math.PI) / 180);
    return { y, u, v };
  }
 function toRGB(){
    const { y, u, v } = this.toYUV();
    const r = y + 1.13983 * v;
    const g = y - 0.39465 * u - 0.58060 * v;
    const b = y + 2.03211 * u;
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
    };
  }
}
export { acl };