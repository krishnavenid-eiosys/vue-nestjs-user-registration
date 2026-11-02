import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('employees')
export class Employee {
    //1. BASIC DETAILS

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    firstName!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    middleName!: string | null;

    @Column({ length: 100 })
    lastName!: string;

    @Column({ type: 'date', nullable: true })
    dateOfBirth!: string | null;

    @Column({ length: 20 })
    gender!: string;

    @Column({ type: 'text', nullable: true })
    profilePhotoUrl!: string | null;


    //2. CONTACT DETAILS 
    @Column({ unique: true, length: 150 })
    email!: string;

    @Column({ length: 15, nullable: true })
    mobileNumber!: string;

    @Column({ length: 15, nullable: true })
    alternateMobileNumber!: string;

    @Column({ length: 200 })
    addressLine1!: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    addressLine2!: string | null;

    @Column({ length: 100 })
    city!: string;

    @Column({ length: 100 })
    state!: string;

    @Column({ length: 100 })
    country!: string;

    @Column({ name: 'pinCode', length: 20 })
    pinCode!: string;


    //3. EMPLOYMENT DETAILS
    @Column({ length: 100, unique: true })
    employeeCode!: string;

    @Column({ length: 100 })
    department!: string;

    @Column({ length: 100 })
    designation!: string;

    @Column({ length: 100 })
    employmentType!: string;

    @Column({ type: 'date' })
    dateOfJoining!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    reportingManager!: string | null;

    @Column({ length: 100 })
    workLocation!: string;

    @Column({ length: 30, default: 'Active' })
    employmentStatus!: string;


    //4. SALARY DETAILS
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    basicSalary!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    hra!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    allowances!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    deductions!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    bankAccountNumber!: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    bankName!: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    ifscCode!: string | null;


    //5. ADDITIONAL DETAILS
    @Column({ type: 'varchar', length: 150, nullable: true })
    highestQualification!: string | null;

    @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
    previousExperience!: string;

    @Column({ type: 'text', nullable: true })
    skills!: string | null;

    @Column({ type: 'varchar', length: 150 })
    emergencyContactName!: string;

    @Column({ type: 'varchar', length: 15 })
    emergencyContactNumber!: string;

    @Column({ type: 'varchar', length: 150 })
    emergencyContactRelationship!: string;

}



export enum EmployeeGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY = 'Prefer not to say',
}

export enum EmploymentType {
  FULL_TIME = 'Full-Time',
  PART_TIME = 'Part-Time',
  CONTRACT = 'Contract',
  INTERN = 'Intern',
}

export enum EmploymentStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  ON_LEAVE = 'On Leave',
  TERMINATED = 'Terminated',
}

export enum EmployeeDepartment {
  ENGINEERING = 'Engineering',
  HUMAN_RESOURCES = 'Human Resources',
  FINANCE = 'Finance',
  MARKETING = 'Marketing',
  SALES = 'Sales',
  OPERATIONS = 'Operations',
}

export enum EmployeeState {
  ANDHRA_PRADESH = 'Andhra Pradesh',
  ARUNACHAL_PRADESH = 'Arunachal Pradesh',
  ASSAM = 'Assam',
  BIHAR = 'Bihar',
  CHHATTISGARH = 'Chhattisgarh',
  GOA = 'Goa',
  GUJARAT = 'Gujarat',
  HARYANA = 'Haryana',
  HIMACHAL_PRADESH = 'Himachal Pradesh',
  JHARKHAND = 'Jharkhand',
  KARNATAKA = 'Karnataka',
  KERALA = 'Kerala',
  MADHYA_PRADESH = 'Madhya Pradesh',
  MAHARASHTRA = 'Maharashtra',
  MANIPUR = 'Manipur',
  MEGHALAYA = 'Meghalaya',
  MIZORAM = 'Mizoram',
  NAGALAND = 'Nagaland',
  ODISHA = 'Odisha',
  PUNJAB = 'Punjab',
  RAJASTHAN = 'Rajasthan',
  SIKKIM = 'Sikkim',
  TAMIL_NADU = 'Tamil Nadu',
  TELANGANA = 'Telangana',
  TRIPURA = 'Tripura',
  UTTAR_PRADESH = 'Uttar Pradesh',
  UTTARAKHAND = 'Uttarakhand',
  WEST_BENGAL = 'West Bengal',
}

export enum EmployeeCountry {
  INDIA = 'India',
  UNITED_STATES = 'United States',
  UNITED_KINGDOM = 'United Kingdom',
  CANADA = 'Canada',
  AUSTRALIA = 'Australia',
  GERMANY = 'Germany',
  FRANCE = 'France',
  JAPAN = 'Japan',
  CHINA = 'China',
  BRAZIL = 'Brazil',
  SOUTH_AFRICA = 'South Africa',
  RUSSIA = 'Russia',
  ITALY = 'Italy',
  SPAIN = 'Spain',
  MEXICO = 'Mexico',
  OTHER = 'Other',
}

export enum EmployeeDesignation {
  SOFTWARE_DEVELOPER = 'Software Developer',
  SENIOR_SOFTWARE_DEVELOPER = 'Senior Software Developer',
  TEAM_LEAD = 'Team Lead',
  PROJECT_MANAGER = 'Project Manager',
  HR_EXECUTIVE = 'HR Executive',
  ACCOUNTANT = 'Accountant',
}
