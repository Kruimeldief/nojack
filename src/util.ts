/**
 * Change any regular expression operators to normal characters.
 */
export function formatRegex(string: string): string {
  return string.replace(/([\\\^\[\]\-\$\.\*\(\)\?\:\=\!\+\{\}\,\|])/g, char => "\\" + char);
}