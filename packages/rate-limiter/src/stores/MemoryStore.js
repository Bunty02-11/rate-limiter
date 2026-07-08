export class MemoryStore {
  constructor() {
    this.buckets = new Map();
  }

  async getBucket(key) {
    return this.buckets.get(key) || null;
  }

  async setBucket(key, bucket) {
    this.buckets.set(key, bucket);
  }
}