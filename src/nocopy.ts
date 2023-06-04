/**
 * Nocopy dictionary.
 */
export class Nocopy<T> {

  /**
   * Dictionary of previously processed Nocopy values.
   */
  private static readonly _dictionary: Map<any, Nocopy<any>> = new Map<any, Nocopy<any>>();

  /**
   * Iterable iterator to be initialised if the maximum dictionary size is reached.
   */
  private static keyIterator?: IterableIterator<any>;

  /**
   * Current Nocopy dictionary size.
   */
  public static get size(): number {
    return this._dictionary.size;
  }

  /**
   * Maximum size of the Nocopy dictionary.
   */
  private static _maxSize: number | undefined;

  /**
   * Set the maximum size of the Nocopy dictionary.
   */
  public static setMaxSize(size: number): void {
    this._maxSize = size;
  }

  /**
   * Array with data of type T.
   */
  protected readonly _data: T[];

  /**
   * Index of the provided value in the data array.
   */
  private readonly _iValue: number;

  /**
   * Value provided to the Nocopy constructor.
   */
  public get value(): T {
    return this._data[this._iValue];
  }

  /**
   * Define a new value in the Nocopy dictionary.
   * If value already exists, this returns the existing object.
   */
  public constructor(value: T) {
    const copy = Nocopy._dictionary.get(value);

    // Forced to initialise regardless of an existing copy.
    this._data = copy?._data || [ value ];
    this._iValue = 0;

    if (typeof copy !== 'undefined') {
      return copy;
    }

    Nocopy._dictionary.set(value, this);
    Nocopy.deleteOverflow();
  }

  public valueOf(): T {
    return this._data[this._iValue || 0];
  }

  /**
   * Returns the index if the value in `this._data`.
   */
  protected getIndex(value: T): number {
    const index: number = this._data.indexOf(value);

    if (index >= 0) {
      return index;
    }

    this._data.push(value);
    return this._data.length - 1;
  }

  /**
   * Delete any Nojack dictionary keys in chronological order if the
   * current dictionary size is greater than the maximum size (if set).
   */
  private static deleteOverflow(): void {
    if (typeof this._maxSize === 'undefined') {
      return;
    }

    if (this._dictionary.size < this._maxSize) {
      return;
    }

    if (typeof this.keyIterator === 'undefined') {
      this.keyIterator = this._dictionary.keys();
    }

    let iteration = this.keyIterator.next();

    if (!iteration.done) {
      this._dictionary.delete(iteration.value);
      return;
    }

    this.keyIterator = this._dictionary.keys();
    iteration = this.keyIterator.next();

    if (!iteration.done) {
      this._dictionary.delete(iteration.value);
    }
  }
}