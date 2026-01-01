import { Exclude } from 'class-transformer';
import { Product } from '../products/product.entity';
import { Review } from '../reviews/review.entity';
import { CURRENT_TIMESTAMP } from '../utils/constants';
import { UserType } from '../utils/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: '150', nullable: true })
  username: string;

  @Column('varchar', { length: '250', unique: true })
  email: string;

  @Column('varchar', { length: '150' })
  @Exclude()
  password: string;

  @Column('enum', { enum: UserType, default: UserType.USER })
  userType: UserType;

  @Column('boolean', { default: false })
  isAccountVerified: boolean;

  @Column('varchar', { nullable: true })
  verificationToken: string | null;

  @Column('varchar', { nullable: true })
  resetPasswordToken: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => CURRENT_TIMESTAMP,
    onUpdate: CURRENT_TIMESTAMP,
  })
  updatedAt: Date;

  @Column('varchar', { nullable: true, default: null })
  profileImage: string | null;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Product, (reviews) => reviews.user)
  reviews: Review[];
}
