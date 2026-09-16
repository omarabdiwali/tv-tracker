import { IUserShow } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const userShowSchema = new Schema<IUserShow>({
  userId: { type: Schema.Types.ObjectId, required: true },
  showId: { type: String, required: true },
  episodes: { type: Object, required: false },
  progress: { type: [[]], required: false },
  lastHash: { type: String, required: false },
  rating: { type: Number, default: 0 },
  saved: { type: Boolean, default: false },
  completed: { type: Boolean, default: false }
}, { timestamps: true });

userShowSchema.index({ userId: 1, showId: 1 }, { unique: true });
const UserShows = models.UserShows || model<IUserShow>("UserShows", userShowSchema);
export default UserShows;