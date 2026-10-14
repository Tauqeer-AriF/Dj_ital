export type ThemeMode = 'dark' | 'light';

export interface ActiveTrack {
  id: number;
  title: string;
  artist: string;
  year: number;
  bpm: number;
  format: string;
  type: 'decibel' | 'vital' | 'hackney' | 'transmission' | 'hero_stream' | 'main_stream' | 'dejavu_stream' | 'live_stream';
  streamUrl?: string;
}
