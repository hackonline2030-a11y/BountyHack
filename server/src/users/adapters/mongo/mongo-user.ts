import {
  Schema as MongooseSchema,
  Prop,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export namespace MongoUser {
  export const CollectionName = 'users';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String })
    _id: string;

    @Prop()
    username: string;

    /** Local JWT auth (optional for imported legacy users). */
    @Prop({ type: String, lowercase: true, sparse: true, unique: true })
    email?: string;

    @Prop({ type: String })
    passwordHash?: string;

    /** Mirrors Postgres `two_factor_enabled` BIGINT (e.g. 0 = off); keep consistent in app logic. */
    @Prop({ type: Number, default: 0 })
    twoFactorEnabled?: number;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
