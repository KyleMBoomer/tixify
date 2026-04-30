import { NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

export async function GET() {
    const scopes = 'user-top-read user-read-email user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&
    client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&
    redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI!)}`;
    return NextResponse.redirect(authUrl);
}