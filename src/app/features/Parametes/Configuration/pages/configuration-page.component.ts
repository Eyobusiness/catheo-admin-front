import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ConfigurationService } from '../services/configuration.service';
import { ConfigurationTab } from '../models/configuration.model';
import { TabParoisseConfigComponent } from '../components/tab-paroisse-config/tab-paroisse-config.component';
import { TabResponsablesConfigComponent } from '../components/tab-responsables-config/tab-responsables-config.component';
import { TabApparenceConfigComponent } from '../components/tab-apparence-config/tab-apparence-config.component';

export interface TabConfigItem {
  id: ConfigurationTab;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-configuration-page',
  imports: [
    TabParoisseConfigComponent,
    TabResponsablesConfigComponent,
    TabApparenceConfigComponent
  ],
  templateUrl: './configuration-page.component.html',
  styleUrl: './configuration-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurationPageComponent implements OnInit {
  protected readonly configService = inject(ConfigurationService);

  // Active navigation tab
  public readonly activeTab = signal<ConfigurationTab>('paroisse');

  protected readonly tabs: TabConfigItem[] = [
    {
      id: 'paroisse',
      label: 'Configuration Paroisse',
      icon: 'bi bi-building-gear',
      description: 'Identité, diocèse, localisation & coordonnées'
    },
    {
      id: 'responsables',
      label: 'Responsables',
      icon: 'bi bi-people-fill',
      description: 'Clergé, directoire & équipe pastorale'
    },
    {
      id: 'apparence',
      label: 'Apparence',
      icon: 'bi bi-palette-fill',
      description: 'Thème, couleurs & en-têtes de documents'
    }
  ];

  public ngOnInit(): void {
    this.configService.getParoisseConfig().subscribe();
    this.configService.getApparenceConfig().subscribe();
    this.configService.getResponsables().subscribe();
  }

  protected selectTab(tabId: ConfigurationTab): void {
    this.activeTab.set(tabId);
  }
}
