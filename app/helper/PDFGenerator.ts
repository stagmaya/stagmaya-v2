import fs from 'fs';
import path from 'path';
import jsPDF from "jspdf";
import { ScheduleTimetable } from "@/app/types/schedule-data";
import { ScheduleComponentDetail } from "@/app/types/schedule-component-data";
import { DaysID } from '@/app/types/schedule-data';

export type PDFGeneratorProps = {
    "timetable": ScheduleTimetable[];
    "schedule": ScheduleComponentDetail[];
    "is_class": boolean;
    "pdf_data": {
        "title": string,
        "detail": string
    }
}

export class PDFGenerator {
    doc: jsPDF;
    canvas_width: number;
    canvas_height: number;
    padding: number;
    header_height: number;
    day_height: number;
    content_width: number;
    content_height: number;
    table_width: number;
    start_x: number;
    data?: PDFGeneratorProps;
    start_y: number;
    table_height: number | undefined;

    constructor() {
        this.canvas_width = 1230;
        this.canvas_height = 945;
        this.padding = 15;
        this.header_height = 100;
        this.day_height = 40;

        this.content_width = this.canvas_width - (this.padding * 2);
        this.content_height = this.canvas_height - this.header_height - (this.padding * 2);

        this.table_width = this.content_width / 6;
        this.start_x = this.padding;
        this.start_y = this.padding;

        this.doc = new jsPDF({
            orientation: 'landscape',
            unit: "pt",
            format: [this.canvas_width, this.canvas_height]
        });
    }

    private resetValue() {
        this.canvas_width = 1230;
        this.canvas_height = 945;
        this.padding = 15;
        this.header_height = 100;
        this.day_height = 40;

        this.content_width = this.canvas_width - (this.padding * 2);
        this.content_height = this.canvas_height - this.header_height - (this.padding * 2);

        this.table_width = this.content_width / 6;
        this.start_x = this.padding;
        this.start_y = this.padding;
        this.doc = new jsPDF({
            orientation: 'landscape',
            unit: "pt",
            format: [this.canvas_width, this.canvas_height]
        });
    }

    private getTextHeight(text_size: number) {
        return text_size * 0.75;
    }

    private getCenterText(x: number, y: number, width: number, height: number, text_size: number, text: string) {
        if(this.doc) {
            return {
                x: x + ((width - this.doc.getTextWidth(text)) / 2),
                y: (height - ((height - this.getTextHeight(text_size)) / 2)) + y
            }
        }
        return {
            x: 0,
            y: 0
        }
    }

    private getTextSize(width: number, height:number, text: string, max_lines:number = 1, font_size: number = 0) {
        font_size = font_size === 0 ? height : font_size;
        let lines: string[] = [];
        if(this.doc) {
            while(font_size > 1) {
                this.doc.setFontSize(font_size);
                lines = this.doc.splitTextToSize(text, width);
                const line_height = this.doc.getTextDimensions(text).h;
                const total_height = lines.length * line_height;
                
                if(lines.length <= max_lines && total_height <= height) {
                    break;
                }

                font_size -= 0.25;
            }
        }

        return {
            text: lines,
            font_size: font_size 
        }
    }

    private getLogo() {
        const image_path = path.join(process.cwd(), 'public/logo', "logo-compressed.png");
        const buffer = fs.readFileSync(image_path);
        const base64_image = buffer.toString('base64');
        return `data:image/jpeg;base64,${base64_image}`; 
    }

    private addHeader() {
        if(this.data) {
            const height = this.header_height - 25;
            let start_y = this.start_y;
            const spacer = height * 0.1;
            const schedule_type = height * 0.21; 
            const schedule_name = height * 0.34;
            const schedule_detail = height * 0.25;
    
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(schedule_type);
            this.doc.text(this.data.is_class ? "Jadwal Kelas" : "Jadwal Guru", this.start_x, (start_y + this.getTextHeight(schedule_type)));
            start_y += schedule_type + spacer;

            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(schedule_name);
            this.doc.text(this.data.pdf_data.title, this.start_x, (start_y + this.getTextHeight(schedule_name)));
            start_y += schedule_name + spacer;

            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(schedule_detail);
            this.doc.text(this.data.pdf_data.detail, this.start_x, (start_y + this.getTextHeight(schedule_detail)));
            
            this.start_y += this.header_height;

            const logo_width = height * 53 / 61;
            this.doc.addImage(this.getLogo(), 'png', (this.canvas_width - this.padding - logo_width), this.padding, logo_width, height, "", 'SLOW', 0);
        }
    }

    private addDays() {
        const style = this.getTextSize(this.table_width, this.day_height * 0.6, DaysID[0], 1);

        for(let i = 1; i <= 5; i++) {
            const x = this.start_x + (this.table_width * i);
            this.doc.setFillColor(167, 196, 220);
            this.doc.setDrawColor(0, 0, 0);
            this.doc.setLineWidth(2);
            this.doc.rect(x, this.start_y, this.table_width, this.day_height, 'FD');

            this.doc.setFontSize(style.font_size);
            this.doc.setFont("helvetica", "bold");
            const position = this.getCenterText(x, this.start_y, this.table_width, this.day_height, style.font_size, DaysID[i - 1]);
            this.doc.text(DaysID[i - 1], position.x, position.y);
        }

        this.start_y += this.day_height;
    }

