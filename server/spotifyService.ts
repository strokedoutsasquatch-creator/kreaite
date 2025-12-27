import { SpotifyApi } from "@spotify/web-api-ts-sdk";

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const refreshToken = connectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  const clientId = connectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = connectionSettings.settings?.oauth?.credentials?.expires_in;
  
  if (!connectionSettings || (!accessToken || !clientId || !refreshToken)) {
    throw new Error('Spotify not connected');
  }
  return { accessToken, clientId, refreshToken, expiresIn };
}

export async function getSpotifyClient() {
  const { accessToken, clientId, refreshToken, expiresIn } = await getAccessToken();
  return SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });
}

export function isSpotifyConfigured(): boolean {
  return !!(process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  previewUrl: string | null;
  spotifyUrl: string;
  durationMs: number;
  albumImageUrl: string | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
  spotifyUrl: string;
  followers: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  spotifyUrl: string;
  trackCount: number;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
}

function mapTrack(track: any): SpotifyTrack {
  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name || 'Unknown Artist',
    artistId: track.artists?.[0]?.id || '',
    album: track.album?.name || 'Unknown Album',
    albumId: track.album?.id || '',
    previewUrl: track.preview_url,
    spotifyUrl: track.external_urls?.spotify || '',
    durationMs: track.duration_ms || 0,
    albumImageUrl: track.album?.images?.[0]?.url || null,
  };
}

function mapArtist(artist: any): SpotifyArtist {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres || [],
    popularity: artist.popularity || 0,
    imageUrl: artist.images?.[0]?.url || null,
    spotifyUrl: artist.external_urls?.spotify || '',
    followers: artist.followers?.total || 0,
  };
}

function mapPlaylist(playlist: any): SpotifyPlaylist {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    imageUrl: playlist.images?.[0]?.url || null,
    spotifyUrl: playlist.external_urls?.spotify || '',
    trackCount: playlist.tracks?.total || 0,
    isPublic: playlist.public ?? true,
    ownerId: playlist.owner?.id || '',
    ownerName: playlist.owner?.display_name || 'Unknown',
  };
}

export async function searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
  const client = await getSpotifyClient();
  const results = await client.search(query, ['track'], undefined, limit as any);
  return results.tracks?.items?.map(mapTrack) || [];
}

export async function searchArtists(query: string, limit: number = 20): Promise<SpotifyArtist[]> {
  const client = await getSpotifyClient();
  const results = await client.search(query, ['artist'], undefined, limit as any);
  return results.artists?.items?.map(mapArtist) || [];
}

export async function getArtistTopTracks(artistId: string, market: string = 'US'): Promise<SpotifyTrack[]> {
  const client = await getSpotifyClient();
  const results = await client.artists.topTracks(artistId, market as any);
  return results.tracks?.map(mapTrack) || [];
}

export async function createPlaylist(
  name: string, 
  description: string = '', 
  isPublic: boolean = true
): Promise<SpotifyPlaylist> {
  const client = await getSpotifyClient();
  const user = await client.currentUser.profile();
  const playlist = await client.playlists.createPlaylist(user.id, {
    name,
    description,
    public: isPublic,
  });
  return mapPlaylist(playlist);
}

export async function addTracksToPlaylist(
  playlistId: string, 
  trackUris: string[]
): Promise<{ snapshotId: string }> {
  const client = await getSpotifyClient();
  const result = await client.playlists.addItemsToPlaylist(playlistId, trackUris) as any;
  return { snapshotId: result?.snapshot_id || '' };
}

export async function getUserTopTracks(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit: number = 20
): Promise<SpotifyTrack[]> {
  const client = await getSpotifyClient();
  const results = await client.currentUser.topItems('tracks', timeRange, limit as any);
  return results.items?.map(mapTrack) || [];
}

export async function getUserPlaylists(limit: number = 50): Promise<SpotifyPlaylist[]> {
  const client = await getSpotifyClient();
  const results = await client.currentUser.playlists.playlists(limit as any);
  return results.items?.map(mapPlaylist) || [];
}

export async function getPlaylistTracks(playlistId: string, limit: number = 100): Promise<SpotifyTrack[]> {
  const client = await getSpotifyClient();
  const results = await client.playlists.getPlaylistItems(playlistId, undefined, undefined, limit as any);
  return results.items
    ?.filter((item: any) => item.track)
    .map((item: any) => mapTrack(item.track)) || [];
}

export async function getCurrentUser(): Promise<{ id: string; displayName: string; email: string; imageUrl: string | null }> {
  const client = await getSpotifyClient();
  const user = await client.currentUser.profile();
  return {
    id: user.id,
    displayName: user.display_name || user.id,
    email: user.email || '',
    imageUrl: user.images?.[0]?.url || null,
  };
}

export async function getTrack(trackId: string): Promise<SpotifyTrack> {
  const client = await getSpotifyClient();
  const track = await client.tracks.get(trackId);
  return mapTrack(track);
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  const client = await getSpotifyClient();
  const artist = await client.artists.get(artistId);
  return mapArtist(artist);
}
