import { Inject, Injectable } from '@angular/core';
import merge from 'merge';
import { BehaviorSubject, isObservable } from 'rxjs';
import { DynBaseConfig } from './config.interfaces';
import { DynControlConfig } from './control-config.interface';
import { DynModeControls, DynModeParams, DynControlMode } from './control-mode.types';
import { DynControlType } from './control.types';
import { DYN_MODE, DYN_MODE_CONTROL_DEFAULTS, DYN_MODE_DEFAULTS } from './form.tokens';

@Injectable()
export class DynFormMode {
  constructor(
    @Inject(DYN_MODE) private mode$: BehaviorSubject<DynControlMode>,
    @Inject(DYN_MODE_DEFAULTS) private modes?: DynModeParams,
    @Inject(DYN_MODE_CONTROL_DEFAULTS) private controls?: DynModeControls,
  ) {}

  // resolves the config to be used by dyn-factory
  // this algorithm decides how to override the main config with mode customizations
  getModeConfig(config: DynBaseConfig): DynBaseConfig {
    const mode = this.mode$.getValue();
    let result: DynBaseConfig = { ...config, modes: undefined };

    if (!mode) {
      return result;
    }

    if (this.modes?.hasOwnProperty(mode)) {
      // overrides any params set in the form.modeParams[mode]
      result = this.mergeConfigs(result, { params: this.modes[mode] });
    }

    if (config.modes && config.modes[mode]) {
      // overrides any customization set in control.modes[mode]
      result = this.mergeConfigs(result, config.modes[mode]);
    }

    if (this.controls?.hasOwnProperty(mode)) {
      const control = this.getControl(result.control, this.controls[mode]);
      if (control) {
        // overrides any customization set in form.modes[mode][control]
        result = this.mergeConfigs(result, control);
      }
    }

    return result;
  }

  getControl(id: DynControlType, controls: DynControlConfig[]): DynControlConfig | undefined {
    return controls.find(({ control }) => control === id);
  }

  mergeConfigs(config: DynBaseConfig, mode: Partial<DynControlConfig>): DynBaseConfig {
    // custom merge strategy for DynControlConfig
    if (mode.control) {
      config.control = mode.control;
    }
    if (mode.hasOwnProperty('options')) {
      config.options = mode.options;
    }
    if (mode.hasOwnProperty('factory')) {
      config.factory = mode.factory;
    }
    // do not override an existing observable (because of modeParams)
    if (mode.params && !isObservable(config.params)) {
      config.params = !isObservable(mode.params)
        ? merge(true, config.params, mode.params)
        : mode.params;
    }

    return config;
  }
}
