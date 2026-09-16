import { IUser } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    unique: true,
  }
});

const Users = models.Users || model<IUser>("Users", userSchema);
export default Users;