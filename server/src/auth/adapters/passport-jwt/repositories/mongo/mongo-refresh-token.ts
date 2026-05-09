import {
  Schema as MongooseSchema,
  Prop,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export namespace MongoRefreshToken {
  export const CollectionName = 'refresh_tokens';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String, required: true, unique: true, index: true })
    tokenHash: string;

    @Prop({ type: String, required: true, index: true })
    userId: string;

    @Prop({ type: Date, required: true })
    expiryDate: Date;

    @Prop({ type: Date, required: true })
    lastUsedAt: Date;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
