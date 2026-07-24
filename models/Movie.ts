import { IMovie } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const movieSchema = new Schema<IMovie>({
  id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  image: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  imdbId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  releaseDate: { 
    type: String, 
    required: false 
  }
}, {
  timestamps: true
});

const Movie = models.Movie || model<IMovie>("Movie", movieSchema);
export default Movie;