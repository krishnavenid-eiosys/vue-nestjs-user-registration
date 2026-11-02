import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from './employees/employees.module';
import  { ScheduleModule } from '@nestjs/schedule';

import { OtpModule } from './otp/otp.module';

// NestJS module that enables caching
import { CacheModule } from '@nestjs/cache-manager';

// Connects the cache to Redis
import { createKeyv } from '@keyv/redis';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres123',
      database: 'form_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    // Configure Redis as the cache sto rage
    CacheModule.registerAsync({
      isGlobal: true, // Other modules can use the cache
      useFactory: async () => ({
        stores: [createKeyv('redis://localhost:6379')],
      }),
    }),
    EmployeesModule,
    OtpModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
