import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

export function loadSkia() {
  return LoadSkiaWeb({
    locateFile: (file) => `/${file}`,
  });
}
