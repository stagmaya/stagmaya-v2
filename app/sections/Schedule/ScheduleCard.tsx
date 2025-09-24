/* eslint-disable prefer-const */
import { ScheduleComponentDetail, ScheduleComponentItem } from "@/app/types/schedule-component-data";
import { ScheduleTimetable } from "@/app/types/schedule-data";
import ScheduleCardItem from "./ScheduleCardItem";

interface Props {
    "data": ScheduleComponentDetail;
    "is_class": boolean;
    "timetables": ScheduleTimetable[];
}

const ScheduleCard = ({data, is_class, timetables}: Props) => {
    if(data.type === 'holiday') {
        return (<div className="flex flex-col overflow-hidden h-full w-[480px] max-w-[calc(100vw-calc(var(--size-2xs)*2))] px-[calc(var(--size-2xs)*1.2)] pt-[calc(var(--size-2xs)*0.9)] border-neutral-5 light:border-neutral-5 dark:border-neutral-1 border-solid border-2 rounded-(--size-m) transition-colors ease-custom duration-300">
            <span className={`font-ppd-medium theme-text-xl text-highlight-red -my-[calc(var(--size-xl)*0.1)]`}>{ data.day_EN }</span>
            <span className='font-ppd-light theme-text-l theme-color-3 -mt-[calc(var(--size-l)*0.05)] pb-(--size-2xs)'>{ data.date }</span>
        </div>)
    }
    else if(Object.keys(data.timetables).length === 0) {
        return (
            <div className="flex flex-col overflow-hidden h-full w-[480px] max-w-[calc(100vw-calc(var(--size-2xs)*2))] px-[calc(var(--size-2xs)*1.2)] pt-[calc(var(--size-2xs)*0.9)] border-neutral-5 light:border-neutral-5 dark:border-neutral-1 border-solid border-2 rounded-(--size-m) transition-colors ease-custom duration-300">
                <span className={`font-ppd-medium theme-text-xl theme-color-4 -my-[calc(var(--size-xl)*0.1)]`}>{ data.day_EN }</span>
                <span className='font-ppd-light theme-text-l theme-color-3 -mt-[calc(var(--size-l)*0.05)] pb-(--size-2xs)'>{ data.date }</span>
            </div>
        )
    }
    else {
        let items: ScheduleComponentItem[] = [];

        timetables.forEach(i => {
            if(data.timetables[i.id]) {
                items.push({
                    'period': i.periode,
                    'schedule': data.timetables[i.id]
                });
            }
        });

        return (
            <div className="flex flex-col overflow-hidden h-full w-[480px] max-w-[calc(100vw-calc(var(--size-2xs)*2))] px-[calc(var(--size-2xs)*1.2)] pt-[calc(var(--size-2xs)*0.9)] border-neutral-5 light:border-neutral-5 dark:border-neutral-1 border-solid border-2 rounded-(--size-m) transition-colors ease-custom duration-300">
            <span className={`font-ppd-medium theme-text-xl theme-color-1 -my-[calc(var(--size-xl)*0.1)]`}>{ data.day_EN }</span>
            <span className='font-ppd-light theme-text-l theme-color-3 -mt-[calc(var(--size-l)*0.05)] pb-(--size-2xs)'>{ data.date }</span>
            <div className='h-full w-full overflow-auto flex flex-col gap-(--size-2xs) hide_scrollbar pb-[calc(var(--size-2xs)*1.2)]' data-lenis-prevent>
                {
                    items.map((i, idx) => (
                        <ScheduleCardItem key={idx} data={i} is_class={is_class} />
                    ))
                }
            </div>
        </div>
        )
    }
}

export default ScheduleCard