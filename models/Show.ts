import { IShow } from '@/utils/types';
import { Schema, model, models } from 'mongoose';

const showSchema = new Schema<IShow>({
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

const Show = models.Show || model<IShow>("Show", showSchema);
export default Show;