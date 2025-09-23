/* eslint-disable prefer-const */
import { DateTime } from "luxon";
import { parseDate } from "./DateParser";
import { DaysID, GenericScheduleItem, ScheduleData, ScheduleDateBased, ScheduleDayEN, ScheduleFreeTime, TimetableScheduleDetail } from "@/app/types/schedule-data";
import { ScheduleWeekRange } from "@/app/types/schedule-week-range";
import { GenericScheduleComponentItem, ScheduleBreakTime, ScheduleColors, ScheduleComponentData, ScheduleComponentDetail } from "@/app/types/schedule-component-data";

function isInDateRange(date: ScheduleDateBased, target: number): boolean {
    return date.start <= target && date.end >= target;
}

function isHoliday(holidays: ScheduleDateBased[], date: number): boolean {
    let result = false;
    for(let i of holidays) {
        if(isInDateRange(i, date)) {
            result = true;
            break;
        }
    }
    return result;
}

function getHighlightColor(subject_id: string): ScheduleColors {
    if(subject_id === 'K') {
        return 'blue';
    }
    else if(subject_id[0] === 'W') {
        return 'green';
    }
    return 'purple';
}

function generateScheduleBreakTime(title: string): ScheduleBreakTime {
    return {'type': 'break-time', 'title': title};
}

function generateScheduleFreeTime(): ScheduleFreeTime {
    return {'type': 'free-time', 'title': ''};
}

function generateGenericScheduleComponentItem(schedule_data: ScheduleData, data: GenericScheduleItem, id: string): GenericScheduleComponentItem {
    switch(data.type) {
        case 'event': 
            return {
                'type': 'event',
                'title': schedule_data.events[data.title].title,
                'detail': schedule_data.events[data.title].detail,
            };
        case 'class-session': 
            const is_class = schedule_data.schedules.data[id].type === 'class';
            return {
                'type': 'class-session',
                'color': getHighlightColor(data.title),
                'title': schedule_data.subjects[data.title],
                'detail': is_class ? schedule_data.teachers[data.detail] : schedule_data.classes[data.detail]
            };
        default:
            return generateScheduleFreeTime();
    }
}

export function toScheduleComponentData(schedule_data: ScheduleData, week: ScheduleWeekRange, id: string): ScheduleComponentData {
    let has_temporary = false;
    let result: ScheduleComponentDetail[] = [];
    const today = parseDate(DateTime.now().setZone("Asia/Jakarta").toFormat('yyyy/MM/dd'));
    let temporary_period: ScheduleDateBased = schedule_data.schedules.temporary_period;

    if(schedule_data.schedules.data[id]) {
        const base = schedule_data.schedules.data[id];
        week.dates.forEach((i, idx) => {
            const day_name = today === i.formated ? "Today": i.day_name;
            const is_holiday = isHoliday(schedule_data.holidays, i.formated);
            if(i.day_name === 'Sun' || is_holiday) {
                has_temporary = is_holiday ? true : has_temporary;
                result.push({
                    'day_EN': day_name,
                    'day_ID': "Minggu",
                    'formated_date': i.formated,
                    'type': 'holiday',
                    'date': i.date,
                    'timetables': {}
                });
            }
            else if(i.day_name === 'Sat') {
                result.push({
                    'day_EN': day_name,
                    'day_ID': "Sabtu",
                    'formated_date': i.formated,
                    'type': 'active',
                    'date': i.date,
                    'timetables': {}
                });
            }
            else {
                const day = i.day_name as ScheduleDayEN;
                let schedule_item: TimetableScheduleDetail<GenericScheduleComponentItem> = {};
                let free_time_counter = 0;
                let break_time_counter = 1;
                let class_session_counter = 0;

                schedule_data.timetables.forEach(timetable => {
                    if(timetable.is_break_time) {
                        schedule_item[timetable.id] = {
                            'main': generateScheduleBreakTime(`Istirahat ke-${break_time_counter}`)
                        }
                        break_time_counter++;
                    }
                    else if(base.schedule[day][timetable.id]) {
                        class_session_counter++;
                        schedule_item[timetable.id] = {
                            'main': generateGenericScheduleComponentItem(schedule_data, base.schedule[day][timetable.id].main, id)
                        };

                        if(base.schedule[day][timetable.id].main.type === 'free-time') {
                            free_time_counter++;
                        }

                        if(base.schedule[day][timetable.id].temporary && isInDateRange(temporary_period, i.formated)) {
                            has_temporary = true;
                            schedule_item[timetable.id].temporary = generateGenericScheduleComponentItem(schedule_data, base.schedule[day][timetable.id].temporary!, id);
                            if(base.schedule[day][timetable.id].main.type === 'free-time') {
                                free_time_counter--;
                            }
                        }
                    }
                });

                if(free_time_counter === class_session_counter) {
                    result.push({
                        'day_EN': day_name,
                        'day_ID': DaysID[idx],
                        'formated_date': i.formated,
                        'type': 'active',
                        'date': i.date,
                        'timetables': {}
                    });
                }
                else {
                    result.push({
                        'day_EN': day_name,
                        'day_ID': DaysID[idx],
                        'formated_date': i.formated,
                        'type': 'active',
                        'date': i.date,
                        'timetables': schedule_item
                    });
                }
            }
        })
    }

    return {'data': result, 'has_temporary': has_temporary};
}