    private addTimetables() {
        if(this.data) {
            this.content_height = this.canvas_height - this.header_height - this.day_height - (this.padding * 2) ;
            this.table_height = this.content_height / 12;
    
            let break_time_counter = 1;
            for(let i = 0; i < this.data.timetable.length; i++) {
                const y = this.start_y + (this.table_height * i);
                if(this.data.timetable[i].is_break_time) {
                    this.doc.setFillColor(0, 0, 0);
                    this.doc.setDrawColor(0, 0, 0);
                    this.doc.setLineWidth(2);
                    this.doc.rect(this.start_x, y, this.table_width * 6, this.table_height, 'FD');
                    
                    const x = this.start_x + this.table_width;
                    const text = `Istirahat Ke-${break_time_counter}`;
                    const schedule_width = this.table_width * 5;
                    const style = this.getTextSize(schedule_width, this.table_height*0.6, text, 1);
                    
                    this.doc.setFontSize(style.font_size);
                    this.doc.setTextColor(255, 255, 255);
                    this.doc.setFont("helvetica", "bold");
                    const position = this.getCenterText(x, y, schedule_width, this.table_height, style.font_size, text)
                    this.doc.text(text, position.x, position.y);
                    
                    break_time_counter++;
                }
                else {
                    this.doc.setTextColor(0, 0, 0);
                    this.doc.setFillColor(157, 205, 192);
                    this.doc.setDrawColor(0, 0, 0);
                    this.doc.setLineWidth(2);
                    this.doc.rect(this.start_x, y, this.table_width, this.table_height, 'FD');
                }

                const text = this.data.timetable[i].periode;
                const style = this.getTextSize(this.table_width*0.8, this.table_height, text, 1);
                this.doc.setFontSize(style.font_size);
                this.doc.setFont("helvetica", "bold");
                const position = this.getCenterText(this.start_x, y, this.table_width, this.table_height, style.font_size, text);
                this.doc.text(text, position.x, position.y);
            }
        }

        this.start_x += this.table_width;
    }

    private addSchedules() {
        if(this.data && this.table_height) {
            const padding = 6;
            const inner_table_width = (this.table_width - (padding * 2));
            const inner_table_height = (this.table_height - (padding * 2));

            const setEmptyTable = (x: number, y: number, fill: boolean = false) => {
                this.doc.setLineWidth(2);
                this.doc.setDrawColor(0, 0, 0);
                this.doc.setFillColor(237, 231, 177);
                this.doc.rect(x, y, this.table_width, this.table_height ?? 0, fill ? 'FD' : 'D');
            }

            const setScheduleData = (x: number, y: number, title_text: string, detail_text:string) => {
                const title_font_size = inner_table_height * 0.35;
                const title_height = inner_table_height * 0.4;
                this.doc.setFont("helvetica", "bold");
                const title = this.getTextSize(inner_table_width, title_height, title_text, 2, title_font_size);
                this.doc.setFontSize(title.font_size);
                this.doc.text(title.text, x + padding, y + this.getTextHeight(title.font_size) + padding);

                const detail_font_size = inner_table_height * 0.28;
                const detail_height = inner_table_height * 0.6;
                this.doc.setFont("helvetica", "normal");
                const detail = this.getTextSize(inner_table_width, detail_height, detail_text, 2, detail_font_size);
                this.doc.setFontSize(detail.font_size);
                const bottom = detail.text.length === 2 ? (detail.font_size) : 0;
                this.doc.text(detail.text, x + padding, y + (this.table_height ?? 0) - (padding * 1.5) - bottom);
            }


            for(let i = 0; i < 5; i++) {
                const x = this.start_x + (this.table_width * i);
                if(this.data.schedule[i].type === 'holiday') {
                    for(let j = 0; j < this.data.timetable.length; j++) {
                        const y = this.start_y + (this.table_height * j);
                        if(!this.data.timetable[j].is_break_time) {
                            this.doc.setFillColor(254, 109, 115);
                            this.doc.setDrawColor(0, 0, 0);
                            this.doc.setLineWidth(2);
                            this.doc.rect(x, y, this.table_width, this.table_height, 'FD');
                        }
                    }
                }
                else {
                    for(let j = 0; j < this.data.timetable.length; j++) {
                        const timetable = this.data.timetable[j];
                        const y = this.start_y + (this.table_height * j);
                        if(!timetable.is_break_time) {
                            const data = this.data.schedule[i].timetables[timetable.id];
                            if(!data) {
                                setEmptyTable(x, y);
                            }
                            else if(data.main.type !== 'break-time') {
                                let title_text = data.main.title;
                                let detail_text = data.main.type === 'class-session' || data.main.type === 'event' ? data.main.detail : '';

                                if(data.temporary && data.temporary.type !== 'break-time') {
                                    setEmptyTable(x, y, true);
                                    if(data.temporary.type === 'free-time') { continue; }
                                    else {
                                        title_text = data.temporary.title;
                                        detail_text = data.temporary.detail;
                                    }
                                }
                                else {
                                    setEmptyTable(x, y);
                                }

                                setScheduleData(x, y, title_text, detail_text);
                            }
                        }
                    }
                }
            }
        }
    }

    generate(data: PDFGeneratorProps) {
        this.data = data;
        this.resetValue();
        this.addHeader();
        this.addDays();
        this.addTimetables();
        this.addSchedules();
    }

    getArrayBuffer(): ArrayBuffer | null { // For JSON
        return this.doc.output("arraybuffer");
    }

    getUriString(): string | undefined { // For iframe
        return this.doc.output("datauristring");
    }
}