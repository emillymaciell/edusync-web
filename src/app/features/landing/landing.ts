import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon, IconName } from '../../shared/ui/icon/icon';
import { PrivacyPolicyDialog } from '../../shared/ui/privacy-policy-dialog/privacy-policy-dialog';
import { ThemeToggle } from '../../shared/ui/theme-toggle/theme-toggle';

interface Feature {
  icon: IconName;
  title: string;
  description: string;
}

interface Experience {
  role: string;
  icon: IconName;
  title: string;
  description: string;
  bullets: string[];
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Icon, PrivacyPolicyDialog, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing implements OnInit, OnDestroy {
  readonly cookieBannerVisible = signal(true);
  readonly showPrivacyDialog = signal(false);
  readonly mobileMenuOpen = signal(false);

  private intervalCarrossel1: ReturnType<typeof setInterval> | null = null;
  private intervalCarrossel2: ReturnType<typeof setInterval> | null = null;

  openPrivacyDialog(event: Event): void {
    event.preventDefault();
    this.showPrivacyDialog.set(true);
  }

  closePrivacyDialog(): void {
    this.showPrivacyDialog.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  readonly features: Feature[] = [
    { icon: 'layers', title: 'Matérias por área', description: 'O admin configura a plataforma e cria matérias personalizadas para cada área de ensino.' },
    { icon: 'sparkles', title: 'Fluxo de aula contínuo', description: 'Do agendamento de aulas ao vivo à gestão de tarefas, tudo organizado em uma interface ágil e padronizada.' },
    { icon: 'users', title: 'Experiência do aluno leve', description: 'Uma área intuitiva, sem fricção, focada em manter o aluno engajado e aprendendo.' },
    { icon: 'chart', title: 'IA que entende dificuldades', description: 'Gere aulas, atividades e identifique onde cada aluno precisa de mais atenção.' },
  ];

  readonly experiences: Experience[] = [
    {
      role: 'Admin',
      icon: 'shield',
      title: 'Controle total da plataforma',
      description: 'Aprove professores, gerencie matérias por área e acompanhe toda a operação em um só lugar.',
      bullets: ['Aprovação de professores', 'Matérias por área', 'Métricas da plataforma'],
    },
    {
      role: 'Professor',
      icon: 'book',
      title: 'O professor como protagonista',
      description: 'Gere aulas com IA, acompanhe cada aluno de perto e gerencie tarefas e aulas ao vivo sem esforço.',
      bullets: ['Fábrica de aulas com IA', 'Insights de progresso por aluno', 'Aulas ao vivo e gravadas'],
    },
    {
      role: 'Aluno',
      icon: 'graduation-cap',
      title: 'Aprender sem fricção',
      description: 'Uma trilha clara, tarefas organizadas e aulas ao alcance de um toque — em qualquer dispositivo.',
      bullets: ['Trilha de aprendizado gamificada', 'Tarefas e aulas em um só lugar', 'Acompanhamento do progresso'],
    },
  ];

  readonly activeExperience = signal(0);

  readonly testimonials: Testimonial[] = [
    {
      quote: 'Antes eu perdia horas montando material. Com a IA da plataforma, crio uma aula completa em minutos e ainda entendo onde meus alunos travam.',
      name: 'Marina Alves',
      role: 'Professora de Inglês',
    },
    {
      quote: 'A área do aluno é tão simples que meus filhos usam sozinhos. Eles adoram ver o progresso avançando a cada aula concluída.',
      name: 'Juliana Costa',
      role: 'Mãe e assinante',
    },
    {
      quote: 'Provisionar novos professores e organizar bases por matéria ficou trivial. Em minutos a operação inteira está no ar.',
      name: 'Ricardo Monteiro',
      role: 'Gestor de operação EdTech',
    },
  ];

  readonly activeTestimonial = signal(0);

  ngOnInit(): void {
    this.startExperienceAutoPlay();
    this.startTestimonialAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopExperienceAutoPlay();
    this.stopTestimonialAutoPlay();
  }

  startExperienceAutoPlay(): void {
    this.stopExperienceAutoPlay();
    this.intervalCarrossel1 = setInterval(() => this.nextExperienceSlide(), 5000);
  }

  stopExperienceAutoPlay(): void {
    if (this.intervalCarrossel1 !== null) {
      clearInterval(this.intervalCarrossel1);
      this.intervalCarrossel1 = null;
    }
  }

  startTestimonialAutoPlay(): void {
    this.stopTestimonialAutoPlay();
    this.intervalCarrossel2 = setInterval(() => this.nextTestimonialSlide(), 5000);
  }

  stopTestimonialAutoPlay(): void {
    if (this.intervalCarrossel2 !== null) {
      clearInterval(this.intervalCarrossel2);
      this.intervalCarrossel2 = null;
    }
  }

  selectExperience(index: number): void {
    this.stopExperienceAutoPlay();
    this.activeExperience.set(index);
    this.startExperienceAutoPlay();
  }

  prevTestimonial(): void {
    this.stopTestimonialAutoPlay();
    this.activeTestimonial.update((i) => (i === 0 ? this.testimonials.length - 1 : i - 1));
    this.startTestimonialAutoPlay();
  }

  nextTestimonial(): void {
    this.stopTestimonialAutoPlay();
    this.nextTestimonialSlide();
    this.startTestimonialAutoPlay();
  }

  selectTestimonial(index: number): void {
    this.stopTestimonialAutoPlay();
    this.activeTestimonial.set(index);
    this.startTestimonialAutoPlay();
  }

  private nextExperienceSlide(): void {
    this.activeExperience.update((i) => (i === this.experiences.length - 1 ? 0 : i + 1));
  }

  private nextTestimonialSlide(): void {
    this.activeTestimonial.update((i) => (i === this.testimonials.length - 1 ? 0 : i + 1));
  }

  acceptCookies(): void {
    this.cookieBannerVisible.set(false);
  }
}
