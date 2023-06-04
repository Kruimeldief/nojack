import { Nocopy } from "./nocopy";
import { Nomock } from "./nomock";

/**
 * Nocopy object for string modifications.
 */
export class NocopyString extends Nocopy<string> {

  /**
   * Index of clean string in the data array.
   */
  private _iClean?: number;

  /**
   * Get the clean string.
   */
  public get clean(): string {
    return typeof this._iClean === 'number'
      ? this._data[this._iClean]
      : this._data[( this._iClean = this.getIndex(Nomock.instance.clean(this.value)) )];
  }

  /**
   * Define a new string in the Nocopy dictionary.
   * This returns the existing object if string already exists.
   */
  public constructor(string: string) {
    super(string);
  }
}