/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { axisTop, max, min, scaleTime, ScaleTime, select, timeFormat, timeParse } from 'd3';
import type { Project } from 'libs/types/src/lib/interfaces/project.interface';
import { v4 as uuidv4 } from 'uuid';
import type { GanttChartItem } from '../../interfaces/gantt-chart-item.interface';

@UntilDestroy()
@Component({
  selector: 'eworkbench-gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input()
  public items: GanttChartItem[] = [];

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public sidePadding = 100;

  public timeParser = timeParse('%Y-%m-%d');

  public timeFormater = timeFormat('%Y-%m-%d');

  public timeScale!: ScaleTime<number, number>;

  public domainMinDate?: Date;

  public domainMaxDate?: Date;

  public scaleWidth = 50;

  public tooltip?: any;

  public uuid = uuidv4();

  public ganttId!: string;

  public today: Date = new Date();

  public start?: Date;

  public end?: Date;

  public width?: number;

  public ngOnInit(): void {
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.buildGantt();
    });
  }

  public ngOnDestroy(): void {
    select(`#gantt-tooltip${this.uuid}`).remove();
  }

  public ngAfterViewInit(): void {
    this.ganttId = `gantt-container-${this.uuid}`;
    setTimeout(() => {
      this.buildGantt();
    }, 1);
  }

  public buildGantt(): void {
    select(`#${this.ganttId}`).selectAll('*').remove();
    const container = select(`#${this.ganttId}`);

    if (!this.items.length) {
      container.style('text-align', 'center').style('margin-top', '50px').html('No results');
      return;
    }
    this.width = document.getElementById(this.ganttId)!.offsetWidth;

    const barHeight = 20;
    const gap = barHeight + 20;
    const bottomPadding = 30;
    const itemsHeight = this.items.length * gap;

    const itemsWithDates: GanttChartItem[] = [];

    this.items.forEach(item => {
      if (item.startTime || item.endTime) {
        if (item.startTime) {
          item.startTime = this.timeFormater(new Date(item.startTime));
        }
        if (item.endTime) {
          item.endTime = this.timeFormater(new Date(item.endTime));
        }
        itemsWithDates.push(item);
      }
    });

    this.start = min(
      itemsWithDates.map(item => {
        if (item.startTime) {
          return this.timeParser(item.startTime)!;
        }
        return this.timeParser(item.endTime!)!;
      })
    ) as any;
    this.end = max(
      itemsWithDates.map(item => {
        if (item.endTime) {
          return this.timeParser(item.endTime)!;
        }
        return this.timeParser(item.startTime!)!;
      })
    ) as any;

    const topPadding = 60;
    const ganttHeight = this.items.length * gap + topPadding;

    if (!this.start || !this.end) {
      container
        .style('text-align', 'center')
        .style('margin-top', '50px')
        .html('Please set at least one start date and one end date for the timeline to be rendered.');
      return;
    }

    const ticks = this.calculateTicks();

    this.timeScale = scaleTime()
      .domain(this.calculateDomain())
      .range([0, this.calculateXAxisWidth(this.width - this.sidePadding * 2, ticks)]);

    const yScale = container
      .append('svg')
      .attr('width', this.width)
      .attr('height', ganttHeight)
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('z-index', 1);

    yScale
      .append('rect')
      .attr('width', this.sidePadding - 10)
      .attr('height', itemsHeight + 1)
      .attr('y', ganttHeight - itemsHeight - 1)
      .attr('fill', '#ffffff');

    yScale
      .append('g')
      .append('text')
      .text('From')
      .style('font-weight', 'bold')
      .attr('x', 10)
      .attr('y', topPadding - 5);

    yScale
      .append('g')
      .selectAll('text')
      .data(this.items)
      .enter()
      .append('text')
      .text((item: GanttChartItem) => item.startTime ?? '-')
      .attr('x', 10)
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding + (gap - barHeight) / 2 + 14)
      .attr('font-size', 14)
      .attr('text-anchor', 'start')
      .attr('text-height', 14);

    yScale
      .append('rect')
      .attr('width', this.sidePadding - 10)
      .attr('height', itemsHeight + 1)
      .attr('x', this.width - this.sidePadding + 10)
      .attr('y', ganttHeight - itemsHeight - 1)
      .attr('fill', '#ffffff');

    yScale
      .append('g')
      .append('text')
      .text('To')
      .style('font-weight', 'bold')
      .attr('x', this.width - this.sidePadding + 71)
      .attr('y', topPadding - 5);

    yScale
      .append('g')
      .selectAll('text')
      .data(this.items)
      .enter()
      .append('text')
      .text((item: GanttChartItem) => item.endTime ?? '-')
      .attr('x', (item: GanttChartItem) => {
        if (item.endTime) {
          return this.width! - this.sidePadding + 15;
        }
        return this.width! - this.sidePadding + 80;
      })
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding + (gap - barHeight) / 2 + 14)
      .attr('font-size', 14)
      .attr('text-anchor', 'start')
      .attr('text-height', 14);

    yScale
      .append('g')
      .selectAll('rect')
      .data(this.items)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding)
      .attr('width', this.width)
      .attr('height', gap)
      .attr('stroke', '#d2d2d2')
      .attr('stroke-dasharray', `${this.width}, ${this.width + 2 * gap}`)
      .attr('fill', 'none');

    const body = container
      .append('div')
      .attr('id', 'gantt-body')
      .style('margin-left', `${this.sidePadding}px`)
      .style('width', `${this.width - this.sidePadding * 2}px`)
      .style('overflow-x', 'auto')
      .style('-webkit-overflow-scrolling', 'touch');

    const xScale = body
      .append('svg')
      .attr('width', this.timeScale(this.end) - this.timeScale(this.start))
      .attr('height', ganttHeight + bottomPadding)
      .style('display', 'block')
      .attr('class', 'gantt');

    const xAxis = axisTop(this.timeScale)
      .ticks(ticks)
      .tickSize(ganttHeight - topPadding)
      .tickSizeOuter(0)
      .tickPadding(15)
      .tickFormat((date: any) => timeFormat(this.getTickFormat())(date));

    xScale
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${ganttHeight})`)
      .call(xAxis)
      .call(g => g.selectAll('.tick line').attr('stroke', '#d2d2d2'))
      .call(g => g.select('.domain').remove())
      .selectAll('text')
      .style('text-anchor', 'middle')
      .attr('fill', '#999999')
      .attr('stroke', 'none')
      .attr('font-size', 10)
      .attr('dy', '1em');

    this.scrollToToday();

    // Add today line
    xScale
      .append('g')
      .append('rect')
      .attr('x', this.timeScale(this.today))
      .attr('y', topPadding)
      .attr('width', 1)
      .attr('height', ganttHeight - topPadding + 5)
      .attr('stroke', 'none')
      .attr('fill', '#ffc107');

    // Add today text
    xScale
      .append('g')
      .append('text')
      .text('Today')
      .attr('x', this.timeScale(this.today))
      .attr('y', ganttHeight + 15)
      .attr('fill', '#ffc107')
      .attr('font-size', 11)
      .attr('text-anchor', 'middle');

    if (this.isTodayInScale()) {
      select(`#today-button-${this.uuid}`).style('display', 'block');
    }

    const rectangles = xScale.append('g').selectAll('rect').data(this.items).enter();

    rectangles
      .append('rect')
      .attr('x', (item: GanttChartItem) => this.calculateInnerRectsX(item))
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding + (gap - barHeight) / 2)
      .attr('width', (item: GanttChartItem) => {
        const width = this.calculateTimeWidth(item);
        return width > 0 ? width : 3;
      })
      .attr('height', barHeight)
      .attr('stroke', 'none')
      .attr('fill', (item: GanttChartItem) => {
        if (!item.startTime && !item.endTime) {
          return '#e6e6e6';
        }
        return '#677f99';
      });

    rectangles
      .append('text')
      .text((item: GanttChartItem) => item.name)
      .attr('x', (item: GanttChartItem) => this.calculateRectsTextX(item))
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding + (gap - barHeight) / 2 + 14)
      .attr('font-size', 11)
      .attr('text-anchor', 'middle')
      .attr('text-height', barHeight)
      .attr('fill', (item: GanttChartItem) => {
        if (!item.endTime && !item.startTime) {
          return '';
        }
        if (this.calculateTimeWidth(item) < this.calculateTextWidth(item.name)) {
          return '';
        }
        return '#ffffff';
      });

    const fullWidthRects = rectangles
      .append('rect')
      .attr('x', 0)
      .attr('y', (_: GanttChartItem, i: number) => i * gap + topPadding)
      .attr('width', '100%')
      .attr('height', gap)
      .style('opacity', 0);

    this.tooltip = select('body')
      .append('div')
      .attr('id', `gantt-tooltip${this.uuid}`)
      .style('padding', '10px')
      .style('min-width', '200px')
      .style('box-shadow', '0 3px 6px rgba(0, 0, 0, 0.1)')
      .style('background-color', '#ffffff')
      .style('z-index', 1100)
      .style('position', 'absolute')
      .style('display', 'none');

    this.addTooltip(fullWidthRects);
  }

  public calculateInnerRectsX(item: GanttChartItem): number {
    if (item.startTime) {
      return this.timeScale(this.timeParser(item.startTime)!);
    } else if (item.endTime) {
      return this.timeScale(this.timeParser(item.endTime)!) - 3;
    } else if (this.isTodayInScale()) {
      return this.timeScale(new Date()) - this.calculateTextWidth(item.name) / 2;
    }
    return (this.timeScale(this.end!) - this.timeScale(this.start!)) / 2 - this.calculateTextWidth(item.name) / 2;
  }

  public calculateTimeWidth(item: GanttChartItem): number {
    if (item.endTime && item.startTime) {
      return this.timeScale(this.timeParser(item.endTime)!) - this.timeScale(this.timeParser(item.startTime)!);
    }
    if (!item.endTime && !item.startTime) {
      return this.calculateTextWidth(item.name);
    }
    return 0;
  }

  public calculateRectsTextX(item: GanttChartItem): number {
    if (!item.endTime && !item.startTime) {
      if (this.isTodayInScale()) {
        return this.timeScale(this.today);
      }
      return (this.timeScale(this.end!) - this.timeScale(this.start!)) / 2;
    }
    if (this.calculateTimeWidth(item) < this.calculateTextWidth(item.name)) {
      if (item.startTime) {
        return this.timeScale(this.timeParser(item.startTime)!) + this.calculateTimeWidth(item) + this.calculateTextWidth(item.name) / 2;
      }
      return this.timeScale(this.timeParser(item.endTime!)!) + this.calculateTimeWidth(item) - this.calculateTextWidth(item.name) / 2;
    }
    return this.calculateTimeWidth(item) / 2 + this.timeScale(this.timeParser(item.startTime!)!);
  }

  public scrollToToday(): void {
    select<HTMLDivElement, unknown>('#gantt-body')
      .node()!
      .scrollBy(this.timeScale(new Date()) - (this.width! - 2 * this.sidePadding) / 2, 0);
  }

  public addTooltip(selection: any): void {
    selection.on('mouseover', (event: any, item: GanttChartItem) => {
      let tooltipContent = '';

      tooltipContent = `<strong>${item.name}</strong>`;

      if (item.object.description !== undefined) {
        tooltipContent += `<br/><br/> ${item.object.description}`;
      }

      if (item.object.tasks_status.NEW + item.object.tasks_status.PROG + item.object.tasks_status.DONE) {
        tooltipContent += `
        <br />
        <div class="progress" style="width: 300px">
          <div
            class="progress-bar bg-success"
            role="progressbar"
            style="width: ${this.progressbarValues(item.object)[0].label}">
              ${this.progressbarValues(item.object)[0].label}
          </div>
          <div
            class="progress-bar bg-info"
            role="progressbar"
            style="width: ${this.progressbarValues(item.object)[1].label}">
              ${this.progressbarValues(item.object)[1].label}
          </div>
          <div
            class="progress-bar bg-primary"
            role="progressbar"
            style="width: ${this.progressbarValues(item.object)[2].label}">
              ${this.progressbarValues(item.object)[2].label}
          </div>
        </div>
      `;
      } else {
        tooltipContent += '<br /><div>This project has no tasks!</div>';
      }

      this.tooltip.html(tooltipContent);

      this.showTooltip(event);
    });

    selection.on('mousemove', (event: any) => {
      this.showTooltip(event);
    });

    selection.on('mouseout', () => {
      this.tooltip.style('display', 'none');
    });
  }

  public showTooltip(event: any): void {
    const tooltipHeight = parseInt(this.tooltip.style('height'), 10);
    let top = 5;
    if (tooltipHeight < event.pageY) {
      top = -tooltipHeight - 10;
    }

    const tooltipWidth = parseInt(this.tooltip.style('width'), 10);
    let left = 5;
    if (tooltipWidth > document.documentElement.offsetWidth - event.pageX) {
      left = -tooltipWidth - 10;
    }

    this.tooltip.style('display', 'block');
    this.tooltip.style('top', `${(event.pageY as number) + top}px`).style('left', `${(event.pageX as number) + left}px`);
  }

  public calculateTextWidth(text: string): number {
    const textNode = select(`#${this.ganttId}`).append('div').style('position', 'absolute').style('visibility', 'hidden');
    textNode.append('text').text(text).attr('font-size', 11);

    return parseInt(textNode.style('width'), 10);
  }

  public calculateTicks(): number {
    const months = this.getMonthsBetweenDates(this.start!, this.end!);
    return months < 2 ? 4 : months + 2;
  }

  public getTickFormat(): string {
    if (this.getMonthsBetweenDates(this.start!, this.end!) < 2) {
      return '%d %b';
    }
    return '%b %y';
  }

  public calculateDomain(): Date[] {
    const domainStart = this.start!;
    const domainEnd = this.end!;

    if (this.getMonthsBetweenDates(domainStart, domainEnd) < 2) {
      domainStart.setDate(domainStart.getDate() - 1);
      domainEnd.setDate(domainEnd.getDate() + 1);
    } else {
      domainStart.setMonth(domainStart.getMonth() - 1);
      domainEnd.setMonth(domainEnd.getMonth() + 1);
    }

    return [domainStart, domainEnd];
  }

  public calculateXAxisWidth(width: number, ticks: number): number {
    const xAxisWidth = ticks * this.scaleWidth;
    return width > xAxisWidth ? width : xAxisWidth;
  }

  public getMonthsBetweenDates(start: Date, end: Date): number {
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months -= start.getMonth();
    months += end.getMonth();

    return months;
  }

  public isTodayInScale(): boolean {
    return this.today >= this.start! && this.today <= this.end!;
  }

  public progressbarValues(object: Project): Record<string, string | number>[] {
    return [
      {
        label: `${Number(
          ((object.tasks_status.DONE / (object.tasks_status.NEW + object.tasks_status.PROG + object.tasks_status.DONE)) * 100).toFixed(1)
        )}%`,
      },
      {
        label: `${Number(
          ((object.tasks_status.PROG / (object.tasks_status.NEW + object.tasks_status.PROG + object.tasks_status.DONE)) * 100).toFixed(1)
        )}%`,
      },
      {
        label: `${Number(
          ((object.tasks_status.NEW / (object.tasks_status.NEW + object.tasks_status.PROG + object.tasks_status.DONE)) * 100).toFixed(1)
        )}%`,
      },
    ];
  }
}
