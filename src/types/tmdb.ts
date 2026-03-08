export interface Anime {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
}

export type RootStackParamList = {
  Home: undefined;
  Details: { animeId: number };
  Player: { id: number; season?: number; episode?: number; type: 'serie' | 'filme' };
};