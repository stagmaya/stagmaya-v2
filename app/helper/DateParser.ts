export function parseDate(date: string): number {
    return parseInt(date.split("/").join(''));
}