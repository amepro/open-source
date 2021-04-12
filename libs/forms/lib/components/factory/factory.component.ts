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
  DynFormNode,
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
export class DynFactoryComponent implements OnInit {
  @Input() config!: DynBaseConfig;
  @Input() injector?: Injector;

  @ViewChild('container', { static: true, read: ViewContainerRef })
  container!: ViewContainerRef;

  @HostBinding('class')
  get cssClass(): string {
    // TODO add a default class?
    return this.config?.factory?.cssClass || '';
  }

  // DynControl
  private component!: ComponentRef<AbstractDynControl>

  // retrieved from the proper injector
  private _injector!: Injector;
  private _mode$!: BehaviorSubject<DynControlMode>;
  private _formMode!: DynFormMode;

  constructor(
    @Inject(INJECTOR) private parent: Injector,
    private resolver: ComponentFactoryResolver,
    private registry: DynFormRegistry,
  ) {}

  ngOnInit(): void {
    // resolve the injector to use and get providers
    const injector = this.injector ?? this.parent;
    this._mode$ = injector.get(DYN_MODE);
    this._formMode = injector.get(DynFormMode);

    this._injector = Injector.create({
      providers: [
        // abstract classes has its own DynFormNode
        {
          provide: DynFormNode,
          useClass: DynFormNode,
        },
      ],
      parent: injector,
    });

    // create the dynamic component with each mode change
    let config: DynBaseConfig;
    this._mode$.subscribe(() => {
      const newConfig = this._formMode.getModeConfig(this.config);

      // do not re-create the control if the config is the same
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