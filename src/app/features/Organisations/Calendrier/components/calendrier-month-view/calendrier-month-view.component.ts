import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { Calendrier } from '../../models/calendrier.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';

export interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: Calendrier[];
}

function matchesDate(eventDate: string | undefined, targetDateStr: string): boolean {
  if (!eventDate) return false;
  const clean = eventDate.split('T')[0].split(' ')[0];
  return clean === targetDateStr;
}

@Component({
  selector: 'app-calendrier-month-view',
  imports: [AppIconButton],
  templateUrl: './calendrier-month-view.component.html',
  styleUrl: './calendrier-month-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierMonthViewComponent {
  public readonly calendriers = input<Calendrier[]>([]);

  public readonly dateSelected = output<string>();
  public readonly eventClicked = output<Calendrier>();
  public readonly eventEditRequested = output<Calendrier>();

  // Current calendar navigation date
  private readonly now = new Date();
  public readonly currentYear = signal<number>(this.now.getFullYear());
  public readonly currentMonth = signal<number>(this.now.getMonth()); // 0-11

  protected readonly monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  protected readonly availableYears = [2025, 2026, 2027, 2028];

  protected readonly weekDays = [
    { label: 'Lun', full: 'Lundi' },
    { label: 'Mar', full: 'Mardi' },
    { label: 'Mer', full: 'Mercredi' },
    { label: 'Jeu', full: 'Jeudi' },
    { label: 'Ven', full: 'Vendredi' },
    { label: 'Sam', full: 'Samedi' },
    { label: 'Dim', full: 'Dimanche' }
  ];

  constructor() {
    // When items change (e.g. initial load or filtered search), auto-navigate to the month of the first matching event if current month has 0 events
    effect(() => {
      const items = this.calendriers();
      if (items.length > 0) {
        const curY = this.currentYear();
        const curM = this.currentMonth();
        const hasEventsInCurMonth = items.some(e => {
          if (!e.date) return false;
          const [y, m] = e.date.split('T')[0].split(' ')[0].split('-').map(Number);
          return y === curY && m - 1 === curM;
        });

        if (!hasEventsInCurMonth) {
          const firstDate = items[0].date;
          if (firstDate) {
            const [y, m] = firstDate.split('T')[0].split(' ')[0].split('-').map(Number);
            if (y && m) {
              this.currentYear.set(y);
              this.currentMonth.set(m - 1);
            }
          }
        }
      }
    });
  }

  protected readonly currentMonthTitle = computed(() => {
    return `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`;
  });

  protected readonly currentMonthEventsCount = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    return this.calendriers().filter(e => {
      if (!e.date) return false;
      const [y, m] = e.date.split('T')[0].split(' ')[0].split('-').map(Number);
      return y === year && m - 1 === month;
    }).length;
  });

  protected readonly activeMonthsWithEvents = computed(() => {
    const year = this.currentYear();
    const map = new Map<number, number>();
    for (const e of this.calendriers()) {
      if (!e.date) continue;
      const [y, m] = e.date.split('T')[0].split(' ')[0].split('-').map(Number);
      if (y === year) {
        const monthIdx = m - 1;
        map.set(monthIdx, (map.get(monthIdx) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([monthIdx, count]) => ({
      monthIdx,
      name: this.monthNames[monthIdx],
      count
    }));
  });

  protected readonly calendarDays = computed<CalendarDayCell[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const events = this.calendriers();

    const todayStr = new Date().toISOString().split('T')[0];

    // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Days in current month
    const totalDaysInMonth = lastDay.getDate();

    // Determine day of week for the 1st day (0 = Mon in ISO)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const days: CalendarDayCell[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = (startDayOfWeek - 1 - i) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      const dayEvents = events.filter(e => matchesDate(e.date, dateStr));
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        events: dayEvents
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = (days.length) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      const dayEvents = events.filter(e => matchesDate(e.date, dateStr));
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend,
        events: dayEvents
      });
    }

    // Next month padding days to complete 35 or 42 grid slots
    const remaining = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remaining < 35 ? days.length + remaining + 7 : days.length + remaining;

    let nextDayNum = 1;
    while (days.length < totalNeeded) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
      const dayOfWeek = (days.length) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      const dayEvents = events.filter(e => matchesDate(e.date, dateStr));
      days.push({
        dateStr,
        dayNumber: nextDayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend,
        events: dayEvents
      });
      nextDayNum++;
    }

    return days;
  });

  protected prevMonth(): void {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
  }

  protected nextMonth(): void {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  protected setMonth(monthIdx: number): void {
    this.currentMonth.set(monthIdx);
  }

  protected onMonthChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentMonth.set(parseInt(select.value, 10));
  }

  protected onYearChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentYear.set(parseInt(select.value, 10));
  }

  protected goToToday(): void {
    const today = new Date();
    this.currentYear.set(today.getFullYear());
    this.currentMonth.set(today.getMonth());
  }

  protected onAddEventOnDate(dateStr: string, event: MouseEvent): void {
    event.stopPropagation();
    this.dateSelected.emit(dateStr);
  }

  protected onEventClick(item: Calendrier, event: MouseEvent): void {
    event.stopPropagation();
    this.eventClicked.emit(item);
  }

  protected onEventEdit(item: Calendrier, event: MouseEvent): void {
    event.stopPropagation();
    this.eventEditRequested.emit(item);
  }
}


