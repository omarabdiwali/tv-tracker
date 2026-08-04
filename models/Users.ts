import { IUser } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    unique: true,
    required: true
  },
  savedMovies: [{
    movieId: {
      type: String,
      ref: 'Movie',
      required: true
    },
    watched: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      required: false,
      default: 0
    }
  }],
  savedShows: [{
    showId: {
      type: String,
      ref: 'Show',
      required: true
    },
    watchedEpisodes: [{
      type: String
    }],
    rating: {
      type: Number,
      required: false,
      default: 0
    }
  }]
});

const Users = models.Users || model<IUser>("Users", userSchema);
export default Users;