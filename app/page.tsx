import { OverlayProvider } from "./contexts/OverlayContext";
import Overlay from "./sections/Overlay";
import Hero from "./sections/Hero";
import Schedule from "./sections/Schedule";
import { ScheduleData } from "@/app/types/schedule-data";
import { GET } from "@/app/api/schedule/route"

export default async function Home() {
    const req = new Request(`${process.env.NEXT_PUBLIC_BASE_URL}/api/schedule`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${process.env.SECRET_KEY}`
        },
        next: { revalidate: 60 }
    })
    
    const res = await GET(req);
    const data: ScheduleData = await res.json();

    return (
        <OverlayProvider>
            <Overlay />
            <main className="w-full h-full relative overflow-y-auto hide_scrollbar z-10">
                <Hero academy_semester={`${data.academic_semester.semester} ${data.academic_semester.year}`}/>
                <Schedule schedule_data={data}/>
            </main>
        </OverlayProvider>
    );
}
