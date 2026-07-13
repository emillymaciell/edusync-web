import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SubjectService } from '../../../core/services/subject.service';
import { ToastService } from '../../../core/services/toast.service';
import { SubjectResponse } from '../../../core/models/subject.model';
import { Icon } from '../../../shared/ui/icon/icon';
import { PrivacyPolicyDialog } from '../../../shared/ui/privacy-policy-dialog/privacy-policy-dialog';
import { ThemeToggle } from '../../../shared/ui/theme-toggle/theme-toggle';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Icon, PrivacyPolicyDialog, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly subjectService = inject(SubjectService);
  private readonly toastService = inject(ToastService);

  readonly submitted = signal(false);
  readonly requestSent = signal(false);
  readonly isSubmitting = signal(false);
  readonly showPrivacyDialog = signal(false);
  readonly subjects = signal<SubjectResponse[]>([]);
  readonly subjectsLoading = signal(false);
  readonly subjectsError = signal<string | null>(null);

  readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    subjectId: [null as number | null, Validators.required],
    acceptTerms: [false, Validators.requiredTrue],
    acceptMarketing: [false],
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  openPrivacyDialog(event: Event): void {
    event.preventDefault();
    this.showPrivacyDialog.set(true);
  }

  closePrivacyDialog(): void {
    this.showPrivacyDialog.set(false);
  }

  loadSubjects(): void {
    this.subjectsLoading.set(true);
    this.subjectsError.set(null);

    this.subjectService
      .getPublicSubjects()
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('[Register] Falha ao carregar matérias públicas:', {
            url: err.url,
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error,
          });
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (subjects) => {
          this.subjects.set(subjects);
          this.subjectsLoading.set(false);
        },
        error: () => {
          this.subjects.set([]);
          this.subjectsLoading.set(false);
          this.subjectsError.set('Não foi possível carregar as matérias.');
        },
      });
  }

  selectSubject(id: number): void {
    this.registerForm.patchValue({ subjectId: Number(id) });
    this.registerForm.controls.subjectId.markAsDirty();
    this.registerForm.controls.subjectId.markAsTouched();
    this.registerForm.controls.subjectId.updateValueAndValidity();
  }

  submit(): void {
    this.submitted.set(true);
    if (this.registerForm.invalid || this.isSubmitting()) return;

    const { name, email, password, subjectId } = this.registerForm.getRawValue();
    if (!name || !email || !password || subjectId === null) return;

    const numericSubjectId = Number(subjectId);
    if (!Number.isFinite(numericSubjectId)) return;

    console.log('Payload de envio:', this.registerForm.value);

    this.isSubmitting.set(true);

    this.auth
      .register({
        name,
        email,
        password,
        role: 'TEACHER',
        subjectId: numericSubjectId,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.requestSent.set(true);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const message =
            err.status === 409
              ? err.error?.message ?? 'Já existe uma conta com esse e-mail.'
              : 'Não foi possível enviar sua solicitação agora. Tente novamente em instantes.';
          this.toastService.error(message);
        },
      });
  }
}
