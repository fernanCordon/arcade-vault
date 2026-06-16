import { supabase } from './supabase'

export interface ScoreEntry {
  id: string
  game_id: string
  player_name: string
  score: number
  created_at: string
}

export async function submitScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<ScoreEntry> {
  const { data, error } = await supabase
    .from('scores')
    .insert({ game_id: gameId, player_name: playerName, score })
    .select()
    .single()

  if (error) throw error
  return data as ScoreEntry
}

export async function getScores(gameId?: string): Promise<ScoreEntry[]> {
  let query = supabase
    .from('scores')
    .select('id, game_id, player_name, score, created_at')
    .order('score', { ascending: false })

  if (gameId) query = query.eq('game_id', gameId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ScoreEntry[]
}
