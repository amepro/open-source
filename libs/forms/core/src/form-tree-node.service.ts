import { Inject, Injectable, Optional, SkipSelf } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { DynLogger } from '@myndpm/dyn-forms/logger';
import { BehaviorSubject, Subject, combineLatest, merge, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, switchMap, takeUntil, withLatestFrom } from 'rxjs/operators';
import { DynBaseConfig } from './config.types';
import { DynConfigErrors, DynConfigPrimitive } from './control-config.types';
import { DynControlHook, DynControlVisibility } from './control-events.types';
import { DynControlMatch } from './control-matchers.types';
import { DynControlMode } from './control-mode.types';
import { DynControlParams } from './control-params.types';
import { DynErrorHandlerFn, DynErrorMessage, DynErrorMessages } from './control-validation.types';
import { DynInstanceType } from './control.types';
import { DynFormFactory } from './form-factory.service';
import { DynFormHandlers } from './form-handlers.service';
import { DYN_MODE } from './form.tokens';
import { DynTreeNode } from './tree.types';

@Injectable()
// initialized by dyn-form, dyn-factory, dyn-group
// and the abstract DynForm* classes
export class DynFormTreeNode<
  TParams extends DynControlParams = DynControlParams,
  TControl extends AbstractControl = FormGroup
