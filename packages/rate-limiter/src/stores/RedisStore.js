// src/stores/RedisStore.js
import { createClient } from "redis";

export class RedisStore {
  constructor({ host, port, password }) {
    this.client = createClient({
      username: "default",
      password,
      socket: { host, port },
    });

    this.client.on("error", (err) => console.error("Redis Client Error", err));
    this.connected = this.client.connect();
  }

  async getBucket(key) {
    await this.connected;
    const raw = await this.client.get(`bucket:${key}`);
    return raw ? JSON.parse(raw) : null;
  }

  async setBucket(key, bucket) {
    await this.connected;
    await this.client.set(`bucket:${key}`, JSON.stringify(bucket), { EX: 3600 });
  }
}