import ThemeToggle from './ThemeToggle';
import styles from './Hero.module.css';

interface Props {
    academy_semester: {
        'year': string;
        'semester': string;
    };
}

const Hero = ( { academy_semester }: Props ) => {
    return (
        <section id="hero" className='h-full w-full sticky top-0 overflow-hidden'>
            <nav className='relative m-auto z-20 w-full max-w-[1920px] flex justify-end items-end p-(--size-2xs)'>
                <ThemeToggle />
            </nav>
            <div className='absolute z-10 w-full h-full top-0 left-0 flex'>
                <div id="name" className='relative w-full max-w-[1920px] m-auto flex flex-col items-center justify-center text-center'>
                    <span className='relative theme-color-4 font-ppd-light text-[min(18.7vw,360px)] my-[calc(min(18.7vw,360px)*-0.15)]'>STAGMAYA</span>
                    <span className='relative theme-color-2 font-ppd-medium theme-text-2xl px-(--size-2xs)'>{ `${academy_semester.semester} ` }<span className='font-just-regular'>{academy_semester.year.split('/')[0]}</span>/<span className='font-just-regular'>{academy_semester.year.split('/')[1]}</span></span>
                    <span className="relative theme-color-3 font-ppd-light theme-text-2xs">Created by <a href="https://rianyapson.com" target="_blank" className='font-[400] text-neutral-4 hover:text-neutral-5 light:text-neutral-4  dark:text-neutral-3 light:hover:text-neutral-5 dark:hover:text-neutral-2 hover:font-[600] cursor-pointer transition-all duration-300 ease-custom'>Febriant Yapson</a> (Alumni 2021)</span>
                </div>
                <div id="arrow" className='absolute bottom-0 left-0 w-full flex flex-col items-center justify-center text-center'>
                    <span className='font-ppd-light theme-color-2 theme-text-2xs px-(--size-2xs)'>Scroll kebawah untuk melihat jadwal</span>
                    <div className='relative flex flex-col items-center justify-start w-full pt-2 h-7 mb-(--size-2xs)'>
                        {
                            Array.from({length: 3}).map((_, i) => (
                                <div key={ i } className={ styles.arrow_item }>
                                    <div className='bg-neutral-5 light:bg-neutral-5 dark:bg-neutral-2 transition-colors duration-300 ease-custom flex w-4 h-[1.3px] rotate-35 ml-[3px]'/>
                                    <div className='bg-neutral-5 light:bg-neutral-5 dark:bg-neutral-2 transition-colors duration-300 ease-custom flex w-4 h-[1.3px] -rotate-35 -ml-[3px]'/>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero