import { supabase } from './supabase'
import type { Game } from '../data/games'

export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('id, title, short, long, cat, cover, color, best, plays')
    .order('title')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    short: row.short as string,
    long: row.long as string,
    cat: row.cat as Game['cat'],
    cover: row.cover as string,
    color: row.color as Game['color'],
    best: row.best as number,
    plays: String(row.plays),
  }))
}
