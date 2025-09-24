/* eslint-disable prefer-const */
type GoogleSheetsBaseRespond = {
    "v": string
    "f"?: string
}

type GoogleSheetsRespond = {
    "c": GoogleSheetsBaseRespond[]
}

export function getGoogleDriveID(url: string | undefined):string {
    return url ? url.split("/d/")[1].split("/")[0] : "";
}

export async function getGoogleSheetsData(id: string, title: string, range: string): Promise<string[][]> {
    const respond = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?sheet=${title}&range=${range}`, { next: { revalidate: 0 } });
    const text = await respond.text();
    const data: GoogleSheetsRespond[] = JSON.parse(text.substring(47).slice(0,-2)).table.rows;
    let result: string[][] = [];

    for(const i of data) {
        let temp: string[] = [];
        for(const j of i.c) {
            if(j) {
                if(j.f){
                    temp.push(j.f);
                }
                else if(j.v) {
                    temp.push(j.v);
                }
            }
        }
        result.push(temp);
    }

    return result;
}