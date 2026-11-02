import {
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmployeesService {
  // Shared version changes whenever employee data changes
  private readonly cacheVersionKey = 'employees:cache:version';

  constructor(
    // Communicate with PostgreSQL
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,

    // Communicate with Redis
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    // Read settings from .env
    private readonly configService: ConfigService,
  ) {}

  // Change the version so users stop using old cached lists
  private async invalidateEmployeeCaches(): Promise<void> {
    // Generate a fresh numeric version whenever employee data changes
    const newVersion = Date.now();

    // Save the new version in Redis
    await this.cacheManager.set(this.cacheVersionKey, newVersion);

    console.log(`[CACHE INVALIDATED] New version: ${newVersion}`);
  }

  // Create employee
  async create(employeeData: Partial<Employee>) {
    try {
      // Prepare the employee object
      const employee = this.employeeRepository.create(employeeData);

      // Save the employee in PostgreSQL
      const savedEmployee = await this.employeeRepository.save(employee);

      // Make old cached lists obsolete
      await this.invalidateEmployeeCaches();

      console.log('[DATABASE] Employee created');

      return savedEmployee;
    } catch (error: any) {
      // PostgreSQL error 23505 means a duplicate unique value
      if (error?.driverError?.code === '23505') {
        const detail = error.driverError.detail ?? '';

        //checks duplicate value
        if (detail.includes('(email)=')) {
          throw new ConflictException('Email already exists');
        } else if (
          detail.includes('(employeeCode)=') 
        ) {
          throw new ConflictException('Employee code already exists');
        } else {
          throw new ConflictException('A unique employee field already exists');
        }
      }

      throw error;
    }
  }

  // Get employees using a separate cache for each user
  async findAll(userId: number): Promise<Employee[]> {
    // Read the current version from Redis
    let version = await this.cacheManager.get<number>(this.cacheVersionKey);

    // Initialize the version if Redis doesn't have one
    if (version === undefined || version === null) {
      version = Date.now();
      await this.cacheManager.set(this.cacheVersionKey, version);
    }

    // Create a separate cache key for this user and version
    const cacheKey = `employees:user:${userId}:v${version}`;

    console.log(`[CACHE CHECK] Key: ${cacheKey}`);

    // Check whether this user's employee list is already cached
    const cachedEmployees = await this.cacheManager.get<Employee[]>(cacheKey);

    // If found, return the cached list without querying PostgreSQL
    if (cachedEmployees !== undefined && cachedEmployees !== null) {
      console.log(`[CACHE HIT] User ${userId}`);
      return cachedEmployees;
    }

    // If missing, fetch the latest employee list from PostgreSQL
    console.log(`[CACHE MISS] User ${userId}: Fetched from PostgreSQL`);

    const employees = await this.employeeRepository.find({
      order: { id: 'DESC' },
    });

    // Read cache duration from .env, in milliseconds
    const ttl = Number(this.configService.get('EMPLOYEES_CACHE_TTL', '120000'));

    // Store the employee list in Redis for this user
    await this.cacheManager.set(cacheKey, employees, ttl);

    // Print the TTL in minutes
    console.log(`[CACHE STORE] Key: ${cacheKey}, TTL: ${ttl / 60000} minutes`);

    return employees;
  }

  // Find one employee by ID
  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  // Update employee
  async update(id: number, employeeData: Partial<Employee>): Promise<Employee> {
    const employee = await this.findOne(id);

    // Apply the new values
    Object.assign(employee, employeeData);

    // Save updated data in PostgreSQL
    const updatedEmployee = await this.employeeRepository.save(employee);

    // Make old cached lists obsolete
    await this.invalidateEmployeeCaches();

    console.log(`[DATABASE] Employee ${id} updated`);

    return updatedEmployee;
  }

  // Delete employee
  async remove(id: number): Promise<{ message: string }> {
    const employee = await this.findOne(id);

    // Delete employee from PostgreSQL
    await this.employeeRepository.remove(employee);

    // Make old cached lists obsolete
    await this.invalidateEmployeeCaches();

    console.log(`[DATABASE] Employee ${id} deleted`);

    return { message: 'Employee deleted successfully' };
  }
}
