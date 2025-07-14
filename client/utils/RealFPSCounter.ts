/**
 * Real FPS Counter - Accurate frame rate measurement
 */

export class RealFPSCounter {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private callback: (fps: number) => void;
  private animationId: number | null = null;

  constructor(callback: (fps: number) => void) {
    this.callback = callback;
    this.startMeasuring();
  }

  private startMeasuring() {
    const measure = () => {
      this.frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - this.lastTime;

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / deltaTime);
        this.callback(this.fps);

        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      this.animationId = requestAnimationFrame(measure);
    };

    this.animationId = requestAnimationFrame(measure);
  }

  getCurrentFPS(): number {
    return this.fps;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
