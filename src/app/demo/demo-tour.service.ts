import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DemoTourService {
  private readonly requests = signal(0);
  readonly replayCount = this.requests.asReadonly();

  replay(): void {
    this.requests.update((count) => count + 1);
  }
}
