import { IUserMovie } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const userMovieSchema = new Schema<IUserMovie>({
  userId: { type: Schema.Types.ObjectId, required: true },
  movieId: { type: String, required: true },
  watched: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  saved: { type: Boolean, default: false }
}, { timestamps: true });

userMovieSchema.index({ userId: 1, movieId: 1 }, { unique: true });
const UserMovies = models.UserMovies || model<IUserMovie>("UserMovies", userMovieSchema);
export default UserMovies;