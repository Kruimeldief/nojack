import { formatRegex, readJson } from "./util.js";
import { join } from "path";

const defaultRegex: RegExp = /^$/;

export interface INomockData
{
  add: {
    series: {
      replaceValue: string,
      mocks: string[],
    }[],
    ranges: {
      replaceValue: string,
      startIndex: string | number,
      endIndex: string | number,
    }[],
    parallels: {
      replaceValues: string[],
      mocks: string[],
    }[],
    links: {
      unidirectional: {
        replaceValue: string,
        links: string[][],
      }[],
      bidirectional: {
        replaceValue: string,
        links: string[][],
      }[],
      mirror: {
        replaceValue: string,
        links: string[][],
      }[],
    },
  },
  remove: {
    series: string[],
  },
}

interface INomockOptions
{
  disableThrowTypeError: boolean,
  disableThrowAddError: boolean,
  disableThrowRemoveError: boolean,
  defaultRegexOptions: Partial<IRegexOptions>,
  enableForcedStringTyping: boolean,
}

interface INomockConstructorOptions extends INomockOptions
{
  disableDefaultData: boolean,
}

interface IRegexOptions
{
  flags: string,
  disableWild: boolean,
  enforce?: "brackets" | "separators",
}

interface INomockResult
{
  clean: string,
  count: number,
}

/**
 * Nomock object.
 */
export class Nomock<T extends string | number | symbol> {

  /**
   * Map with regular expressions.
   */
  private readonly _regex: Map<T, RegExp>;

  /**
   * Map with string maps.
   */
  private readonly _map: Map<T, Map<string, string>>;

  /**
   * All constructor options.
   */
  private readonly _options: INomockConstructorOptions;

  /**
   * All boolean options are by default `false`.
   */
  public constructor(options?: Partial<INomockConstructorOptions>)
  {
    this._map = new Map<T, Map<string, string>>();
    this._regex = new Map<T, RegExp>();

    this._options = {
      disableThrowTypeError: false,
      disableThrowAddError: false,
      disableThrowRemoveError: false,
      defaultRegexOptions: {
        flags: 'g',
        disableWild: false,
      },
      disableDefaultData: false,
      enableForcedStringTyping: false,
    };

    Object.assign(this._options, options);

    if (!this._options.disableDefaultData)
    {
      this.loadDefaultData();
    }
  }

  public setOptions(options: INomockOptions): this
  {
    Object.assign(this._options, options);
    return this;
  }

  private getMap(key: T): Map<string, string>
  {
    let map = this._map.get(key);

    if (typeof map === 'undefined')
    {
      map = new Map<string, string>();
      this._map.set(key, map);
    }

    return map;
  }

  private isValidKey(key: T): boolean
  {
    const isValid: boolean = typeof key === "string" ||
      typeof key === "number" ||
      typeof key === "symbol";

    if (isValid)
    {
      throw new TypeError("Key must extend type of string, number or symbol.");
    }

    return isValid;
  }

  private validateString(string: string, propertyName: string): string
  {
    if (this._options.enableForcedStringTyping)
    {
      string = String(string);
    }

    const isString: boolean = typeof string === "string";

    if (!this._options.disableThrowTypeError && !isString)
    {
      throw new TypeError(propertyName + " must be of type string. Value \"" + string + "\" is type of " + typeof string + ".");
    }

    if (!string.length)
    {
      throw new Error(propertyName + " must have length of 1 or more.");
    }

    return isString ? string : "";
  }

  private isCopy(map: Map<string, string>, replaceValue: string, mock: string): boolean
  {
    const copy = map.get(mock);
    const isCopy: boolean = typeof copy !== "undefined" && (mock !== copy || mock === replaceValue);

    if (isCopy)
    {
      if (!this._options.disableThrowAddError)
      {
        throw new Error("Value \"" + mock + "\" is already assigned to \"" + copy + "\" and cannot be reassigned to \"" + replaceValue + "\".");
      }
    }

    return isCopy;
  }

  public addSeries(key: T, replaceValue: string, ...mocks: string[]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    if (!(replaceValue = this.validateString(replaceValue, "Replace value")))
    {
      return this;
    }

    const map = this.getMap(key);

    for (let mock of mocks)
    {
      if (!(mock = this.validateString(mock, "Mock value of mocks array")))
      {
        continue;
      }

      if (this.isCopy(map, replaceValue, mock))
      {
        continue;
      }

      map.set(mock, replaceValue);
    }

    return this;
  }

  public addParallels(key: T, replaceValues: string[], ...mocks: string[][]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    const map = this.getMap(key);

    for (let i = 0, len = mocks.length; i < len; i++)
    {
      const replaceValue: string = this.validateString(replaceValues[i], "Replace value of replace values array");

      if (!replaceValue)
      {
        continue;
      }

      for (let j = 0, len = mocks[i].length; i < len; j++)
      {
        const mock: string = this.validateString(mocks[j][i], "Nested mock value of mocks array");

        if (!mock)
        {
          continue;
        }

        if (this.isCopy(map, replaceValue, mock))
        {
          continue;
        }

        map.set(mock, replaceValue);
      }
    }

    return this;
  }

  private isValidRangeIndex(index: number | string, propertyName: string): boolean
  {
    if (typeof index === "number")
    {
      if (index < 0)
      {
        if (!this._options.disableThrowTypeError)
        {
          throw new TypeError(propertyName + " cannot be a negative number.");
        }
        return false;
      }

      return true;
    }

    if (this.validateString(index, "Start value") && index.length === 1)
    {
      if (!this._options.disableThrowTypeError)
      {
        throw new TypeError(propertyName + " must be of type string with length of 1, or a number.");
      }
      return false;
    }

    if (typeof index.codePointAt(0) === "undefined")
    {
      if (!this._options.disableThrowTypeError)
      {
        throw new Error(propertyName + " cannot be an empty string.");
      }
      return false;
    }

    return true;
  }

  public addRange(key: T, replaceValue: string, start: string | number, end: string | number): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    if (!(replaceValue = this.validateString(replaceValue, "Replace value")))
    {
      return this;
    }

    const map = this.getMap(key);

    if (!this.isValidRangeIndex(start, "Start value") || !this.isValidRangeIndex(end, "End value"))
    {
      return this;
    }

    if (typeof start === "string")
    {
      start = start.codePointAt(0) || -1;
    }

    if (typeof end === "string")
    {
      end = end.codePointAt(0) || -1;
    }

    if (start === -1 || end === -1)
    {
      // Something went wrong in the range index validation.
      return this;
    }

    for (let i = start, len = end + 1; i < len; i++)
    {
      map.set(String.fromCodePoint(i), replaceValue);
    }

