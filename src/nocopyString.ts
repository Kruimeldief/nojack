import { Nocopy } from "./nocopy";
import { Nomock } from "./nomock";

/**
 * Enum to be used in `filter.ts` as a preset of Nomock data. See folder `json` in root.
 */
enum MockTypes
{
  emoji,
  confusable,
  invisible,
  emoticon,
  number,
}

/**
 * Temporary class that needs to be merged with `filter.ts`.
 */
export class NocopyString extends Nocopy<string> {

  /**
   * Temporary Nomock object until `filter.ts` is finished.
   */
  private static readonly nomock = new Nomock<keyof typeof MockTypes>({ disableDefaultData: false })
    .addSeries("confusable", 'E', '€', '3')
    .build({
      "confusable": {
        flags: "gi",
        disableWild: false,
        enforce: "brackets"
      }
    });

  /**
   * Index of clean string in the data array.
   */
  private _iClean?: number;

  /**
   * Get the clean string.
   */
  public get clean(): string
  {
    return typeof this._iClean === 'number'
      ? this._data[this._iClean]
      : this._data[(this._iClean = this.getIndex(NocopyString.nomock.clean(this.value)))];
  }

  /**
   * Define a new string in the Nocopy dictionary.
   * This returns the existing object if string already exists.
   */
  public constructor(string: string)
  {
    super(string);
  }
}