import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTable } from './entities/user.entity';

@Injectable()
export class UsersService {
    // Users Entity Repository is injected into the service.
    constructor(
        @InjectRepository(UserTable)
        private readonly userRepository: Repository<UserTable>,
    ) { }

    async findUserByName(username: string) {
        return this.userRepository.findOne({
            where: {
                name: username,
            },
        });
    }

    async create(createUserDto: CreateUserDto) {
        const user = this.userRepository.create({
            name: createUserDto.name,
            email: createUserDto.email,
            password: createUserDto.password,
            age: createUserDto.age,
        });
        //SAVE USER TO DATABASE
        const savedUser = await this.userRepository.save(user);

        return {
            message: 'User created successfully!',
            user: savedUser,
        };
    }

    async login(email: string, password: string) {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            return null;
        }

        if (user.password !== password) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            age: user.age,
        };
    }


    // GET /users
    async findAll() {
        return this.userRepository.find();
    }

    // Find users by age
    async findUsersByAge(age: number) {
        return this.userRepository.find({
            where: {
                age: age,
            },
        });
    }
    // UPDATE USER
    async updateUser(id: number, updateData: Partial<UserTable>) {

        // Update the user in PostgreSQL
        await this.userRepository.update(id, updateData);

        // Get the updated user and return it
        return this.userRepository.findOne({
            where: {
                id: id,
            },
        });
    }
    // DELETE USER
    async deleteUser(id: number) {

        // Delete the user from PostgreSQL
        const result = await this.userRepository.delete(id);

        return {
            message: 'User deleted successfully',
            deleted: result.affected,
        };
    }


    // GET /users/list?page=1&limit=5&name=krish
    async getUsers(
        page: number,
        limit: number,
        name?: string,
    ): Promise<UserTable[]> {

        // Calculate which records we should skip
        const skip = (page - 1) * limit;

        // Start building the database query
        const query = this.userRepository
            .createQueryBuilder('user');

        // If the user searched for a name,
        // search PostgreSQL for matching names.
        if (name) {
            query.where('LOWER(user.name) LIKE LOWER(:name)', {
                name: `%${name}%`,
            });
        }

        // Pagination
        query
            .skip(skip)
            .take(limit);

        // Get users from PostgreSQL
        return query.getMany();
    }
    // QUERY BUILDER - SEARCH USERS BY NAME
    async searchUsers(name: string) {

        const query = this.userRepository
            .createQueryBuilder('user');

        query.where(
            'LOWER(user.name) LIKE LOWER(:name)',
            {
                name: `%${name}%`,
            },
        );

        return query.getMany();
    }
}