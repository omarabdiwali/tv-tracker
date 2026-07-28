import { IShow } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const showSchema = new Schema<IShow>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  imdbId: { type: String, required: false },
  overview: { type: String, required: false },
  image: { type: String, required: true },
  imageSmall : { type: String, required: false },
  title: { type: String, required: true },
  episodes: { type: Object, required: false },
  genres: { type: [String], required: false },
  voteAverage: { type: String, required: false },
  homepage: { type: String, required: false },
  language: { type: String, required: false },
  status: { type: String, required: false },
  nextEpisode: { type: String, required: false },
  lastEpisode: { type: String, required: false },
  releaseDate: { type: String, required: false },
  episodeCount: { type: Number, required: false },
  seasonEpisodeCount: { type: Object, required: false }
}, {
  timestamps: true
});

const Show = models.Show || model<IShow>("Show", showSchema);
export default Show;