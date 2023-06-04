import { formatRegex } from "./util";

/**
 * Classifications of character types.
 * The order (top to bottom) determines the order of detection.
 */
enum MockType {
  emoji,
  confusable,
  invisible,
  emoticon,
  number,
  whitelist,
  ignoreable,
}

const defaultRegex: RegExp = /^$/;

/**
 * Object with a regular expression for each MockType key.
 */
type RegexObject = Record<keyof typeof MockType, RegExp>;

/**
 * Object with a Map object for each MockType key.
 */
type MapObject = Record<keyof typeof MockType, Map<string, string>>;

/**
 * Object with a Record object for each MockType key.
 */
type RecordObject = Record<keyof typeof MockType, Record<string, string>>;

/**
 * Nomock object.
 */
export class Nomock {

  /**
   * Singleton instance.
   */
  private static _instance?: Nomock;

  /**
   * Singleton instance.
   */
  public static get instance(): Nomock {
    return typeof this._instance === 'undefined'
      ? this._instance = new Nomock()
      : this._instance;
  }

  /**
   * Object with regular expressions.
   */
  private readonly regex: RegexObject;

  /**
   * Object with string maps.
   */
  private readonly map: MapObject;

  /**
   * Private constructor.
   */
  private constructor() {
    this.map = {
      confusable: new Map<keyof typeof MockType, string>(),
      emoji: new Map<keyof typeof MockType, string>(),
      emoticon: new Map<keyof typeof MockType, string>(),
      number: new Map<keyof typeof MockType, string>(),
      whitelist: new Map<keyof typeof MockType, string>(),
      ignoreable: new Map<keyof typeof MockType, string>(),
      invisible: new Map<keyof typeof MockType, string>(),
    };

    this.regex = {
      confusable: defaultRegex,
      emoji: defaultRegex,
      emoticon: defaultRegex,
      number: defaultRegex,
      whitelist: defaultRegex,
      ignoreable: defaultRegex,
      invisible: defaultRegex,
    };
  }
  
  public build() {

  }

  private createRegex(keyList: string[],
                      flags: string,
                      isWild: boolean,
                      enforce: 'brackets' | 'separators')
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

  public clean(string: string): string
  {
    return string;
  }
}