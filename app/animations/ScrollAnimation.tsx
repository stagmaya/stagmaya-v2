'use client'
import gsap from 'gsap';
import Lenis from "lenis";
import { useEffect } from "react";
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

function SmoothScroll(main: HTMLElement):void {
    if(main) {
        const lenis = new Lenis({
            lerp: 0.2,
            wrapper: main,
            content: main
        });

        ScrollTrigger.config({ ignoreMobileResize: true })
        const normalize_scroll = ScrollTrigger.normalizeScroll({
            target: main,
            lockAxis: false,
            allowNestedScroll: true,
            type: "touch",
            momentum: (self: {velocityY:number}) => { 
                return Math.max(10, Math.abs(self.velocityY / 2000));
            },
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            if(lenis.isStopped) {
                lenis.start();
                normalize_scroll?.enable();
            }
            lenis.raf(time * 500);
        });

        gsap.ticker.lagSmoothing(0);
    }
}

const ScrollAnimation = () => {
    useEffect(() => {
        const main = document.querySelector("main");
        if(main) {
            const hero = main.querySelector("#hero");
            const schedule = main.querySelector("#schedule");
            const name = hero?.querySelector('#name')?.getBoundingClientRect();
            
            if(hero && schedule && name) {
                SmoothScroll(main);
                const template_timeline = {
                    trigger: schedule,
                    scroller: main,
                    scrub: 0.5,
                    markers: false
                };

                const main_timeline = gsap.timeline({
                    scrollTrigger: {
                        ...template_timeline,
                        start: "0% 100%",
                        end: "100% 100%",
                    }
                });

                const name_top = ((window.screen.height - name.height) * 0.5) - (window.screen.height * 0.01);

                const schedule_timeline = gsap.timeline({
                    scrollTrigger: {
                        ...template_timeline,
                        start: `0% ${name_top * 100 / window.screen.height}%`,
                        end: `${name_top * 100 / window.screen.height}% ${name_top * 100 / window.screen.height}%`,
                    }
                });

                main_timeline.fromTo(hero.querySelector('#arrow'), { bottom: "0px", opacity: 1 }, { bottom: "5dvh", opacity: 0 }, 'a1');
                main_timeline.fromTo(hero.querySelector('#name .theme-color-3'), { top: "0px", opacity: 1 }, { top: "-2dvh", opacity: 0 }, 'a2');
                main_timeline.fromTo(hero.querySelector('#name .theme-color-2'), { top: "0px", opacity: 1 }, { top: "-2.2dvh", opacity: 0 }, 'a2');
                main_timeline.fromTo(hero.querySelector('#name .theme-color-4'), { top: "0px", opacity: 1 }, { top: "-5dvh", opacity: 0 }, 'a3');
                main_timeline.fromTo(hero.querySelector('nav'), { top: "0px", opacity: 1 }, { top: "-5dvh", opacity: 0}, 'a4');
                schedule_timeline.fromTo(schedule, {"opacity": 0}, {"opacity": 1});
            }
        }
    });
    
    return (
        <></>
    )
}

export default ScrollAnimation;