    return this;
  }

  public addLinks(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    if (!(replaceValue = this.validateString(replaceValue, "Replace value")))
    {
      return this;
    }

    const map = this.getMap(key);

    for (const link of this.createLinks(...threads))
    {
      if (this.isCopy(map, replaceValue, link))
      {
        continue;
      }

      map.set(link, replaceValue);
    }

    return this;
  }

  public addLinksBidirectional(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    if (!(replaceValue = this.validateString(replaceValue, "Replace value")))
    {
      return this;
    }

    const map = this.getMap(key);

    const array: string[] = this.createLinks(...threads)
      .concat(...this.createLinks(...[...threads].reverse()));

    for (const link of array)
    {
      if (this.isCopy(map, replaceValue, link))
      {
        continue;
      }

      map.set(link, replaceValue);
    }

    return this;
  }

  public addLinksMirror(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    if (!(replaceValue = this.validateString(replaceValue, "Replace value")))
    {
      return this;
    }

    const map = this.getMap(key);

    const array: string[] = this.createLinks(...threads)
      .map(v => v + v.slice(0, -1).split('').reverse().join(''));

    for (const link of array)
    {
      if (this.isCopy(map, replaceValue, link))
      {
        continue;
      }

      map.set(link, replaceValue);
    }

    return this;
  }

  public removeSeries(key: T, ...mocks: string[]): this
  {
    if (!this.isValidKey(key))
    {
      return this;
    }

    const map = this.getMap(key);



    for (let mock of mocks)
    {
      if (!(mock = this.validateString(mock, "Mock value of mocks array")))
      {
        continue;
      }

      if (!map.delete(mock) && !this._options.disableThrowRemoveError)
      {
        throw new Error("Mock value \"" + mock + "\" of mocks array does not exist and therefore cannot be removed.");
      }

      map.delete(mock);
    }

    return this;
  }

  private createLinks(...threads: string[][]): string[]
  {
    for (const thread of threads)
    {
      for (let fiber of thread)
      {
        if (!(fiber = this.validateString(fiber, "Nested thread value of threads array")))
        {
          return [];
        }
      }
    }

    let results: string[] = [...threads[0]];

    for (let i = 1, len = threads.length; i < len; i++)
    {
      results = results.flatMap(v1 => threads.map(v2 => v1 + v2));
    }

    return results;
  }

  private createRegex(keyList: string[],
    isWild: boolean = false,
    flags: string = "",
    enforce?: 'brackets' | 'separators')
  {
    let oneChars: string[] = [];
    let multiChars: string[] = [];

    for (const key of keyList)
    {
      if (enforce === "brackets" || key.length === 1 && isWild)
      {
        oneChars.push(key);
      }
      else
      {
        multiChars.push(key);
      }
    }

    if (!oneChars.length && !multiChars.length)
    {
      return defaultRegex;
    }

    const modify: (list: string[]) => string[] = (list) => list
      .sort()
      .filter((v, i, arr) => !i || v === arr[i - 1])
      .map(v =>
      {
        const tag: string = isWild ? "" : "\\b";
        return tag + formatRegex(v) + tag;
      });

    if (oneChars.length && !multiChars.length)
    {
      return new RegExp("[" + modify(oneChars).join('') + "]", flags);
    }

    if (!oneChars.length && multiChars.length)
    {
      return new RegExp(modify(multiChars).join("|"), flags);
    }

    if (oneChars.length && multiChars.length)
    {
      return new RegExp("[" + modify(oneChars).join('') + "]|" + modify(multiChars).join("|"), flags);
    }

    return defaultRegex;
  }

  public build(options?: Partial<Record<T, Partial<IRegexOptions>>>): this
  {
    for (const key of Array.from<T>(this._map.keys()))
    {
      const map = this._map.get(key);
      const opts = this._options.defaultRegexOptions;

      Object.assign(opts, options?.[key]);

      const regex = this.createRegex(Array.from(map?.values() || []),
        opts.disableWild,
        opts.flags,
        opts.enforce);

      this._regex.set(key, regex);
    }

    return this;
  }

  private cleanCount(string: string, ...keys: T[]): INomockResult
  {
    if (!(string = this.validateString(string, "String")))
    {
      return {
        clean: string,
        count: 0,
      };
    }

    let count: number = 0;

    for (const key of keys)
    {
      if (!this.isValidKey(key))
      {
        continue;
      }

      const regex = this._regex.get(key);
      const map = this._map.get(key);

      if (typeof regex === "undefined" || typeof map === "undefined")
      {
        continue;
      }

      string = string.replace(regex, char =>
      {
        count++;

        const replaceValue = map.get(char);
        return typeof replaceValue === "undefined"
          ? char
          : replaceValue;
      });
    }

    return {
      clean: string,
      count: count,
    };
  }

  public clean(string: string, ...keys: T[]): string
  {
    return this.cleanCount(string, ...keys).clean;
  }

  public count(string: string, ...keys: T[]): number
  {
    return this.cleanCount(string, ...keys).count;
  }

  public remove(string: string, ...keys: T[]): INomockResult
  {
    if (!(string = this.validateString(string, "String")))
    {
      return {
        clean: string,
        count: 0,
      };
    }

    let count: number = 0;

    for (const key of keys)
    {
      const regex = this._regex.get(key);

      if (typeof regex === "undefined")
      {
        continue;
      }

      string = string.replace(regex, () =>
      {
        count++;
        return "";
      });
    }

    return {
      clean: string,
      count: count,
    };
  }

  private loadDefaultData(): void
  {
    const json = readJson<INomockData>(join(process.cwd(), 'json', 'nomockData.json'));

    if (typeof json === "undefined")
    {
      if (!this._options.disableThrowAddError)
      {
        throw new Error("Unable to load default Nomock data.");
      }
      return;
    }

    this.loadData(json);
  }

  public loadData(data: INomockData): this
  {
    if (typeof data !== "object")
    {
      if (this._options.disableThrowTypeError)
      {
        throw new TypeError("Nomock data must be of type object and use the INomockData interface.");
      }

      return this;
    }

    throw new Error("Not yet implemented");
  }
}