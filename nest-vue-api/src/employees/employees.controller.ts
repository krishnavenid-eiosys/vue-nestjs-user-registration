import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import type { Request as ExpressRequest } from 'express';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/authguard';

import {
  EmployeeGender,
  EmploymentType,
  EmploymentStatus,
  EmployeeDepartment,
  EmployeeDesignation,
  EmployeeState,
  EmployeeCountry,
  Employee,
} from './employee.entity';

// The logged-in user's information comes from the JWT strategy
interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(
    private readonly employeesService: EmployeesService,
  ) {}

  @Get('options')
  getOptions() {
    return {
      gender: Object.values(EmployeeGender),
      department: Object.values(EmployeeDepartment),
      designation: Object.values(EmployeeDesignation),
      state: Object.values(EmployeeState),
      country: Object.values(EmployeeCountry),
      employmentType: Object.values(EmploymentType),
      employmentStatus: Object.values(EmploymentStatus),
    };
  }

  @Post()
  create(@Body() employeeData: Record<string, any>) {
    if (
      !employeeData.firstName ||
      !employeeData.lastName ||
      !employeeData.email ||
      !employeeData.employeeCode
    ) {
      throw new BadRequestException(
        'First name, last name, email and employee code are required',
      );
    }

    return this.employeesService.create(employeeData);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    // Pass the authenticated user's ID to the service
    return this.employeesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() employeeData: Partial<Employee>,
  ) {
    return this.employeesService.update(id, employeeData);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.remove(id);
  }
}
