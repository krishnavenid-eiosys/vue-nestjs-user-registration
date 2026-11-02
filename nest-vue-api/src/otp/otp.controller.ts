import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  // otp generation endpoint
  @Post('generate')
  @HttpCode(HttpStatus.CREATED) // 201: OTP created
  generateOtp() {
    return this.otpService.generateOtp();
  }

    // otp verification endpoint
  @Post('verify')
  @HttpCode(HttpStatus.OK) // 200: Request processed
  verifyOtp(@Body('otp') otp: string) {
    return this.otpService.verifyOtp(otp);
  }
}