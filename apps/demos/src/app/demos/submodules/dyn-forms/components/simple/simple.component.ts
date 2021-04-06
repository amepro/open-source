import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { SectionAction, SectionBadge } from 'apps/demos/src/app/layout';
import { BehaviorSubject } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { simpleForm } from './simple.form';

@Component({
  selector: 'web-form-simple',
  templateUrl: './simple.component.html',
  styleUrls: ['./simple.component.styl'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SimpleComponent implements OnInit, AfterViewInit {
  // ref links
  badges: SectionBadge[] = [
    {
      link: "https://github.com/Mynd-Management/open-source/tree/master/libs/forms",
      img: "https://img.shields.io/badge/%40myndpm-dyn--forms-brightgreen",
      alt: "Package",
    },
    {
      link: "https://www.npmjs.com/package/@myndpm/dyn-forms",
      img: "https://badge.fury.io/js/%40myndpm%2Fdyn-forms.svg",
      alt: "NPM Badge",
    },
    {
      link: "https://npmcharts.com/compare/@myndpm/dyn-forms?minimal=true",
      img: "https://img.shields.io/npm/dm/@myndpm/dyn-forms.svg?style=flat",
      alt: "NPM Downloads",
    },
  ];
  actions: SectionAction[] = [
    {
      link: "https://github.com/Mynd-Management/open-source/blob/master/apps/demos/src/app/demos/submodules/dyn-forms/components/simple/simple.form.ts",
      icon: 'code',
      tooltip: 'See source code',
    },
    {
      link: "https://prezi.com/view/4Ok1bgCWvf0g26FMVwfx/",
      icon: 'preview',
      tooltip: 'Prezi',
    },
  ];

  // reactive parameters of the billing CARD
  profileCard = new BehaviorSubject({
    title: 'Billing Address',
    subtitle: 'Please fill the required fields',
  });

  // dyn-form inputs
  config = simpleForm(this.profileCard);
  form = new FormGroup({});
  mode = 'edit';

  ngOnInit(): void {
    // logs each change in the console just to demo
    this.form.valueChanges.subscribe(console.log);
  }

  ngAfterViewInit(): void {
    // simple example of how we can trigger changes into the params
    const group = this.form.get('billing') as FormGroup;
    group.statusChanges.pipe(startWith(group.status)).subscribe((status) => {
      this.profileCard.next({
        title: 'Billing Address',
        subtitle:
          status === 'INVALID'
            ? 'Please fill your Personal Information'
            : 'Billing information complete',
      });
    });
  }

  toggleMode(): void {
    this.mode = (this.mode === 'edit') ? 'display' : 'edit';

    if (this.mode === 'display') {
      // reset invalid styles on display markAllAsPristine
      this.markAsUntouched(this.form);
    }
  }

  private markAsUntouched(group: FormGroup | FormArray) {
    group.markAsUntouched();

    Object.keys(group.controls).map((field) => {
      const control = group.get(field);
      if (control instanceof FormControl) {
        control.markAsUntouched();
      } else if (control instanceof FormGroup) {
        this.markAsUntouched(control);
      }
    });
  }
}