>
implements DynTreeNode<TParams, TControl> {
  // form hierarchy
  isolated = false;
  index?: number = 0;
  deep = 0;
  path: string[] = [];
  route: string[] = [];
  children: DynFormTreeNode[] = [];

  // listened by dyn-factory
  visibility$ = new Subject<DynControlVisibility>();
  // listened by DynControl
  paramsUpdates$ = new BehaviorSubject<Partial<TParams>>({});
  hook$ = new Subject<DynControlHook>();

  // control config
  get dynControl(): string|undefined {
    return this._dynControl;
  }
  get name(): string|undefined {
    return this._name;
  }
  get instance(): DynInstanceType {
    return this._instance;
  }
  get control(): TControl {
    return this._control;
  }
  get params(): TParams {
    return this._params;
  }
  get isRoot(): boolean {
    return this.isolated || !this.parent;
  }
  get isFormLoaded(): boolean {
    return this._formLoaded;
  }
  get errorMsg$(): Observable<DynErrorMessage> {
    return this._errorMsg$.asObservable();
  }
  get mode$(): Observable<DynControlMode> {
    return this._mode$.asObservable();
  }

  // form root node
  get root(): DynFormTreeNode<any, any> {
    return this.isRoot ? this : this.parent.root;
  }

  private _dynControl?: string;
  private _name?: string;
  private _instance!: DynInstanceType;
  private _control!: TControl;
  private _numChilds: number = 0;
  private _matchers?: DynControlMatch[];
  private _params!: TParams;
  private _formLoaded = false; // view already initialized
  private _errorHandlers: DynErrorHandlerFn[] = [];

  private _children$ = new Subject<void>();
  private _loaded$ = new BehaviorSubject<boolean>(false);
  private _errorMsg$ = new BehaviorSubject<DynErrorMessage>(null);
  private _unsubscribe = new Subject<void>();

  loaded$: Observable<boolean> = this._children$.pipe(
    startWith(null),
    switchMap(() => combineLatest([
      this._loaded$,
      ...this.children.map(child => child.loaded$),
    ])),
    map(([loaded, ...children]) => {
      const isControl = this.instance === DynInstanceType.Control;
      const hasAllChildren = this._numChilds === children.length;
      const allChildrenValid = children.every(Boolean);
      const allChildrenLoaded = this.instance === DynInstanceType.Control ? true : hasAllChildren && allChildrenValid;

      const result = loaded && allChildrenLoaded;

      this.logger.nodeLoad(this, !isControl
        ? { result, loaded, numChilds: this._numChilds, children }
        : { result, loaded }
      );

      return result;
    }),
    distinctUntilChanged(),
  );

  constructor(
    private readonly formFactory: DynFormFactory,
    private readonly formHandlers: DynFormHandlers,
    private readonly logger: DynLogger,
    @Optional() @Inject(DYN_MODE)
    private readonly _mode$: BehaviorSubject<DynControlMode>,
    // parent node should be set for all except the root
    @Optional() @SkipSelf()
    public readonly parent: DynFormTreeNode<any>,
  ) {}

  /**
   * Visibility methods
   */

  visible(): void {
    this.visibility$.next('VISIBLE');
  }

  invisible(): void {
    this.visibility$.next('INVISIBLE');
  }

  hidden(): void {
    this.visibility$.next('HIDDEN');
  }

  /**
   * State methods
   */

  childsIncrement(): void {
    this._numChilds++;
    this.logger.nodeMethod(this, 'childsIncrement', { numChilds: this._numChilds });
    this._loaded$.next(true);
  }

  childsDecrement(): void {
    this._numChilds--;
    this.logger.nodeMethod(this, 'childsDecrement', { numChilds: this._numChilds });
  }

  /**
   * Feature methods
   */

  // let the ControlNode know of an incoming hook
  callHook(event: DynControlHook): void {
    this.logger.hookCalled(this, event.hook, event.payload);

    this.hook$.next(event);
  }

  // query for a control upper in the tree
  query(path: string, searchNodes = false): AbstractControl|null {
    /* eslint-disable @typescript-eslint/no-this-alias */
    let node: DynFormTreeNode<TParams, any> = this;
    let result: AbstractControl|null;

    do {
      // query by form.control and by node.path
      result = node.control.get(path)
        ?? (searchNodes ? node.select(path) : null)
        ?? null;
      // move upper in the tree
      node = node.parent;
    } while (!result && node);

    return result;
  }

  // select a child control by node.path
  select(path: string): AbstractControl|null {
    const selector = path.split('.');
    let name = '';

    if (this._name) { // container with no name
      name = selector.shift()!;
    }

    if (!selector.length) { // search over
      return this._name === name ? this.control : null;
    } else if (this._name !== name) {
      return null; // not in the search path
    }

    // propagate the query to the children
    let result: AbstractControl|null = null;
    this.children.some(node => {
      result = node.select(selector.join('.'));
      return result ? true : false; // return the first match
    });

    return result;
  }

  // listen another control value changes
  valueChanges(path: string): Observable<any>|undefined {
    const control = this.query(path);
    return control?.valueChanges.pipe(
      startWith(control.value),
    );
  }

  /**
   * Lifecycle methods
   */

  onInit(instance: DynInstanceType, config: DynBaseConfig): void {
    // throw error if the name is already set and different to the incoming one
    if (this.name !== undefined && this.name !== (config.name ?? '')) {
      throw this.logger.nodeFailed(config.control);
    }

    // throw error if the configured instance is different to the inherited one
    const configInstance = this.formFactory.getInstanceFor(config.control);
    if (instance !== configInstance) {
      throw this.logger.nodeInstanceMismatch(config.control, instance, configInstance);
    }

    // register the instance type for the childs to know
    this._instance = instance;

    if (config.name) {
      // register the control into the parent
      this._control = this.formFactory.register(
        instance as any,
        this as any,
        config,
      );
    } else {
      // or takes the parent control
      // useful for nested UI groups in the same FormGroup
      this._control = this.parent.control as unknown as TControl;
    }

    this.load(config);
  }

  setControl(control: TControl, instance = DynInstanceType.Group): void {
    // manual setup with no wiring nor config validation
    this._instance = instance;
    this._control = control;
  }

  load(
    config: Partial<DynBaseConfig> & { errorMsgs?: DynConfigErrors<DynErrorMessages> },
  ): void {
    if (!this._control) {
      throw this.logger.nodeWithoutControl();
    }

    // keep the id of the control for the logs
    this._dynControl = config.control;

    // register the name to build the form path
    this._name = config.name ?? '';

    // disconnect this node from any parent DynControl
    this.isolated = Boolean(config.isolated);
    this.deep = this.getDeep();
    this.path = this.getPath();
    this.route = this.getRoute();

    // store the number of configured childs
    this._numChilds = ![DynInstanceType.Array, DynInstanceType.Container].includes(this._instance)
      ? config.controls?.length ?? 0
      : 0;

    // store the matchers to be processed in setupListeners
    this._matchers = this.getMatchers(config);

    // store the params to be accessible to the handlers
    this._params = config.params as TParams;

    // resolve and store the error handlers
    this._errorHandlers = config.errorMsgs
      ? this.formHandlers.getFormErrorHandlers(config.errorMsgs)
      : config.errorMsg
        ? this.formHandlers.getErrorHandlers(config.errorMsg)
        : [];

    if (!this.isolated) {
      // register the node with its parent
      this.parent?.addChild(this);
    }
  }

  afterViewInit(): void {
    this._loaded$.next(true);
  }

  setupListeners(): void {
    if (!this.isFormLoaded) {
      this.logger.setupListeners(this);
      this._formLoaded = true;

      // listen control changes to update the error
      merge(
        this._control.valueChanges,
        this._control.statusChanges,
      ).pipe(
        takeUntil(this._unsubscribe),
        debounceTime(20), // wait for subcontrols to be updated
        map(() => this._control.errors),
        distinctUntilChanged(),
        withLatestFrom(this._errorMsg$),
      ).subscribe(([_, currentError]) => {
        if (this._control.valid) {
          // reset any existing error
          if (currentError) {
            this._errorMsg$.next(null);
          }
        } else {
          // update the error message if needed
          const errorMsg = this.getErrorMessage();
          if (currentError !== errorMsg) {
            this._errorMsg$.next(errorMsg);
          }
        }
      });

      // process the stored matchers
      this._matchers?.map((config) => {
        const matchers = config.matchers.map(matcher => this.formHandlers.getMatcher(matcher));
        let count = 0;

        combineLatest(
          // build an array of observables to listen changes into
          config.when
            .map(condition => this.formHandlers.getCondition(condition)) // handler fn
            .map(fn => fn(this)) // condition observables
        ).pipe(
          map(results => config.operator === 'OR' // AND by default
            ? results.some(Boolean)
            : results.every(Boolean)
          ),
          takeUntil(this._unsubscribe),
          // TODO option for distinctUntilChanged?
        )
        .subscribe(hasMatch => {
          const firstTime = (count === 0);
          // run the matchers with the conditions result
          // TODO config to run the matcher only if hasMatch? (unidirectional)
          matchers.map(matcher => matcher(this, config.negate ? !hasMatch : hasMatch, firstTime));
          count++;
        });
      });
    }

    // call the children
    this.children.map(child => child.setupListeners());
  }

  onDestroy(): void {
    // TODO test unload with routed forms

    if (!this.isolated) {
      this.parent?.removeChild(this);
    }

    this.hook$.complete();
    this.paramsUpdates$.complete();
    this.visibility$.complete();
    this._errorMsg$.complete();
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  /**
   * Hierarchy methods
   */
  setIndex(index?: number) {
    this.index = index;
  }

  getDeep(): number {
    return this.isRoot ? 0 : this.parent?.deep + 1;
  }

  // control.path relative to the root
  getPath(): string[] {
    return [
      ...(!this.isRoot ? this.parent.path : []),
      this._name ?? '',
    ].filter(Boolean);
  }

  // control.route relative to the root
  getRoute(): string[] {
    return [
      ...(!this.isRoot ? this.parent.route : []),
      this.dynControl || this.instance +
      `${this.index !== undefined ? `[${this.index}]` : ''}`,
    ];
  }

  private addChild(node: DynFormTreeNode<any, any>): void {
    this.logger.nodeMethod(this, 'addChild', { numChilds: this._numChilds, children: this.children.length });

    this.children.push(node);
    this._children$.next();

    // TODO updateValue and validity? or it's automatically done?
  }

  private removeChild(node: DynFormTreeNode<any, any>): void {
    this.logger.nodeMethod(this, 'removeChild');

    this.children.some((child, i) => {
      return (child === node) ? this.children.splice(i, 1) : false;
    });
    this._children$.next();

    // TODO what happen to the data if we remove the control
    // TODO update validity if not isolated
  }

  // process the config to extract the matchers
  private getMatchers(config: Partial<DynBaseConfig>): DynControlMatch[] {
    const matchers = config.match?.slice() || [];

    // listen changes in the RELATED field
    // with a matcher configured like the asyncValidator
    if (config.asyncValidators) {
      const hasRelated = (Array.isArray(config.asyncValidators)
        ? config.asyncValidators.find((validator) => {
            return Array.isArray(validator) ?  validator[0] === 'RELATED' : false;
          })
        : config.asyncValidators['RELATED']
      ) as DynConfigPrimitive[];

      if (hasRelated) {
        matchers.push({
          matchers: ['RELATED'],
          when: [hasRelated[0]],
        } as any);
      }
    }

    return matchers;
  }

  // error message resolver
  private getErrorMessage(): string|null {
    let errorMsg: string|null = null;

    if (this._control.errors) {
      // loop the handlers and retrieve the message
      this._errorHandlers.concat(this.root._errorHandlers || []).some(handler => {
        errorMsg = handler(this);
        return Boolean(errorMsg);
      });
    }
    // TODO i18n transformation
    return errorMsg;
  }
}
