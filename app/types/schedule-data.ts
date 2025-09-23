// Schedule Items
export interface BaseScheduleItem<T extends string> {
    "type": T;
    "title": string;
}

export interface ScheduleItem<T extends string> extends BaseScheduleItem<T> {
    "detail": string;
}

export type ScheduleFreeTime = BaseScheduleItem<'free-time'>;
export type ScheduleEvent = BaseScheduleItem<'event'>;
export type ScheduleClassSession =  ScheduleItem<'class-session'>;

type TeacherScheduleItem = ScheduleClassSession | ScheduleFreeTime;
type ClassScheduleItem = ScheduleClassSession | ScheduleFreeTime | ScheduleEvent;
export type GenericScheduleItem = TeacherScheduleItem | ClassScheduleItem;

// Schedule Details
export interface BaseScheduleDetail<P> {
    "main": P,
    "temporary"?: P
}

export interface TimetableScheduleDetail<P> {
    [key: string]: BaseScheduleDetail<P>; // Timetable ID
}

interface ScheduleDetail<T extends string, P> {
    "type": T;
    "schedule": {
        [key: string]: TimetableScheduleDetail<P>; // Day name
    }
}

type TeacherSchedule = ScheduleDetail<'teacher', TeacherScheduleItem>;
type ClassSchedule = ScheduleDetail<'class', ClassScheduleItem>;
export type GenericSchedule = TeacherSchedule | ClassSchedule;

// Schedule Data
export type ScheduleKeyBased = {
    [key: string]: string;
}

export type ScheduleKeyBasedMapper = {
    "id": string,
    "value": string,
}

export type ScheduleDateBased = {
    "start": number;
    "end": number;
}

export type ScheduleTimeBased = {
    "start": string;
    "end": string
}

export type ScheduleTimetable = {
    "id": string,
    "periode": string,
    "is_break_time": boolean
}

type ScheduleEventData = {
    [key: string]: {
        'title': string,
        'detail': string
    }
}

export type ScheduleDayEN = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export type ScheduleDayID = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat";
export const DaysEN:ScheduleDayEN[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const DaysID:ScheduleDayID[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export type ScheduleData = {
    "academic_semester": {
        "semester": string;
        "year": string;
    };
    "classes": ScheduleKeyBased;
    "teachers": ScheduleKeyBased;
    "subjects": ScheduleKeyBased;
    "events": ScheduleEventData;
    "holidays": ScheduleDateBased[];
    "timetables": ScheduleTimetable[];
    "schedules": {
        "temporary_period": ScheduleDateBased;
        "data": {
            [key: string]: GenericSchedule;
        }
    }
};