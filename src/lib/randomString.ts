export default function randomString(numberOfBytes = 32): string {
  const array = new Uint8Array(numberOfBytes);
  crypto.getRandomValues(array);
  return new TextDecoder().decode(array);
}
