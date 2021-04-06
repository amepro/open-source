import {
  ChangeDetectionStrategy,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  HostBinding,
  Inject,
  INJECTOR,
  Injector,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {
  AbstractDynControl,
  DynBaseConfig,
  DynControlMode,
  DynFormMode,
  DynFormRegistry,
  DYN_MODE,
} from '@myndpm/dyn-forms/core';
import deepEqual from 'fast-deep-equal';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'dyn-factory',
  templateUrl: './factory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FactoryComponent implements OnInit {
  @Input() config!: DynBaseConfig;
  @Input() injector?: Injector;

  @ViewChild('container', { static: true, read: ViewContainerRef })
  container!: ViewContainerRef;

  @HostBinding('class')
  get cssClass(): string {
    return this.config?.factory?.cssClass || '';
  }

  private component!: ComponentRef<AbstractDynControl>

  private _injector!: Injector;
  private _mode$!: BehaviorSubject<DynControlMode>;
  private _formMode!: DynFormMode;

  constructor(
    @Inject(INJECTOR) private parent: Injector,
    private resolver: ComponentFactoryResolver,
    private registry: DynFormRegistry,
  ) {}

  ngOnInit(): void {
    // resolve the injector to use and g et providers
    this._injector = this.injector ?? this.parent;
    this._mode$ = this._injector.get(DYN_MODE);
    this._formMode = this._injector.get(DynFormMode);

    // create the dynamic component with each mode change
    let config: DynBaseConfig;
    this._mode$.subscribe(() => {
      const newConfig = this._formMode.getModeConfig(this.config);

      // do not recreate the control if the config is the same
      if (!deepEqual(config, newConfig)) {
        // check if the params are the only changed
        if (
          config?.control === newConfig.control &&
          deepEqual(config?.factory, newConfig.factory) &&
          deepEqual(config?.options, newConfig.options)
        ) {
          if (newConfig.params) {
            this.component.instance.setParams(newConfig.params);
          }
        } else {
          // new config
          this.container.clear();
          this.createFrom(newConfig);
        }
        config = newConfig;
      }
    });
  }

  private createFrom(config: DynBaseConfig): void {
    const control = this.registry.resolve(config.control);
    const factory = this.resolver.resolveComponentFactory(control.component);

    this.component = this.container.createComponent<AbstractDynControl>(
      factory,
      undefined,
      this._injector,
    );
    this.component.instance.config = config;

    this.component.hostView.detectChanges();
  }
}
