'use client'

import { DateTime } from "luxon";
import ScheduleCard from "./ScheduleCard";
import styles from "./Schedule.module.css";
import { useOverlay } from "@/app/contexts/OverlayContext";
import { PDFGeneratorProps } from "@/app/helper/PDFGenerator";
import { useEffect, useReducer, useRef, useState } from "react";
import { ScheduleWeekEnum } from "@/app/types/schedule-week-range";
import { toScheduleComponentData } from "@/app/helper/ScheduleParser";
import { ScheduleComponentData } from "@/app/types/schedule-component-data";
import { ScheduleWeekRangeGenerator } from "@/app/helper/ScheduleWeekRangeGenerator";
import { ScheduleData, ScheduleKeyBased, ScheduleKeyBasedMapper } from "@/app/types/schedule-data";
enum PlaceholderDefault { Class="Pilih kelas", Teacher="Pilih nama guru" };

const today = DateTime.now().setZone("Asia/Jakarta");
const school_week_info = new ScheduleWeekRangeGenerator(today);

type State = {
    "month_year": string;
    "placeholder": string;
    "placeholder_id": string
    "week": ScheduleWeekEnum;
    "is_class": boolean;
    "disabled_prev": boolean;
    "disabled_next": boolean;
    "disabled_download": boolean;
    "display_schedule": boolean;
    "display_dropdown": boolean;
    "dropdown_item": ScheduleKeyBasedMapper[];
};

type PreReducerAction = 
    | { "type": "SET_ROLE", "payload": {"is_class": boolean} }
    | { "type": "SET_PLACEHOLDER", "payload": {"placeholder": string, "id": string } }
    | { "type": "SET_DISPLAY_WEEK", "payload": {"week": ScheduleWeekEnum} }
    | { "type": "SET_DISPLAY_DROPDOWN" }
    | { "type": "SET_DOWNLOAD_ICON" };

type ReducerAction = 
    | PreReducerAction
    | { "type": "SET_DISPLAY_SCHEDULE" }
    | { "type": "SET_MONTH_YEAR_MANUAL", "payload": { "month_year": string} }
    | { "type": "SET_DROPDOWN_ITEM", "payload": {"dropdown_item": ScheduleKeyBasedMapper[]}};

function getMonthYear(week: ScheduleWeekEnum): string {
    switch(week) {
        case ScheduleWeekEnum.ThisWeek:
            return school_week_info.this_week.month_year;
        case ScheduleWeekEnum.NextWeek:
            return school_week_info.next_week.month_year;
    }
}

function availableNextWeek(week: ScheduleWeekEnum): boolean {
    return week !== ScheduleWeekEnum.NextWeek;
}

function availablePrevWeek(week: ScheduleWeekEnum): boolean {
    return school_week_info.default_week !== ScheduleWeekEnum.NextWeek && !availableNextWeek(week);
}

function keyBaseToArray(data: ScheduleKeyBased): ScheduleKeyBasedMapper[] {
    // eslint-disable-next-line prefer-const
    let result: ScheduleKeyBasedMapper[] = [];
    for(const id in data) {
        result.push({
            'id': id,
            'value': data[id]
        });
    }
    return result;
}

function reducer(prevState: State, action: ReducerAction): State {
    switch(action.type) {
        case "SET_ROLE": 
            return {
                ...prevState,
                'is_class': action.payload.is_class,
                'month_year': getMonthYear(school_week_info.default_week),
                'placeholder': action.payload.is_class ? PlaceholderDefault.Class : PlaceholderDefault.Teacher,
                'placeholder_id': "",
                'disabled_prev': true,
                'disabled_next': true,
                'disabled_download': true,
                'display_schedule': false,
                'display_dropdown': false,
                'week': school_week_info.default_week,
            };
        case "SET_PLACEHOLDER":
            return {
                ...prevState,
                'month_year': getMonthYear(school_week_info.default_week),
                'placeholder': action.payload.placeholder,
                'placeholder_id': action.payload.id,
                'disabled_prev': true,
                'disabled_next': true,
                'disabled_download': true,
                'display_schedule': false,
                'display_dropdown': false,
                'week': school_week_info.default_week
            };
        case "SET_DISPLAY_WEEK":
            if(availablePrevWeek(action.payload.week) || availableNextWeek(action.payload.week)) {
                return {
                    ...prevState,
                    'month_year': getMonthYear(action.payload.week),
                    'disabled_prev': true,
                    'disabled_next': true,
                    'disabled_download': true,
                    'display_schedule': false,
                    'week': action.payload.week
                };
            }
            break;
        case "SET_DISPLAY_SCHEDULE":
            return {
                ...prevState, 
                'disabled_prev': !availablePrevWeek(prevState.week), 
                'disabled_next': !availableNextWeek(prevState.week),
                'disabled_download': false,
                'display_schedule': true
            };
        case "SET_DISPLAY_DROPDOWN": 
            return {
                ...prevState,
                'display_dropdown': !prevState.display_dropdown
            };
        case "SET_MONTH_YEAR_MANUAL": 
            return {
                ...prevState,
                'month_year': action.payload.month_year
            };
        case "SET_DROPDOWN_ITEM": 
            return {
                ...prevState,
                'dropdown_item': action.payload.dropdown_item
            };
        case "SET_DOWNLOAD_ICON": 
            return {
                ...prevState,
                'disabled_download': !prevState.disabled_download
            }
        default:
            break;
    }
    return { ...prevState };
}

