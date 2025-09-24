import { GenericScheduleComponentItem, ScheduleComponentItem } from "@/app/types/schedule-component-data";
import styles from './ScheduleCardItem.module.css';

interface Props {
    "data": ScheduleComponentItem;
    "is_class": boolean;
}

const COLOR_MAPPER = {
    "blue" : {
        1: "bg-highlight-blue/[15%] transition-colors ease-custom duration-300",
        2: "bg-highlight-blue transition-colors ease-custom duration-300"
    },
    "green": {
        1: "bg-highlight-green/[15%] transition-colors ease-custom duration-300",
        2: "bg-highlight-green transition-colors ease-custom duration-300"
    },
    "yellow": {
        1: "bg-highlight-yellow/[15%] transition-colors ease-custom duration-300",
        2: "bg-highlight-yellow transition-colors ease-custom duration-300"
    },
    "purple": {
        1: "bg-highlight-purple/[15%] transition-colors ease-custom duration-300",
        2: "bg-highlight-purple transition-colors ease-custom duration-300"
    },
    "": {
        1: "bg-neutral-6/[10%] light:bg-neutral-6/[10%] dark:bg-neutral-1/[10%] transition-colors ease-custom duration-300",
        2: "bg-neutral-6 light:bg-neutral-6 dark:bg-neutral-1 transition-colors ease-custom duration-300"
    }
}

function getColor(data: GenericScheduleComponentItem, transparent: 1 | 2 = 2):string {
    switch(data.type) {
        case 'free-time':
        case 'break-time':
            return COLOR_MAPPER[""][transparent];
        case 'event':
            return COLOR_MAPPER["yellow"][transparent];
        case 'class-session':
            return COLOR_MAPPER[data.color][transparent];
    }
}

function getScheduleDetailElement(data: GenericScheduleComponentItem, is_class: boolean): React.JSX.Element {
    if(data.type === 'free-time') { return <></> }
    const subject_element = (<span className='font-ppd-semibold font-extrabold theme-text-s theme-color-2 pb-(--size-s)'>{data.title}</span>);
    switch(data.type) {
        case 'break-time':
            return subject_element;
        case 'event':
            return <>
                {subject_element}
                <span className='font-ppd-medium theme-text-2xs -my-[calc(var(--size-2xs)*0.05)] theme-color-2'>{data.detail}</span>
            </>;
        case 'class-session':
            return is_class ? <>
                {subject_element}
                <span className='font-ppd-medium theme-text-2xs -my-[calc(var(--size-2xs)*0.05)] theme-color-2'>{data.detail}</span>
            </> : <>
                {subject_element}
                <span className='font-ppd-medium theme-text-xs -my-[calc(var(--size-xs)*0.05)] theme-color-2'>{data.detail}</span>
            </>;
    }
}

const ScheduleCardItem = ({ data, is_class }: Props) => {
    if(data.schedule.temporary) {
        const main_schedule: GenericScheduleComponentItem = data.schedule.main;
        const temporary_schedule: GenericScheduleComponentItem = data.schedule.temporary;
        return (
        <div className={`${styles.schedule_wrapper} shrink-0 w-full min-h-[calc(var(--size-xl)*2)] border-neutral-6 light:border-neutral-6 dark:border-neutral-1 border-solid border-2 rounded-(--size-2xs) flex flex-col overflow-hidden transition-colors ease-custom duration-300`}>
            <div className='relative w-full h-full flex flex-row'>
                <div className={`h-full w-(--size-2xs) ${getColor(temporary_schedule)}`}/>
                <div className={`relative flex flex-col h-full w-full pl-[calc(var(--size-2xs)*0.7)] py-[calc(var(--size-2xs)*0.6)] pr-(--size-2xs) ${getColor(temporary_schedule, 1)}`}>
                    <span className='font-just-regular font-black theme-text-m -my-[calc(var(--size-m)*0.05)] theme-color-1'>{data.period}</span>
                    {
                        getScheduleDetailElement(temporary_schedule, is_class)
                    }
                </div>
            </div>
            <div className={`${styles.schedule_prev_change} relative w-full h-full flex flex-row border-t-2 border-neutral-6 light:border-neutral-6 dark:border-neutral-1 border-dashed`}>
                <div className={`h-full w-(--size-2xs) ${getColor(main_schedule)}`}/>
                <div className={`relative flex flex-col h-full w-full pl-[calc(var(--size-2xs)*0.7)] py-[calc(var(--size-2xs)*0.6)] pr-(--size-2xs) ${getColor(main_schedule, 1)}`}>
                    <span className='font-ppd-bold text-[calc(var(--size-2xs)*0.9)] -my-[calc(var(--size-s)*0.05)] theme-color-3 opacity-90'>Sebelum perubahan:</span>
                    {
                        main_schedule.type === 'free-time' && <span className='font-ppd-medium theme-text-2xs theme-color-2 opacity-90'>Tidak ada jadwal</span>
                    }
                    {
                        (main_schedule.type === 'class-session' || main_schedule.type === 'event') && <>
                            <span className='font-ppd-bold theme-text-xs -my-[calc(var(--size-xs)*0.1)] theme-color-2 opacity-90'>{ main_schedule.title }</span>
                            <span className='font-ppd-medium text-[calc(var(--size-2xs)*0.85)] -my-[calc(var(--size-2xs)*0.05)] theme-color-2 opacity-80'>{ main_schedule.detail }</span>
                        </>
                    }
                </div>
            </div>
        </div>
        );
    }
    return (
        <div className='shrink-0 w-full min-h-[calc(var(--size-xl)*2)] border-neutral-6 light:border-neutral-6 dark:border-neutral-1 border-solid border-2 rounded-(--size-2xs) flex flex-row overflow-hidden transition-colors ease-custom duration-300'>
            <div className={`h-full w-(--size-2xs) ${getColor(data.schedule.main)}`}/>
            <div className='relative flex flex-col h-full w-full pl-[calc(var(--size-2xs)*0.7)] py-[calc(var(--size-2xs)*0.6)] pr-(--size-2xs)'>
                <span className='font-just-regular font-black theme-text-m -my-[calc(var(--size-m)*0.05)] theme-color-1'>{data.period}</span>
                {
                    getScheduleDetailElement(data.schedule.main, is_class)
                }
            </div>
        </div>
    )
}

export default ScheduleCardItem