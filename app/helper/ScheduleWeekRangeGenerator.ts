import { DateTime } from "luxon";
import { parseDate } from "./DateParser";
import { ScheduleWeekRange, ScheduleWeekEnum, DateDetails } from '@/app/types/schedule-week-range';

export class ScheduleWeekRangeGenerator {
    next_week: ScheduleWeekRange;
    this_week: ScheduleWeekRange;
    default_week: ScheduleWeekEnum;
    monday: DateTime<boolean>;
    sunday: DateTime<boolean>;

    constructor(today: DateTime) {
        if(today.weekday === 7) {
            this.monday = today.plus({ days: 1 });
            this.sunday = this.monday.plus({ days: 6 });
            this.next_week = {
                "month_year": this.getMonthYear(this.monday, this.sunday),
                "dates": this.getDate(this.monday),
                "start_date":  this.monday.day,
                "end_date":  this.sunday.day
            };
            this.this_week = this.next_week;
            this.default_week = ScheduleWeekEnum.NextWeek;
        }
        else {
            this.monday = today.minus({ days: today.weekday - 1});
            this.sunday = this.monday.plus({ days: 6 });

            this.this_week = {
                "month_year": this.getMonthYear(this.monday, this.sunday),
                "dates": this.getDate(this.monday),
                "start_date":  this.monday.day,
                "end_date":  this.sunday.day
            };

            this.default_week = ScheduleWeekEnum.ThisWeek;

            const next_monday = this.sunday.plus({ days: 1 });
            const next_sunday = next_monday.plus({ days: 6 });
            this.next_week = {
                "month_year": this.getMonthYear(next_monday, next_sunday),
                "dates": this.getDate(next_monday),
                "start_date":  next_monday.day,
                "end_date":  next_sunday.day
            };
        }
    }

    private getDate(monday: DateTime): DateDetails[] {
        let current: DateDetails;
        let dates: DateDetails[] = [];
        dates = [];

        for(let i = 0; i < 7; i++) {
            current = {
                "day_name": monday.toFormat('ccc'),
                "date": monday.day,
                "formated": parseDate(monday.toFormat('yyyy/MM/dd'))
            };

            dates.push(current);
            monday = monday.plus({days: 1});
        }

        return dates;
    }

    private getMonthYear(monday: DateTime, sunday: DateTime): string {
        if(monday.year !== sunday.year) {
            return `${monday.monthShort} ${monday.year} - ${sunday.monthShort} ${sunday.year}`;
        }
        else if(monday.month !== sunday.month) {
            return `${monday.monthShort} - ${sunday.monthShort} ${sunday.year}`;
        }
        return `${monday.monthShort} ${monday.year}`;
    }
}