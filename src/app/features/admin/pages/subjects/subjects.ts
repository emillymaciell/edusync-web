import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SubjectIconKey } from '../../../../core/models/subject.model';
import { Icon } from '../../../../shared/ui/icon/icon';
import { StatusBadge, toneForStatus } from '../../../../shared/ui/status-badge/status-badge';
import { SUBJECT_ICON_OPTIONS, subjectIconFor } from '../../../../shared/subject-icon.util';

const COLOR_OPTIONS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2'];
const AREA_BY_ICON: Record<SubjectIconKey, string> = {
  languages: 'Idiomas',
  math: 'Exatas',
  humanities: 'Humanas',
  tech: 'Tecnologia',
  arts: 'Artes',
};

@Component({
  selector: 'app-admin-subjects',
  imports: [ReactiveFormsModule, Icon, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subjects.html',
  styleUrl: './subjects.scss',
})
export class Subjects implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly subjects = this.adminService.subjects;
  readonly toneForStatus = toneForStatus;
  readonly colorOptions = COLOR_OPTIONS;
  readonly iconOptions = SUBJECT_ICON_OPTIONS;
  readonly subjectIconFor = subjectIconFor;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    color: [COLOR_OPTIONS[0], Validators.required],
    icon: ['languages' as SubjectIconKey, Validators.required],
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.fetchSubjects().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Não foi possível carregar as matérias.');
        this.toast.error('Não foi possível carregar as matérias.');
      },
    });
  }

  get previewArea(): string {
    return AREA_BY_ICON[this.form.controls.icon.value];
  }

  selectColor(color: string): void {
    this.form.controls.color.setValue(color);
  }

  selectIcon(icon: SubjectIconKey): void {
    this.form.controls.icon.setValue(icon);
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isSubmitting.set(true);

    this.adminService
      .createSubject({
        name: value.name,
        description: value.description,
        color: value.color,
        icon: value.icon,
        area: AREA_BY_ICON[value.icon],
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.form.reset({ name: '', description: '', color: COLOR_OPTIONS[0], icon: 'languages' });
          this.toast.success('Matéria criada com sucesso.');
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toast.error('Não foi possível criar a matéria.');
        },
      });
  }
}
