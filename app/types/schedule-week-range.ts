export type DateDetails = {
    "day_name": string;
    "date": number;
    "formated": number;
};

export type ScheduleWeekRange =  {
    "month_year": string;
    "dates": DateDetails[];
    "start_date": number;
    "end_date": number;
};

export enum ScheduleWeekEnum { ThisWeek = -1, NextWeek = 1 };

