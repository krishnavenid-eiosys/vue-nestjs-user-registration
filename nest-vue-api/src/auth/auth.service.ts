import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {

    constructor(
        // Used to create the signed JWT.
        private readonly jwtService: JwtService,

        // Reuse the existing user validation logic.
        private readonly usersService: UsersService,
    ) { }

    async login(email: string, password: string) {

        // Check whether the submitted credentials are correct.
        // await waits for PostgreSQL to return the user.
        const user = await this.usersService.login(email, password);

        // Never issue a token when credentials are invalid.
        if (!user) {
            throw new UnauthorizedException(
                'Invalid email or password',
            );
        }

        // The payload contains identity information, not a password.
        const payload = {
            sub: user.id,
            email: user.email,
        };

        // Sign the payload and generate an access token.
        const accessToken = await this.jwtService.signAsync(payload);

        // Send the token to Vue after successful authentication.
        return {
            success: true,
            message: 'Login successful',
            access_token: accessToken,
        };
    }
}