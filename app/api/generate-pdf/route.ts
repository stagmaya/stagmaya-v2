import { PDFGenerator, PDFGeneratorProps } from "@/app/helper/PDFGenerator";

const generator = new PDFGenerator();

function isAvailablePDFData(body: PDFGeneratorProps): boolean {
    return !!(body.pdf_data && body.pdf_data.detail && body.pdf_data.title);
}

function isAvailableSchedule(body: PDFGeneratorProps): boolean {
    return !!(body.schedule && body.schedule.length > 0);
}

function isAvailableTimetables(body: PDFGeneratorProps): boolean {
    return !!(body.timetable && body.timetable.length > 0);
}

export async function POST(req: Request) {
    let body: PDFGeneratorProps;
    try {
        body = await req.json();
    }
    catch(e) {
        console.error(e);
        return Response.json({ "error": "Missing title or content" },
            { status: 400 }
        );
    }

    if (body.is_class === undefined || body.is_class === null || !isAvailablePDFData(body) || !isAvailableSchedule(body) || !isAvailableTimetables(body)) {
        return Response.json({ "error": "Missing title or content" },
            { status: 400 }
        );
    }

    generator.generate(body);
    return new Response(generator.getArrayBuffer(), {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="Jadwal_${body.pdf_data.title}_${body.pdf_data.detail}.pdf"`,
        },
    });
}