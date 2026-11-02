import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn()
  id!: number;

  // Stores the generated OTP
  @Column()
  otp!: string;

  // Stores when the OTP expires
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  // Tracks whether the OTP is active or expired
  @Column({ default: 'ACTIVE' })
  status!: string;
}