import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  DynConfig,
  DynPartialControlConfig,
} from '@myndpm/dyn-forms/core';
import { DynFormContainer } from '@myndpm/dyn-forms/core';
import { DynCardParams } from './card.component.params';

@Component({
  selector: 'dyn-mat-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynCardComponent
  extends DynFormContainer<DynCardParams, DynConfig>
  implements OnInit {
  static dynControl: 'CARD' = 'CARD';

  static createConfig(
    partial: DynPartialControlConfig<DynCardParams>
  ): DynConfig<DynCardParams> {
    return {
      ...partial,
      control: DynCardComponent.dynControl,
    };
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  completeParams(params: Partial<DynCardParams>): DynCardParams {
    return params;
  }
}
