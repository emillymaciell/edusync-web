import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../shared/ui/icon/icon';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

const PENDING_APPROVAL_MESSAGE =
  'Seu cadastro está em análise. Aguarde a aprovação do administrador para acessar a plataforma.';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, Icon, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly isLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isLoading()) return;

    const { email, password } = this.form.getRawValue();
    this.isLoading.set(true);

    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.isLoading.set(false);

        if (user.forcePasswordChange === true) {
          this.router.navigate(['/auth/first-access']);
          return;
        }

        if (user.role === 'teacher') {
          if (user.subjectName?.trim() || user.subjectId != null) {
            this.router.navigate(['/teacher']);
          } else {
            this.router.navigate(['/teacher/onboarding']);
          }
          return;
        }

        this.router.navigate([`/${user.role}`]);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);

        if (this.isPendingApprovalError(err)) {
          this.toastService.info(PENDING_APPROVAL_MESSAGE);
          return;
        }

        const message =
          err.status === 401 || err.status === 403
            ? this.extractErrorMessage(err) || 'E-mail ou senha inválidos.'
            : 'Não foi possível entrar agora. Tente novamente em instantes.';
        this.toastService.error(message);
      },
    });
  }

  private isPendingApprovalError(err: HttpErrorResponse): boolean {
    const message = this.extractErrorMessage(err).toLowerCase();

    const pendingKeywords = [
      'aprov',
      'pendente',
      'análise',
      'analise',
      'approval',
      'pending',
      'aguardando',
      'não aprovado',
      'nao aprovado',
      'cadastro não aprovado',
      'cadastro nao aprovado',
    ];
    const hasPendingMessage = pendingKeywords.some((keyword) => message.includes(keyword));

    return err.status === 403 || (err.status === 401 && hasPendingMessage);
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;

    if (typeof body === 'string') return body;
    if (body?.message) return String(body.message);
    if (body?.error) return String(body.error);

    return '';
  }
}
