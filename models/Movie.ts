import { IMovie } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const movieSchema = new Schema<IMovie>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  image: { type: String, required: true },
  imageSmall: { type: String, required: true },
  title: { type: String, required: true },
  imdbId: { type: String, required: false },
  releaseDate: { type: String, required: false },
  homepage: { type: String, required: false },
  genres: { type: [Object], required: false },
  trailer: { type: String, required: false },
  overview: { type: String, required: false },
  origin: { type: [String], required: false },
  runtime: { type: String, required: false },
  voteCount: { type: Number, required: false },
  voteAverage: { type: Number, required: false }
}, {
  timestamps: true
});

const Movie = models.Movie || model<IMovie>("Movie", movieSchema);
export default Movie;