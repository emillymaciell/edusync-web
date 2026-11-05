import { ChangeDetectionStrategy, Component, EnvironmentProviders, Provider, output } from '@angular/core';
import { DemoLoginChoice } from './demo-login-choice';

export type { DemoLoginChoice };

export const DEMO_ENABLED = false;

export const DEMO_PROVIDERS: ReadonlyArray<Provider | EnvironmentProviders> = [];

@Component({
  selector: 'app-demo-banner-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DemoBannerHost {}

@Component({
  selector: 'app-demo-quick-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DemoQuickLogin {
  readonly selected = output<DemoLoginChoice>();
}
