import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from '../../../core/services/toast.service';
import { Icon, IconName } from '../icon/icon';

const ICON_BY_TYPE: Record<ToastType, IconName> = {
  success: 'check-circle',
  error: 'alert-triangle',
  info: 'bell',
};

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.scss',
})
export class ToastHost {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;

  iconFor(type: ToastType): IconName {
    return ICON_BY_TYPE[type];
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
