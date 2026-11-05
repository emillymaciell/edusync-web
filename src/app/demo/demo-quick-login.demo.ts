import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { DEMO_ACCOUNTS } from './demo-fixtures';
import { DemoLoginChoice } from './demo-login-choice';

@Component({
  selector: 'app-demo-quick-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-quick-login.html',
  styleUrl: './demo-quick-login.scss',
})
export class DemoQuickLogin {
  readonly selected = output<DemoLoginChoice>();

  readonly options = [
    {
      label: 'Entrar como Admin',
      email: DEMO_ACCOUNTS.admin.email,
      password: DEMO_ACCOUNTS.admin.password,
    },
    {
      label: 'Entrar como Professora (Ana)',
      email: DEMO_ACCOUNTS.ana.email,
      password: DEMO_ACCOUNTS.ana.password,
    },
    {
      label: 'Entrar como Aluna (Camila)',
      email: DEMO_ACCOUNTS.camila.email,
      password: DEMO_ACCOUNTS.camila.password,
    },
  ] as const;

  choose(option: (typeof this.options)[number]): void {
    this.selected.emit({ email: option.email, password: option.password });
  }
}