type Props = {
    schedule_data: ScheduleData
}

const Schedule = ({schedule_data}: Props) => {
    const { closeFirstTime } = useOverlay();
    const [is_animating, setIsAnimating] = useState(false);
    const [today_position, setTodayPosition] = useState(0);
    const [schedules, setSchedules] = useState<ScheduleComponentData>({'data': [], 'has_temporary': false});
    const [state, dispatch] = useReducer(reducer, {
        "month_year": "",
        "placeholder": PlaceholderDefault.Teacher,
        "placeholder_id": "",
        "week": school_week_info.default_week,
        "is_class": false,
        "disabled_prev": true,
        "disabled_next": true,
        "disabled_download": true,
        "display_schedule": false,
        "display_dropdown": false,
        "dropdown_item": []
    });

    const dropdown_ref = useRef<HTMLUListElement| null>(null);
    const schedule_ref = useRef<HTMLDivElement | null>(null)
    const schedule_track_ref = useRef<HTMLDivElement | null>(null)

    function prereducer(action: PreReducerAction): void {
        if(!is_animating) {
            setIsAnimating(true);
            const wait_time: number = state.display_schedule && action.type !== 'SET_DISPLAY_DROPDOWN' ? 600 : 0;
            if(action.type === 'SET_DISPLAY_WEEK' && !availablePrevWeek(action.payload.week) && !availableNextWeek(action.payload.week)) {
                return;
            } 
            dispatch(action);

            setTimeout(() => {
                let wait_time = 0;
                if(action.type === 'SET_ROLE') {
                    dispatch({'type': "SET_DROPDOWN_ITEM", "payload": {'dropdown_item': keyBaseToArray(action.payload.is_class ? schedule_data.classes : schedule_data.teachers)}});
                }
                else if(action.type !== 'SET_DISPLAY_DROPDOWN') {
                    wait_time = 600;

                    let placeholder_id = state.placeholder_id;
                    let week = school_week_info.default_week;
                    
                    if(action.type === 'SET_PLACEHOLDER') {
                        placeholder_id = action.payload.id;
                    }
                    else if(action.type === 'SET_DISPLAY_WEEK') {
                        week = action.payload.week;
                    }

                    setSchedules(toScheduleComponentData(schedule_data, (week === ScheduleWeekEnum.ThisWeek ? school_week_info.this_week : school_week_info.next_week),  placeholder_id));
                    if(week === ScheduleWeekEnum.ThisWeek) {
                        setTodayPosition(today.weekday);
                    }
                    else if(today_position !== 0) {
                        setTodayPosition(0);
                    }
                    dispatch({type: 'SET_DISPLAY_SCHEDULE'});
                }

                setTimeout(() => {
                    setIsAnimating(false);
                }, wait_time);
            }, wait_time);
        }
    }

    function getCursor(otherCondition: boolean | null = null, otherCursor: string | null = null):string {
        if(otherCondition !== null && otherCursor !== null) {
            return otherCondition ? otherCursor : getCursor();
        }
        return is_animating ? 'cursor-default' : 'cursor-pointer';
    }

    async function downloadSchedule() {
        dispatch({'type': 'SET_DOWNLOAD_ICON'});
        const week = state.week === ScheduleWeekEnum.NextWeek && school_week_info.next_week ? school_week_info.next_week : school_week_info.this_week;
        let detail = `Tahun Ajaran ${schedule_data.academic_semester.year} Semester ${schedule_data.academic_semester.semester}`;
        if(schedules.has_temporary) {
            const monday = DateTime.fromFormat(week.dates[0].formated.toString(), 'yyyyMMdd').toFormat('yyyy/MM/dd');
            const friday = DateTime.fromFormat(week.dates[4].formated.toString(), 'yyyyMMdd').toFormat('yyyy/MM/dd');
            detail = `${monday} sampai ${friday}`;
        }

        const data: PDFGeneratorProps = {
            'is_class': state.is_class,
            'pdf_data': {
                'title': ((state.is_class ? "Kelas " : "") + state.placeholder),
                'detail': detail
            },
            'timetable': schedule_data.timetables,
            'schedule': schedules.data
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-pdf`, {
            method: "POST",
            body: JSON.stringify(data),
            next: { 'revalidate' : 60 }
        });

        if(res.status === 200) {
            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition");
            const filename = disposition ? disposition.split("filename=")[1].replace(/"/g, "") : `Jadwal_${data.pdf_data.title}_${data.pdf_data.detail}.pdf`;
            const file = new File([blob], filename, { type: "application/pdf" });
            const url = window.URL.createObjectURL(file);
            
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink); 
        }

        setTimeout(() => {
            dispatch({'type': 'SET_DOWNLOAD_ICON'});
        }, 100);
    }

    useEffect(()=> {
        dispatch({'type': "SET_DROPDOWN_ITEM", "payload": {'dropdown_item': keyBaseToArray(schedule_data.teachers)}});
        dispatch({'type': 'SET_MONTH_YEAR_MANUAL', 'payload': {'month_year': getMonthYear(school_week_info.default_week)}});
        setTimeout(() => {
            closeFirstTime();
        }, 2200);
    }, []);

    useEffect(() => {
        if(dropdown_ref.current) {
            dropdown_ref.current.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [state.is_class]);

    useEffect(() => {
        if(schedule_ref.current && schedule_track_ref.current) {
            if(state.display_schedule) {
                const margin_left = parseInt(window.getComputedStyle(document.body).getPropertyValue('--size-2xs').split('px')[0]);
                schedule_ref.current.scrollTo({ left: ((schedule_track_ref.current.getBoundingClientRect().width * (today_position - 1) / 7) - (margin_left / 2)), behavior: "instant" });
            }
        }
    }, [today_position, state.display_schedule]);

    return (
        <section id="schedule" className='h-full w-full sticky top-0 flex flex-col py-[calc(var(--size-2xl)*0.2)]' suppressHydrationWarning>
            <div className='relative z-60 w-full max-w-[1920px] m-auto flex flex-row flex-wrap-reverse justify-between items-center gap-[min(var(--size-2xs),1.2dvh)] pt-[calc(var(--size-2xl)*0.4)] px-(--size-2xs) sm:px-[clamp(var(--size-2xs),5vw,var(--size-xl))]'> 
                <div className='flex flex-row flex-wrap-reverse shrink-0 grow-0 justify-between gap-5 w-full max-w-[60rem] relative z-50'>
                    <div className={`${styles.dropdown_placeholder} w-full`} data-display-dropdown={ state.display_dropdown }>
                        <div className={`${styles.dropdown_wrapper} ${styles.schedule_selector_item} ${getCursor()}`} onClick={() => {prereducer({'type': 'SET_DISPLAY_DROPDOWN'})}}>
                            <span className='font-ppd-medium theme-color-1 theme-text-xs wrap-break-word pr-2'>{ state.placeholder }</span>
                            <div className='relative top-0 w-6 h-full flex flex-col justify-center items-center'>
                                <div className={`${styles.dropdown_icon_line} light:bg-neutral-6 dark:bg-neutral-1 flex absolute h-0.5 w-[min(1em,1.5dvh)] top-[50%] translate-y-[-50%] right-[min(.65em,1dvh)]`}></div>
                                <div className={`${styles.dropdown_icon_line} light:bg-neutral-6 dark:bg-neutral-1 flex absolute h-0.5 w-[min(1em,1.5dvh)] top-[50%] translate-y-[-50%] right-0`}></div>
                            </div>
                        </div>
                        <ul ref={dropdown_ref} className={`${styles.dropdown_selection} light:border-neutral-6 dark:border-neutral-1 border-solid border-l-2 border-r-2 border-b-2 light:bg-neutral-1 dark:bg-neutral-6 absolute flex flex-col w-full h-[70dvh] z-500 overflow-auto list-none origin-top break-words style_scrollbar`} data-lenis-prevent>
                            {
                                state.dropdown_item.map((i) => (
                                    <li key={i.id} className={`${getCursor()} ${styles.dropdown_item}`} onClick={() => {prereducer({'type': 'SET_PLACEHOLDER', 'payload': {'placeholder': i.value, 'id': i.id}})}}>
                                        <p className='theme-color-3 font-ppd-regular theme-text-xs'>{ i.value }</p>
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </div>
                <div className={`relative w-full sm:max-w-2xs ${getCursor()}`} onClick={() => {prereducer({'type': 'SET_ROLE', 'payload': {'is_class': !state.is_class}})}}>
                    <div className={`${styles.role_picker} ${styles.schedule_selector_item} relative flex w-full ${getCursor()}`}>
                        <input id='role-picker' type="checkbox" checked={state.is_class} readOnly className={`${styles.role_picker_checkbox} appearance-none`} />
                        <div className={`${styles.role_picker_wrapper} relative w-full h-full flex flex-row justify-between items-center`}>
                            <span className={`${styles.role_picker_item} font-ppd-medium theme-text-xs wrap-break-word`}>Guru</span>
                            <span className={`${styles.role_picker_item} font-ppd-medium theme-text-xs wrap-break-word`}>Kelas</span>
                        </div>
                        <div className={`${styles.role_picker_bg} absolute light:bg-neutral-6 dark:bg-neutral-1 h-full top-0 rounded-[5em_5em_5em_5em] w-[calc(50%+2px)] -ml-[1px] -z-1 left-[0%]`}/>
                    </div>
                </div>
            </div>
            <div className="relative z-50 h-min w-full max-w-[1920px] m-auto flex flex-row flex-nowrap justify-between items-center gap-[min(var(--size-2xs),1.2dvh)] py-[min(var(--size-xs),2.5dvh)] px-(--size-xs) sm:px-[clamp(var(--size-xs),5vw,var(--size-xl))]">
                <span className='theme-text-2xl font-ppd-semibold theme-color-1'>{state.month_year}</span>
                <div className="flex flex-row justify-end items-center gap-[calc(var(--size-2xl)*0.2)]">
                    <svg data-disabled={ state.disabled_download } onClick={async () => {if(state.disabled_download) {return} await downloadSchedule()}} className={ `${styles.download_icon} ${getCursor(state.disabled_download, 'cursor-not-allowed')}` } width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className={ styles.circle } cx="50" cy="50" r="50" fill="white"/>
                        <path className={ styles.path } d="M48.4444 23V60.2656L37.5885 48.3828L34.6337 51.6172L49.0226 67.3672L50.5 68.9141L51.9774 67.3672L66.3663 51.6172L63.4115 48.3828L52.5556 60.2656V23H48.4444ZM32 72.5V77H69V72.5H32Z" fill="black"/>
                    </svg>
                    <svg data-disabled={ state.disabled_prev } onClick={() => {if(state.disabled_prev) { return } prereducer({'type': 'SET_DISPLAY_WEEK', 'payload': {'week': ScheduleWeekEnum.ThisWeek}})}} className={ `${styles.navigation_icon} ${getCursor(state.disabled_prev, 'cursor-not-allowed')}` } width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className={ styles.circle } cx="50" cy="50" r="50" fill="white"/>
                        <path className={ styles.path } d="M59.2762 23L30.781 48.344L29 50L30.781 51.656L59.2762 77L63 73.688L36.3667 50L63 26.312L59.2762 23Z" fill="black"/>
                    </svg>
                    <svg data-disabled={ state.disabled_next } onClick={() => {if(state.disabled_next) { return } prereducer({'type': 'SET_DISPLAY_WEEK', 'payload': {'week': ScheduleWeekEnum.NextWeek}})}} className={ `${styles.navigation_icon} ${getCursor(state.disabled_next, 'cursor-not-allowed')}` } width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle className={ styles.circle } cx="50" cy="50" r="50" fill="white"/>
                        <path className={ styles.path } d="M40.7238 23L37 26.312L63.6333 50L37 73.688L40.7238 77L69.219 51.656L71 50L69.219 48.344L40.7238 23Z" fill="black"/>
                    </svg>
                </div>
            </div>
            <div ref={schedule_ref} data-display={ state.display_schedule } className={`${styles.schedule_wrapper} relative w-full h-full m-auto overflow-x-auto overflow-y-hidden pb-[max(calc(var(--size-2xl)*0.2),var(--size-2xs))] style_scrollbar`}>
                <div ref={schedule_track_ref} className="relative w-max m-auto h-full display flex flex-row flex-nowrap gap-(--size-2xs) px-(--size-2xs)">
                    {
                        schedules.data.map((i, idx) => (
                            <ScheduleCard data={i} key={`${idx}${state.placeholder_id}`} is_class={state.is_class} timetables={schedule_data.timetables}/>
                        ))
                    }
                </div>
            </div>
        </section>
    );
}

export default Schedule;