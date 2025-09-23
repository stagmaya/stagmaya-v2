import { BaseScheduleItem, ScheduleItem, ScheduleFreeTime, BaseScheduleDetail, TimetableScheduleDetail } from './schedule-data';

// Schedule Component Item
export interface ScheduleBreakTime extends BaseScheduleItem<'break-time'> {
    'title': string;
}

type ScheduleEventDetail = ScheduleItem<'event'>;

export type ScheduleColors = "blue" | "green" | "purple";
export interface ScheduleClassSession extends ScheduleItem<'class-session'> {
    "color": ScheduleColors;
}

export type GenericScheduleComponentItem = ScheduleClassSession | ScheduleEventDetail | ScheduleFreeTime | ScheduleBreakTime;

export type ScheduleComponentItem = {
    "period": string,
    "schedule": BaseScheduleDetail<GenericScheduleComponentItem>;
}

// Schedule Component Detail
export type ScheduleComponentDetail = {
    "day_ID": string;
    "day_EN": string;
    "date": number;
    "formated_date": number;
    "type": "active" | "holiday";
    "timetables": TimetableScheduleDetail<GenericScheduleComponentItem>;
}

export type ScheduleComponentData = {
    "has_temporary": boolean;
    "data": ScheduleComponentDetail[];
}

