/**
 * Web-compatible FontFaceObserver stub for Expo.
 *
 * The original fontfaceobserver library relies on width measurement of test string 'BESbswy'.
 * Icon fonts (like Ionicons from @expo/vector-icons) do not define glyphs for ASCII letters,
 * causing fontfaceobserver to never detect changes and reject with '6000ms timeout exceeded'.
 *
 * This implementation safely uses native document.fonts with graceful fallback so font
 * operations never throw timeout errors or crash the web application.
 */
export default class FontFaceObserver {
  family: string;
  descriptors: Record<string, unknown>;

  constructor(family: string, descriptors?: Record<string, unknown>) {
    this.family = family;
    this.descriptors = descriptors || {};
  }

  async load(text?: string | null, timeout: number = 3000): Promise<this> {
    if (typeof window !== "undefined" && typeof document !== "undefined" && "fonts" in document && document.fonts) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => setTimeout(resolve, Math.min(timeout, 2000))),
        ]);
      } catch {
        // Graceful fallback to system font
      }
    }
    return this;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = FontFaceObserver;
  module.exports.default = FontFaceObserver;
}
