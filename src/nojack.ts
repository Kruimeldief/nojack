/**
 * Nojack settings.
 */
export interface INojackOptions {

  /**
   * Placeholder character or string to replace any matching blacklisted strings.
   */
  placeholder?: string,
}

/**
 * Nojack.
 */
export class Nojack<CategoryT extends number = number> {

  /**
   * Value to replace any matching blacklisted strings.
   */
  private _placeholder: string;

  /**
   * Hash-table with blacklisted strings.
   */
  private _blacklist: Map<string, CategoryT>;

  /**
   * Hash-table with whitelisted strings.
   */
  private _whitelist: Map<string, boolean>;

  /**
   * Character on which to split a string.
   */
  private _splitChar: string;

  /**
   * Maximum number of parts.
   */
  private _maxParts: number;

  /**
   * Create filter with options.
   */
  public constructor(options?: INojackOptions) {
    if (typeof options === 'object') {
      if (typeof options.placeholder !== 'string') {
        delete options.placeholder;
      }
    }

    this._placeholder = String(options?.placeholder?.[0] || '*');
    this._splitChar = ' ';
    this._maxParts = 6;

    this._blacklist = new Map<string, CategoryT>();
    this._whitelist = new Map<string, boolean>();
  }

  public blacklist(category: CategoryT, ...strings: string[]): void {
    for (let i = 0, len = strings.length; i < len; i++) {
      this._blacklist.set(String(strings[i]), category);
    }
  }

  public blacklistRemove(...strings: string[]): void {
    for (let i = 0, len = strings.length; i < len; i++) {
      this._blacklist.delete(String(strings[i]));
    }
  }

  public whitelist(...strings: string[]): void {
    for (let i = 0, len = strings.length; i < len; i++) {
      this._whitelist.set(String(strings[i]), true);
    }
  }

  public whitelistRemove(...strings: string[]): void {
    for (let i = 0, len = strings.length; i < len; i++) {
      this._whitelist.delete(String(strings[i]));
    }
  }

  public indexWhitelisted(strings: string | string[]): [number, number][] {
    const results: [number, number][] = [];

    const list: string[] = typeof strings === 'string'
      ? String(strings).split(this._splitChar)
      : strings.map(v => String(v));
    const length: number = list.length;

    let parts: number = Math.min(this._maxParts, length);
    let index: number = length - parts + 1;

    while (index-- || --parts && (index = length - parts)) {

      const slice: string = list
        .slice(index, index + parts)
        .join(this._splitChar);

      if (this._whitelist.has(slice)) {
        const start: number = list
          .slice(0, index)
          .join(this._splitChar)
          .length;
        results.push([start, start + slice.length]);
      }
    }

    return results;
  }

  public detectProfanity(strings: string | string[],
                         forEach: (profanity: string,
                                   category: CategoryT,
                                   start: number,
                                   end: number) => any)
  {
    const list: string[] = typeof strings === 'string'
      ? String(strings).split(this._splitChar)
      : strings.map(v => String(v));
    const length: number = list.length;

    let parts: number = Math.min(this._maxParts, length);
    let index: number = length - parts + 1;

    let whitelistIndexes: [number, number][] | undefined;
    let lenList: number[] | undefined;

    slicer:
    while (index-- || --parts && (index = length - parts)) {

      const end: number = index + parts;

      const slice: string = list
        .slice(index, end)
        .join(this._splitChar);

      const category: CategoryT | undefined = this._blacklist.get(slice);

      if (typeof category === 'undefined') {
        continue;
      }

      if (typeof whitelistIndexes === 'undefined') {
        whitelistIndexes = this.indexWhitelisted(strings);
      }

      for (const indexes of whitelistIndexes) {
        const hasIntersection: boolean = index <= indexes[0] && end >= indexes[1]
          || index >= indexes[0] && index <= indexes[1]
          || end >= indexes[0] && end <= indexes[1];

        if (hasIntersection) {
          continue slicer;
        }
      }

      if (typeof lenList === 'undefined') {
        lenList = list.map(v => v.length);
      }

      const start: number = lenList
        .slice(index, end)
        .reduce((sum, next) => sum + next, 0);

      forEach(slice, category, start, start + slice.length);
    }
  }

  public isProfane(string: string): boolean {
    return Boolean(this.findProfanity(string).length);
  }

  public findProfanity(string: string): CategoryT[] {
    const categories: CategoryT[] = [];

    this.detectProfanity(string, (_profanity, category) => {
      categories.push(category);
    });

    return categories;
  }

  public cleanProfanity(string: string): string {
    this.detectProfanity(string, (profanity, _category, start, end) => {
      string = string.slice(0, start) + this._placeholder.repeat(profanity.length) + string.slice(end)
    });

    return string;
  }
}