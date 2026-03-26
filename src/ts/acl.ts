function clark2RGB(chroma: number, lightness: number, angle: number): [number, number, number] {
    const [y, u, v] = clark2YUV(chroma, lightness, angle);
    const r =( y + 1.13983 * v)*255;
    const g = (y - 0.39465 * u - 0.58060 * v)*255;
    const b = (y + 2.03211 * u)*255;
    return [r, g, b];
}
function clark2YUV(chroma: number, lightness: number, angle: number): [number, number, number] {
    const u = chroma * Math.cos((angle * Math.PI) / 180);
    const v = chroma * Math.sin((angle * Math.PI) / 180);
    const y = lightness;
    return [y, u, v];
}

export { clark2RGB, clark2YUV };