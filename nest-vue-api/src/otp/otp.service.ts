import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Otp } from './otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  // Generate a new 6-digit OTP
  async generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires after 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP in PostgreSQL
    const newOtp = this.otpRepository.create({
      otp,
      expiresAt,
      status: 'ACTIVE',
    });

    await this.otpRepository.save(newOtp);

    return {
      message: 'OTP generated successfully',
      otp,
      expiresAt: expiresAt.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
      }),
    };
  }

  // Verify the OTP entered by the user
  async verifyOtp(otp: string) {
    // Reject missing or invalid OTP input
    if (!otp || !/^\d{6}$/.test(otp)) {
      throw new BadRequestException('Please enter a valid 6-digit OTP');
    }

    // Find an exact OTP match that is still active
    const otpRecord = await this.otpRepository.findOne({
      where: {
        otp: otp,
        status: 'ACTIVE',
      },
    });

    // No matching active OTP exists
    if (!otpRecord) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check expiry directly, without waiting for cron
    if (new Date(otpRecord.expiresAt).getTime() <= Date.now()) {
      otpRecord.status = 'EXPIRED';
      await this.otpRepository.save(otpRecord);

      throw new UnauthorizedException('OTP has expired');
    }

    // Mark the OTP as used after successful verification
    otpRecord.status = 'USED';
    await this.otpRepository.save(otpRecord);

    return {
      success: true,
      message: 'OTP verified successfully',
    };
  }

  // Automatically runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOtps() {
    const result = await this.otpRepository.update(
      {
        expiresAt: LessThan(new Date()),
        status: 'ACTIVE',
      },
      {
        status: 'EXPIRED',
      },
    );

    console.log(`Expired OTP records: ${result.affected ?? 0}`);
  }
}
