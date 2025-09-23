export function getAuthorization(auth: string | null | undefined): boolean {
    return auth !== undefined && auth !== null && `Bearer ${process.env.SECRET_KEY}` === auth;
}