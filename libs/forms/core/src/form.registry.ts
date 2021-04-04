import { Inject, Injectable } from '@angular/core';
import { ControlProvider, InjectedControl, isLazyControl } from './control-provider.interfaces';
import { DynControlType, DynInstanceType } from './control.types';
import { DYN_CONTROLS_TOKEN } from './controls.token';

@Injectable()
export class DynFormRegistry {
  constructor(
    @Inject(DYN_CONTROLS_TOKEN) private controls: ControlProvider[]
  ) {}

  get(dynControl: DynControlType): ControlProvider {
    const provided = this.controls.find(
      ({ control }) => dynControl === control
    );

    if (!provided) {
      throw new Error(`Control '${dynControl}' not provided!`);
    }

    return provided;
  }

  resolve(dynControl: DynControlType): InjectedControl {
    const resolved = this.get(dynControl);

    if (isLazyControl(resolved)) {
      // TODO resolve provider.component
    }

    return {
      control: resolved.control,
      instance: resolved.instance,
      component: resolved.component ?? ({} as any),
    };
  }

  getInstanceFor(dynControl: DynControlType): DynInstanceType {
    return this.get(dynControl).instance;
  }
}
