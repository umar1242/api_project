/**
 * This polyfill ensures that any BigInt returned in a JSON response
 * is automatically converted to a string, preventing the
 * "TypeError: Do not know how to serialize a BigInt" error.
 */
if (typeof BigInt !== "undefined") {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}
