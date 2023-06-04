import { formatRegex } from "./util";

const defaultRegex: RegExp = /^$/;

interface INomockOptions {
  shouldThrowBuildError: boolean,
}

interface IRegexOptions {
  flags: string,
  isWild: boolean,
  enforce?: "brackets" | "separators",
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
  private readonly _options: INomockOptions;

  /**
   * Private constructor.
   */
  public constructor(options?: INomockOptions)
  {
    new Map<string[], string>();
    this._map = new Map<T, Map<string, string>>();
    this._regex = new Map<T, RegExp>();

    this._options = {
      shouldThrowBuildError: true,
    };
    Object.assign(this._options, options);
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

  private throwError(error: Error): this
  {
    if (this._options.shouldThrowBuildError)
      {
        throw error;
      }
    return this;
  }

  public add(key: T, replaceValue: string, ...mocks: string[]): this
  {
    if (typeof replaceValue !== 'string')
    {
      return this.throwError(
        new TypeError("Replace value must be of type string.")
      );
    }

    const map = this.getMap(key);

    for (let i = 0, len = mocks.length; i < len; i++)
    {
      const mock: string = mocks[i];

      if (typeof mock !== "string")
      {
        this.throwError(
          new TypeError("Mock value on index " + i + " must be of type string.")
        );
        continue;
      }

      map.set(mock, replaceValue);
    }

    return this;
  }

  public addParallels(key: T, replaceValues: string[], ...mocks: string[][]): this
  {
    const map = this.getMap(key);

    for (let i = 0, len = mocks.length; i < len; i++)
    {
      const replaceValue: string = replaceValues[i];

      if (typeof replaceValue !== "string")
      {
        this.throwError(
          new TypeError("Replace value on index " + i + " must be of type string.")
        );
        continue;
      }

      for (let j = 0, len = mocks[i].length; i < len; j++)
      {
        const mock: string = mocks[i][j];

        if (typeof mock !== "string")
        {
          this.throwError(
            new TypeError("Mock value on index " + j + " in array on index " + i + " must be of type string.")
          );
          continue;
        }

        map.set(mock, replaceValue);
      }
    }

    return this;
  }

  public addLinks(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (typeof replaceValue !== "string")
    {
      return this.throwError(
        new TypeError("Replace value must be of type string.")
      );
    }

    const map = this.getMap(key);

    for (const thread of this.createLinks(...threads))
    {
      map.set(thread, replaceValue);
    }

    return this;
  }

  public addTLinksBidirectional(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (typeof replaceValue !== "string")
    {
      return this.throwError(
        new TypeError("Replace value must be of type string.")
      );
    }

    const map = this.getMap(key);

    for (const thread of this.createLinks(...threads))
    {
      map.set(thread, replaceValue);
    }

    for (const thread of this.createLinks(...[...threads].reverse()))
    {
      map.set(thread, replaceValue);
    }

    return this;
  }

  public addLinksMirror(key: T, replaceValue: string, ...threads: string[][]): this
  {
    if (typeof replaceValue !== "string")
    {
      return this.throwError(
        new TypeError("Replace value must be of type string.")
      );
    }

    const map = this.getMap(key);

    for (const thread of this.createLinks(...threads)
      .map(v => v + v.slice(0, -1).split('').reverse().join('')))
    {
      map.set(thread, replaceValue);
    }

    return this;
  }

  public remove(key: T, ...mocks: string[]): this
  {
    const map = this.getMap(key);

    for (let i = 0, len = mocks.length; i < len; i++)
    {
      const mock: string = mocks[i];

      if (typeof mock !== "string")
      {
        this.throwError(
          new TypeError("Mock value on index " + i + " must be of type string.")
        );
        continue;
      }

      map.delete(mock);
    }

    return this;
  }

  private createLinks(...threads: string[][]): string[]
  {
    for (let i = 0, len = threads.length; i < len; i++)
    {
      for (let j = 0, len = threads[i].length; j < len; j++)
      {
        if (typeof threads[i][j] !== "string")
        {
          this.throwError(
            new TypeError("Thread value on index " + j + " in array on index " + i + " must be of type string.")
          );
        }
      }
    }

    let results: string[] = threads[0];

    for (let i = 1, len = threads.length; i < len; i++)
    {
      results = results.flatMap(v1 => threads.map(v2 => v1 + v2));
    }

    return results;
  }

  private createRegex(keyList: string[],
                      flags: string,
                      isWild: boolean,
                      enforce?: 'brackets' | 'separators')
  {
    let oneChars: string[] = [];
    let multiChars: string[] = [];

    for (const key of keyList) {
      if (enforce === "brackets" || key.length === 1 && isWild) {
        oneChars.push(key);
      }
      else {
        multiChars.push(key);
      }
    }

    if (!oneChars.length && !multiChars.length) {
      return defaultRegex;
    }

    const modify: (list: string[]) => string[] = (list) => list
      .sort()
      .filter((v, i, arr) => !i || v === arr[i - 1])
      .map(v => {
        const tag: string = isWild ? "" : "\\b";
        return tag + formatRegex(v) + tag;
      });

    if (oneChars.length && !multiChars.length) {
      return new RegExp("[" + modify(oneChars).join('') + "]", flags);
    }

    if (!oneChars.length && multiChars.length) {
      return new RegExp(modify(multiChars).join("|"), flags);
    }

    if (oneChars.length && multiChars.length) {
      return new RegExp("[" + modify(oneChars).join('') + "]|" + modify(multiChars).join("|"), flags);
    }

    return defaultRegex;
  }

  public build(options?: Partial<Record<T, IRegexOptions>>): this
  {
    for (const key of Array.from<T>(this._map.keys()))
    {
      const map = this._map.get(key);

      const opts: IRegexOptions = {
        flags: 'g',
        isWild: true,
      };
      Object.assign(opts, options?.[key]);

      const regex = this.createRegex(Array.from(map?.values() || []),
                                     opts.flags,
                                     opts.isWild,
                                     opts.enforce);

      this._regex.set(key, regex);
    }

    return this;
  }

  private cleanCount(string: string, ...keys: T[]): [string, number]
  {
    let count: number = 0;

    for (const key of keys)
    {
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

    return [string, count];
  }

  public clean(string: string, ...keys: T[]): string
  {
    return this.cleanCount(string, ...keys)[0];
  }

  public count(string: string, ...keys: T[]): number
  {
    return this.cleanCount(string, ...keys)[1];
  }
}