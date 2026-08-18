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
      default: 0
    },
    saved: {
      type: Boolean,
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
      default: 0
    },
    saved: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  lastPurgedAt: {
    type: Date,
    default: Date.now
  }
});

const Users = models.Users || model<IUser>("Users", userSchema);
export default Users;