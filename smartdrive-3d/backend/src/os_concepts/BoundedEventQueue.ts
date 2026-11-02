/**
 * Bounded Event Queue (Operating Systems Producer-Consumer Pattern)
 *
 * Academic Demonstration:
 * Demonstrates a bounded FIFO buffer between the real-time simulation producer
 * and asynchronous consumers (WebSocket broadcaster & Database writer).
 *
 * OS Concepts Demonstrated:
 * 1. Bounded Buffer: Fixed capacity preventing memory exhaustion during high load.
 * 2. Drop Policies: Drops oldest unconsumed events or rejects with overflow counter when full.
 * 3. Watermark Telemetry: Tracks high-watermark utilization for system diagnostics.
 * 4. Decoupling: Producers (simulation tick) never block waiting on consumers (disk I/O or network sockets).
 */

import { WarningEvent, OSMetricQueueInfo } from '../types';

export class BoundedEventQueue {
  private queue: WarningEvent[] = [];
  private readonly capacity: number;
  private droppedCount: number = 0;
  private processedCount: number = 0;
  private highWaterMark: number = 0;

  constructor(capacity: number = 100) {
    this.capacity = capacity;
  }

  /**
   * Producer operation: Pushes a new event into the bounded buffer.
   * If capacity is exceeded, drops the oldest item (FIFO drop-oldest policy).
   */
  public enqueue(event: WarningEvent): boolean {
    if (this.queue.length >= this.capacity) {
      this.queue.shift(); // Drop oldest event
      this.droppedCount++;
    }

    this.queue.push(event);

    if (this.queue.length > this.highWaterMark) {
      this.highWaterMark = this.queue.length;
    }

    return true;
  }

  /**
   * Consumer operation: Retrieves the next event from the queue.
   */
  public dequeue(): WarningEvent | undefined {
    const item = this.queue.shift();
    if (item) {
      this.processedCount++;
    }
    return item;
  }

  /**
   * Flushes and drains all currently queued events (batch consumer processing).
   */
  public drain(): WarningEvent[] {
    const items = [...this.queue];
    this.queue = [];
    this.processedCount += items.length;
    return items;
  }

  /**
   * Returns current buffer diagnostics for the OS Explanation HUD panel.
   */
  public getMetrics(): OSMetricQueueInfo {
    return {
      size: this.queue.length,
      capacity: this.capacity,
      droppedCount: this.droppedCount,
      processedCount: this.processedCount,
      highWaterMark: this.highWaterMark,
    };
  }

  /**
   * Resets the queue state.
   */
  public reset(): void {
    this.queue = [];
    this.droppedCount = 0;
    this.processedCount = 0;
    this.highWaterMark = 0;
  }
}
