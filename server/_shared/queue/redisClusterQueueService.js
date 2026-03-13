export class RedisClusterQueueService {
  constructor(client, queueName = "dispatch_jobs") {
    this.client = client;
    this.queueName = queueName;
  }

  async enqueue(job) {
    if (!this.client) return false;
    await this.client.lpush(this.queueName, JSON.stringify(job));
    return true;
  }

  async dequeue() {
    if (!this.client) return null;
    const row = await this.client.rpop(this.queueName);
    return row ? JSON.parse(row) : null;
  }

  async length() {
    if (!this.client) return 0;
    return this.client.llen(this.queueName);
  }
}
