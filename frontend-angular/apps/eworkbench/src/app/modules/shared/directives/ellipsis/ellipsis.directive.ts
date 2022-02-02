import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({ selector: '[ellipsis]' })
export class EllipsisDirective implements OnInit {
  @Input()
  public maxWidth = 150;

  public constructor(private readonly el: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    this.el.nativeElement.classList.add('inline-block', 'truncate');
    this.el.nativeElement.style.maxWidth = `${this.maxWidth}px`;
  }
}
