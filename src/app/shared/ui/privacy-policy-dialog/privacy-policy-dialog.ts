import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Icon, IconName } from '../icon/icon';

interface PolicySection {
  title: string;
  paragraph: string;
}

interface RightItem {
  icon: IconName;
  label: string;
}

@Component({
  selector: 'app-privacy-policy-dialog',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy-dialog.html',
  styleUrl: './privacy-policy-dialog.scss',
})
export class PrivacyPolicyDialog {
  readonly close = output<void>();

  readonly sections: PolicySection[] = [
    {
      title: '1. Quais dados coletamos',
      paragraph:
        'Coletamos dados de identificação (nome e e-mail), dados de acesso e de uso da plataforma, além do perfil escolhido (admin, professor ou aluno). Não coletamos dados pessoais sensíveis sem uma finalidade específica e o seu consentimento explícito.',
    },
    {
      title: '2. Finalidade e base legal',
      paragraph:
        'Tratamos seus dados para criar e manter sua conta, personalizar a experiência de ensino/aprendizagem e melhorar a plataforma. As bases legais são a execução do contrato, o legítimo interesse e o seu consentimento, conforme o caso.',
    },
    {
      title: '3. Compartilhamento',
      paragraph:
        'Seus dados não são vendidos. Podem ser compartilhados com operadores que nos ajudam a prestar o serviço (ex.: hospedagem), sempre sob contrato e obrigações de segurança.',
    },
  ];

  readonly rights: RightItem[] = [
    { icon: 'eye', label: 'Confirmar a existência de tratamento e acessar seus dados' },
    { icon: 'file', label: 'Corrigir dados incompletos, inexatos ou desatualizados' },
    { icon: 'download', label: 'Solicitar a portabilidade dos seus dados' },
    { icon: 'trash', label: 'Eliminar dados tratados com base no seu consentimento' },
    { icon: 'ban', label: 'Revogar o consentimento a qualquer momento' },
  ];

  readonly contact: PolicySection = {
    title: '5. Contato',
    paragraph:
      'Dúvidas sobre este aviso ou sobre o tratamento dos seus dados podem ser enviadas ao nosso encarregado de dados (DPO) em privacidade@edusync.ai.',
  };

  onClose(): void {
    this.close.emit();
  }
}
