import { NocopyString } from "./nocopyString";
import { INojackOptions, Nojack } from "./nojack";
import { Nomock } from "./nomock";

/**
 * Filter settings.
 */
export interface IFilterOptions extends INojackOptions {
  useNocopy?: boolean,
  shouldCleanLists?: boolean,
}

export class Filter<CategoryT extends number = number> {

  private readonly _nojack: Nojack;

  private readonly _nomock: Nomock;

  private readonly _options: IFilterOptions;

  /**
   * Create filter with options.
   */
  public constructor(options?: IFilterOptions) {
    this._options = {
      useNocopy: true,
      shouldCleanLists: true,
    }
    Object.assign(this._options, options);

    this._nojack = new Nojack(options);
    this._nomock = Nomock.instance;
  }

  public blacklist(category: CategoryT, ...strings: string[]): this {
    this._options.shouldCleanLists
      ? this._nojack.blacklist(category, ...strings.map(v => this._nomock?.clean(v)))
      : this._nojack.blacklist(category, ...strings);
    return this;
  }

  public blacklistRemove(...strings: string[]): this {
    this._options.shouldCleanLists
      ? this._nojack.blacklistRemove(...strings.map(v => this._nomock?.clean(v)))
      : this._nojack.blacklistRemove(...strings);
    return this;
  }

  public whitelist(...strings: string[]): this {
    this._options.shouldCleanLists
      ? this._nojack.whitelist(...strings.map(v => this._nomock?.clean(v)))
      : this._nojack.whitelist(...strings);
    return this;
  }

  public whitelistRemove(...strings: string[]): this {
    this._options.shouldCleanLists
      ? this._nojack.whitelistRemove(...strings.map(v => this._nomock?.clean(v)))
      : this._nojack.whitelistRemove(...strings);
    return this;
  }

  public isProfane(string: string): boolean {
    string = this._options.useNocopy
      ? new NocopyString(string).clean
      : this._nomock.clean(string);
    return this._nojack.isProfane(string);
  }

  public removeProfane(string: string): string {
    string = this._options.useNocopy
      ? new NocopyString(string).clean
      : this._nomock.clean(string);
    return this._nojack.cleanProfanity(string);
  }
}