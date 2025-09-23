/* eslint-disable prefer-const */
import { DateTime } from "luxon";
import { parseDate } from "@/app/helper/DateParser";
import { ScheduleWeekEnum } from "@/app/types/schedule-week-range";
import { getGoogleDriveID, getGoogleSheetsData } from "./getGoogleSheets";
import { DaysEN, GenericSchedule, ScheduleData, ScheduleDateBased, ScheduleFreeTime, ScheduleTimeBased, ScheduleKeyBased, ScheduleDayID, ScheduleEvent, ScheduleClassSession, ScheduleDayEN } from "@/app/types/schedule-data";
import { ScheduleWeekRangeGenerator } from "@/app/helper/ScheduleWeekRangeGenerator";
import { getAuthorization } from "@/app/helper/Auth";

function getWeekRange(): ScheduleDateBased {
    const today = DateTime.now().setZone("Asia/Jakarta");
    const week = new ScheduleWeekRangeGenerator(today);
    return {
        'start': parseDate(week.monday.toFormat('yyyy/MM/dd')),
        'end': parseDate((week.default_week === ScheduleWeekEnum.NextWeek ? week.sunday : week.sunday.plus({'weeks': 1})).toFormat('yyyy/MM/dd'))
    }
}

function generateScheduleFreeTime(): ScheduleFreeTime {
    return {'type': 'free-time', 'title': ''};
}

function generateScheduleEvent(title: string): ScheduleEvent {
    return { 'type': 'event', 'title': title};
}

function generateScheduleClassSession(title: string, detail: string): ScheduleClassSession {
    return { 'type': 'class-session', 'title': title, 'detail': detail};
}

function generateDefault(type: 'class' | 'teacher', session_ids: string[]): GenericSchedule {
    let result: GenericSchedule = {
        'type': type,
        'schedule': {}
    };
    DaysEN.forEach(day => {
        result.schedule[day] = {}
        session_ids.forEach(id => {
            result.schedule[day][id] = {
                'main': generateScheduleFreeTime()
            };
        })
    });

    return result;
}

