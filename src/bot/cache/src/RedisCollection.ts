import { redis } from "../../redis.ts";
import { Bot, Collection } from "../deps.ts";

export class RedisCollection<V> {
  maxSize: number | undefined;
  sweeper: CollectionSweeper<V> & { intervalId?: number } | undefined;

  constructor(hold: string, entries?: (readonly (readonly [bigint, V])[] | null), options?: CollectionOptions<V>) {
    this.hold = hold;
    this.maxSize = options?.maxSize;
    if (!options?.sweeper) return;
    this.startSweeper(options.sweeper);
    if (entries) {
      this.load = Promise.all(entries.map((entry) =>
        redis.hset(this.hold, entry[0].toString(), JSON.stringify(entry[1]))
      ))
    }
  }

  async loadEntries() {
    return await this.load
  }

  private hold: string
  // deno-lint-ignore no-explicit-any
  private load: Promise<any[]> | undefined = undefined

  startSweeper(options: CollectionSweeper<V>): number {
    if (this.sweeper?.intervalId) clearInterval(this.sweeper.intervalId);

    this.sweeper = options;
    this.sweeper.intervalId = setInterval(() => {
      this.forEach(async (value, key) => {
        if (!this.sweeper?.filter(value, key, options.bot)) return;

        await this.delete(key);
        return key;
      });
    }, options.interval);

    return this.sweeper.intervalId!;
  }

  stopSweeper(): void {
    return clearInterval(this.sweeper?.intervalId);
  }

  changeSweeperInterval(newInterval: number) {
    if (!this.sweeper) return;

    this.startSweeper({ filter: this.sweeper.filter, interval: newInterval });
  }

  changeSweeperFilter(newFilter: (value: V, key: bigint, bot: Bot) => boolean) {
    if (!this.sweeper) return;

    this.startSweeper({ filter: newFilter, interval: this.sweeper.interval });
  }

  get size() {
    return redis.hlen(this.hold)
  }

  async set(key: bigint, value: V) {
    // When this collection is maxSizeed make sure we can add first
    if ((this.maxSize || this.maxSize === 0) && (await this.size) >= this.maxSize) {
      return this;
    }

    await redis.hset(this.hold, key.toString(), JSON.stringify(value));
    return this;
  }

  async get(key: bigint): Promise<V | undefined> {
    const record = await redis.hget(this.hold, key.toString())
    return record ? JSON.parse(record) : undefined;
  }

  async delete(key: bigint) {
    return (await redis.hdel(this.hold, key.toString())) === 1
  }

  async has(key: bigint) {
    return (await redis.hexists(this.hold, key.toString())) === 1;
  }

  async keys() {
    return (await redis.hkeys(this.hold)).map((value) => BigInt(value)).values();
  }

  async values() {
    return (await redis.hvals(this.hold)).map((value) => JSON.parse(value)).values()
  }

  // deno-lint-ignore no-explicit-any
  async forEach(callbackfn: (value: V, key: bigint, map: Map<string, number>) => void, _thisArg?: any) {
    const records = await redis.hgetall(this.hold)
    for (let i = 0; i < records.length / 2; i++) {
      callbackfn(JSON.parse(records[i * 2 + 1]), BigInt(records[i * 2]), new Map());
    }
  }

  async array() {
    return [...await this.values()];
  }

  /** Retrieve the value of the first element in this collection */
  async first(): Promise<Awaited<V> | undefined> {
    return (await this.values()).next().value;
  }

  async last(): Promise<Awaited<V> | undefined> {
    return [...await this.values()][await this.size - 1];
  }

  async random(): Promise<Awaited<V> | undefined> {
    const array = [...await this.values()];
    return array[Math.floor(Math.random() * array.length)];
  }

  async find(callback: (value: V, key: bigint) => boolean) {
    for (const key of await this.keys()) {
      const value = (await this.get(key))!;
      if (callback(value, BigInt(key))) return value;
    }
    // If nothing matched
    return;
  }

  filter(callback: (value: V, key: bigint) => boolean) {
    const relevant = new Collection<bigint, V>();
    this.forEach((value, key) => {
      if (callback(value, key)) relevant.set(key, value);
    });

    return relevant;
  }

  async map<T>(callback: (value: V, key: bigint) => T) {
    const results = [];
    for (const key of await this.keys()) {
      const value = (await this.get(key))!;
      results.push(callback(value, key));
    }
    return results;
  }

  async some(callback: (value: V, key: bigint) => boolean) {
    for (const key of await this.keys()) {
      const value = (await this.get(key))!;
      if (callback(value, key)) return true;
    }

    return false;
  }

  async every(callback: (value: V, key: bigint) => boolean) {
    for (const key of await this.keys()) {
      const value = (await this.get(key))!;
      if (!callback(value, key)) return false;
    }

    return true;
  }

  async reduce<T>(callback: (accumulator: T, value: V, key: bigint) => T, initialValue?: T): Promise<T> {
    let accumulator: T = initialValue!;

    for (const key of await this.keys()) {
      const value = (await this.get(key))!;
      accumulator = callback(accumulator, value, key);
    }

    return accumulator;
  }
}

export interface CollectionOptions<V> {
  sweeper?: CollectionSweeper<V>;
  maxSize?: number;
}

export interface CollectionSweeper<V> {
  /** The filter to determine whether an element should be deleted or not */
  // deno-lint-ignore no-explicit-any
  filter: (value: V, key: bigint, ...args: any[]) => boolean;
  /** The interval in which the sweeper should run */
  interval: number;
  /** The bot object itself */
  bot?: Bot;
}
