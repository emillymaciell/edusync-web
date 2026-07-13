import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../shared/ui/icon/icon';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-first-access',
  imports: [ReactiveFormsModule, Icon, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './first-access.html',
  styleUrl: './first-access.scss',
})
export class FirstAccess {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly isLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isLoading()) return;

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.isLoading.set(true);

    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.auth.markPasswordChanged();
        this.toastService.success('Senha atualizada com sucesso!');
        const role = this.auth.role();
        if (role) {
          this.router.navigate([`/${role}`]);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const message =
          err.status === 400 || err.status === 401
            ? this.extractErrorMessage(err) || 'Senha atual incorreta. Verifique e tente novamente.'
            : 'Não foi possível atualizar a senha agora. Tente novamente em instantes.';
        this.toastService.error(message);
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;

    if (typeof body === 'string') return body;
    if (body?.message) return String(body.message);
    if (body?.error) return String(body.error);

    return '';
  }
}
