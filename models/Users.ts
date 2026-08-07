import { IUser } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    unique: true,
    required: true
  },
  movies: [{
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
    },
    saved: {
      type: Boolean,
      required: false,
      default: false
    }
  }],
  shows: [{
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
    },
    saved: {
      type: Boolean,
      required: false,
      default: false
    },
    completed: {
      type: Boolean,
      required: false,
      default: false
    }
  }]
});

const Users = models.Users || model<IUser>("Users", userSchema);
export default Users;