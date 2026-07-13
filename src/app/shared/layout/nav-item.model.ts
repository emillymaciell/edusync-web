import { IconName } from '../ui/icon/icon';

export interface NavItem {
  label: string;
  icon: IconName;
  route: string;
  exact?: boolean;
}
