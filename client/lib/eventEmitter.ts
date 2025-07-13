export class EventEmitter<T = Record<string, any>> {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const eventName = event as string;
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  off<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
    const eventName = event as string;
    if (!this.events[eventName]) return;

    const index = this.events[eventName].indexOf(listener);
    if (index > -1) {
      this.events[eventName].splice(index, 1);
    }
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    const eventName = event as string;
    if (!this.events[eventName]) return;

    this.events[eventName].forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventName}:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}
