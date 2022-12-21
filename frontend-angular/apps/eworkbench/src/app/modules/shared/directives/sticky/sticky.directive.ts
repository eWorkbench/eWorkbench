import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

@Directive({ selector: '[sticky]' })
export class StickyDirective implements OnInit {
  @Input()
  public stickyEnabled = true;

  @Input()
  public stickyTop = 0;

  @Input()
  public stickyXScrollElement?: HTMLElement;

  @Input()
  public stickyScrollOnOverflow?: boolean;

  public oldStyleTop = '0';

  public oldStylePosition = 'relative';

  public oldOffsetTop = 0;

  public uniqueHash = uuidv4();

  public parent: HTMLElement | null = null;

  public elementMarginLeft: number | null = null;

  @HostListener('window:scroll')
  public onScroll(): void {
    this.handleStickyElement();
  }

  public constructor(public readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  public get stickyOffset(): number {
    const stickyOffset = this.el.nativeElement.offsetTop - this.stickyTop;
    if (stickyOffset <= 0) {
      return this.oldOffsetTop;
    }
    return stickyOffset;
  }

  public get style(): CSSStyleDeclaration {
    return this.el.nativeElement.style;
  }

  public get classList(): DOMTokenList {
    return this.el.nativeElement.classList;
  }

  public get canBeSticky(): boolean {
    if (!this.stickyEnabled) {
      return false;
    }
    const elementHeight = this.el.nativeElement.offsetHeight;
    if (this.stickyScrollOnOverflow && elementHeight > window.innerHeight - this.stickyTop) {
      return false;
    }
    if (this.el.nativeElement.offsetTop <= 0) {
      return false;
    }
    if (window.pageYOffset < this.stickyOffset) {
      return false;
    }
    return true;
  }

  public handleStickyElement(): void {
    if (this.canBeSticky) {
      const isWindowOverOffset = window.pageYOffset >= this.stickyOffset;
      if (isWindowOverOffset && !this.classList.contains('is-sticky')) {
        this.oldOffsetTop = this.stickyOffset;
        this.classList.add('is-sticky');
        this.addSticky();
      } else if (!isWindowOverOffset && this.classList.contains('is-sticky')) {
        this.classList.remove('is-sticky');
        this.removeSticky();
      }
    } else {
      this.classList.remove('is-sticky');
      this.removeSticky();
    }
  }

  public addSticky(): void {
    if (this.canBeSticky) {
      if (this.parent) {
        if (this.parent === this.el.nativeElement.parentElement) {
          const scrollLeft = this.el.nativeElement.scrollLeft;
          const containerElement = this.createContainerElement();
          this.renderer.insertBefore(this.parent, containerElement, this.el.nativeElement);
          containerElement.appendChild(this.el.nativeElement);
          this.el.nativeElement.scrollLeft = scrollLeft;
        }
      }
      this.style.position = 'fixed';
      this.style.top = `${this.stickyTop}px`;
      this.elementMarginLeft = this.stickyXScrollElement?.scrollLeft ?? 0;
      this.style.marginLeft = `-${this.elementMarginLeft}px`;
      this.stickyXScrollElement?.addEventListener('scroll', () => {
        if (this.classList.contains('is-sticky')) {
          this.elementMarginLeft = this.stickyXScrollElement?.scrollLeft ?? 0;
          this.style.marginLeft = `-${this.elementMarginLeft}px`;
        }
      });
    }
  }

  public removeSticky(): void {
    this.style.position = this.oldStylePosition;
    this.style.top = this.oldStyleTop;
    this.style.marginLeft = '0';
    const scrollLeft = this.el.nativeElement.scrollLeft;
    const containerElement = this.parent?.querySelector(`#sticky-container-${this.uniqueHash}`);
    if (containerElement) this.renderer.insertBefore(this.parent, this.el.nativeElement, containerElement);
    this.removeElement(`#sticky-container-${this.uniqueHash}`);
    this.el.nativeElement.scrollLeft = scrollLeft;
  }

  public createContainerElement(): any {
    const containerElement = this.renderer.createElement('div');
    containerElement.style.height = `${this.el.nativeElement.offsetHeight}px`;
    containerElement.style.width = `${this.el.nativeElement.offsetWidth}px`;
    containerElement.id = `sticky-container-${this.uniqueHash}`;
    return containerElement;
  }

  public removeElement(selector: string): void {
    const element = this.parent?.querySelector(selector);
    if (element) this.renderer.removeChild(this.parent, element);
  }

  public ngOnInit(): void {
    this.oldStyleTop = this.style.top;
    this.oldStylePosition = this.style.position;
    this.parent = this.el.nativeElement.parentElement;
  }
}
