import fs from 'fs';

/**
 * Change any regular expression operators to normal characters.
 */
export function formatRegex(string: string): string
{
  return string.replace(/([\\\^\[\]\-\$\.\*\(\)\?\:\=\!\+\{\}\,\|])/g, char => "\\" + char);
}

/**
 * Read and parse a local JSON file. Does not create file by default.
 */
export function readJson<T>(path: string): T | undefined
{
  if (!fs.existsSync(path))
  {
    return undefined;
  }

  try
  {
    const file = fs.readFileSync(path, { encoding: 'utf-8' });
    const json: T = JSON.parse(file.toString()) as T;

    return json;
  }
  catch
  {
    return undefined;
  }
}