function numberToColumn(n: number): string {
    let result = '';
    while(n > 0) {
        result = String.fromCharCode(65 + ((n - 1) % 26)) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
}

enum ScheduleDayEnum {
    Senin = "Mon" , Selasa = "Tue" , Rabu = "Wed" , Kamis = "Thu" , Jumat = "Fri"
}

const BASE_URL = process.env.BASE_GOOGLE_SHEETS_URL;

export async function GET(req: Request) {
    if(!getAuthorization(req.headers.get('Authorization'))) {
        return Response.json({"error": `Failed to Authorize.`}, { status: 403 });
    }

    let result: ScheduleData = {
        "academic_semester": {
            "semester": "",
            "year": ""
        },
        "classes": {},
        "teachers": {},
        "subjects": {},
        "events": {},
        "holidays": [],
        "timetables": [],
        "schedules": {
            "temporary_period": {
                "start": 0,
                "end": 0
            },
            "data": {}
        }
    }

    // Get Week Range Data
    const WEEK_DATA = getWeekRange();

    // Get Schedule URL, Semester, and Academic Year
    const setup_data = await getGoogleSheetsData(getGoogleDriveID(BASE_URL), "Setup", "B6:D6");
    result.academic_semester = {
        'year': setup_data[0][0],
        'semester': setup_data[0][1] 
    }
    const DRIVE_ID = getGoogleDriveID(setup_data[0][2]);

    const [holidays, class_sessions, break_times, classes, teachers, subjects, events] = await Promise.all([
        getGoogleSheetsData(DRIVE_ID, "Daftar Libur", "B5:C"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Jam", "B5:C"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Jam", "E5:F"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Kelas", "B5:B"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Guru", "B5:C"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Mata Pelajaran", "B5:C"),
        getGoogleSheetsData(DRIVE_ID, "Daftar Kegiatan", "B5:D")
    ])


    // Map Valid Holidays 
    holidays.forEach(i => {
        if(i.length == 2) {
            const holiday: ScheduleDateBased = {
                'start': parseDate(i[0]),
                'end': parseDate(i[1])
            };
    
            // If the holiday ends after the week start and the holiday starts before the week is end.
            if(holiday.end >= WEEK_DATA.start && holiday.start <= WEEK_DATA.end) { 
                result.holidays.push(holiday);
            }
        }
    });

    // Map Schedule Timetables
    let break_time: ScheduleTimeBased[] = [];
    break_times.forEach((i) => {
        if(i.length === 2) {
            break_time.push({
                'start': i[0],
                'end': i[1]
            });
        }
    });

    let session_ids: string[] = [];
    let idx_break_time = 0;

    class_sessions.forEach((i, idx) => {
        const timetable_id = `CS${idx + 1}`;
        result.timetables.push({
            'id': timetable_id,
            'periode': `[${idx + 1}] ${i[0]} - ${i[1]}`,
            'is_break_time': false
        });
        session_ids.push(timetable_id);

        if(idx_break_time < break_time.length) {
            if(i[1] === break_time[idx_break_time].start) {
                result.timetables.push({
                    'id': `BT${idx_break_time + 1}`,
                    'periode': `${break_time[idx_break_time].start} - ${break_time[idx_break_time].end}`,
                    'is_break_time': true
                });
                idx_break_time++;
            }
        }
    });

    // Map Classes
    let class_ids: string[] = [];

    classes.forEach((i, idx) => {
        const class_id = `C${(idx + 1).toString().padStart(3, "0")}`;
        result.classes[class_id] = i[0];
        class_ids.push(class_id);
        result.schedules.data[class_id] = generateDefault('class', session_ids);
    });

    // Map Teachers
    let teacher_id_mapper: ScheduleKeyBased = {};
    teachers.forEach((i) => {
        const teacher_id = `T${(i[0]).toString().padStart(3, "0")}`;
        result.teachers[teacher_id] = `[${i[0]}] ${i[1]}`;
        teacher_id_mapper[i[0]] = teacher_id;
        result.schedules.data[teacher_id] = generateDefault('teacher', session_ids);
    });

    // Map Subjects
    subjects.forEach((i) => {
        result.subjects[i[0]] = i[1];
    });

    // Map Event
    events.forEach((i) => {
        result.events[i[0]] = {
            'title': i[1],
            'detail': i[2]
        }
    });

    // Get Main & Temporary Schedule
    const [main_schedules, temporary_schedule, temporary_schedule_period] = await Promise.all([
        getGoogleSheetsData(DRIVE_ID, "Jadwal Utama", `A5:${numberToColumn(classes.length + 3)}${(session_ids.length * 5) + 5}`),
        getGoogleSheetsData(DRIVE_ID, "Jadwal Sementara", `A7:${numberToColumn(classes.length + 3)}${(session_ids.length * 5) + 7}`),
        getGoogleSheetsData(DRIVE_ID, "Jadwal Sementara", `C3:C4`)
    ]);

    result.schedules.temporary_period = {
        'start': parseDate(temporary_schedule_period[0][0]),
        'end': parseDate(temporary_schedule_period[1][0])
    };

    let timetable_exception: ScheduleKeyBased = {};

    main_schedules.forEach(i => {
        let free_time_counter = 0;
        const day: ScheduleDayEN = ScheduleDayEnum[i[0] as ScheduleDayID];
        const session_id: string = session_ids[parseInt(i[1]) - 1];

        for(let j = 3; j < i.length; j++) {
            const schedule = i[j];
            const class_id = class_ids[j - 3];

            if(result.events[schedule]) {
                result.schedules.data[class_id].schedule[day][session_id].main = generateScheduleEvent(schedule);
            }
            else if(schedule === '-') {
                free_time_counter++;
            }
            else if(schedule.indexOf("_") !== -1) {
                const data = schedule.split("_");
                const teacher_id = teacher_id_mapper[data[0]];
                result.schedules.data[class_id].schedule[day][session_id].main = generateScheduleClassSession(data[1], teacher_id);
                result.schedules.data[teacher_id].schedule[day][session_id].main = generateScheduleClassSession(data[1], class_id);
            }
        }
        if(free_time_counter === class_ids.length) {
            timetable_exception[`${day}_${session_id}`] = 'Y';
        }
    });

    temporary_schedule.forEach(i => {
        const day: ScheduleDayEN = ScheduleDayEnum[i[0] as ScheduleDayID];
        const session_id: string = session_ids[parseInt(i[1]) - 1];

        for(let j = 3; j < i.length; j++) {
            const schedule = i[j];
            const class_id = class_ids[j - 3];

            const main = result.schedules.data[class_id].schedule[day][session_id].main;
            const is_temporary_available = main.type === 'class-session' && !result.schedules.data[main.detail].schedule[day][session_id].temporary;
            if(result.events[schedule]) {
                if(main.type === 'event' && main.title === schedule) { continue; }

                result.schedules.data[class_id].schedule[day][session_id].temporary = generateScheduleEvent(schedule);
                if(is_temporary_available) {
                    result.schedules.data[main.detail].schedule[day][session_id].temporary = generateScheduleFreeTime();
                }
            }
            else if(schedule === '-') {
                if(main.type === 'free-time') { continue; }

                result.schedules.data[class_id].schedule[day][session_id].temporary = generateScheduleFreeTime();
                if(is_temporary_available) {
                    result.schedules.data[main.detail].schedule[day][session_id].temporary = generateScheduleFreeTime();
                }
            }
            else if(schedule.indexOf("_") !== -1) {
                const data = schedule.split("_");
                const teacher_id = teacher_id_mapper[data[0]];

                if(main.type === 'class-session' && main.title === data[1] && main.detail === teacher_id) { continue; }

                if(timetable_exception[`${day}_${session_id}`]) {
                    delete timetable_exception[`${day}_${session_id}`];
                }
                result.schedules.data[class_id].schedule[day][session_id].temporary = generateScheduleClassSession(data[1], teacher_id);
                result.schedules.data[teacher_id].schedule[day][session_id].temporary = generateScheduleClassSession(data[1], class_id);
                if(is_temporary_available) {
                    result.schedules.data[main.detail].schedule[day][session_id].temporary = generateScheduleFreeTime();
                }
            }
        }
    });

    // Remove empty schedule teacher
    const total_schedule_item = (DaysEN.length * session_ids.length);
    for(let teacher_id in result.teachers) {
        let free_time_counter = 0;
        for(let day of DaysEN) {
            for(let session_id of session_ids) {
                free_time_counter += result.schedules.data[teacher_id].schedule[day][session_id].main.type === 'free-time' ? 1 : 0;
            }
        }
        if(free_time_counter === total_schedule_item) {
            delete result.schedules.data[teacher_id];
            delete result.teachers[teacher_id];
        }
    }

    // Remove Timetable Exception
    for(let i in timetable_exception) {
        const data = i.split("_");
        const day = data[0];
        const session_id = data[1];

        for(let class_id in result.classes) {
            delete result.schedules.data[class_id].schedule[day][session_id];
        }

        for(let teacher_id in result.teachers) {
            delete result.schedules.data[teacher_id].schedule[day][session_id];
        }
    }

    return Response.json(result, { status: 200 });
}