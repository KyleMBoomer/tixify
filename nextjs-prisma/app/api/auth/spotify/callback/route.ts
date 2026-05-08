import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
                process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64')
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI!
        })
    })

    const tokens = await tokenResponse.json();

    if (tokens.error) {
        return NextResponse.json({ error: 'Failed to fetch tokens from Spotify' }, { status: 500 })
    }

    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {'Authorization': `Bearer ${tokens.access_token}`}
    });
    const profile = await profileResponse.json();

    if (profile.error) {
        return NextResponse.json({ error: 'Failed to fetch profile from Spotify' }, { status: 500 })
    }

    const user = await prisma.user.upsert({
        where: {spotifyId: profile.id},
        update: {
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
        create: {
            email: profile.email,
            name: profile.display_name,
            spotifyId: profile.id,
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        }
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
}
 