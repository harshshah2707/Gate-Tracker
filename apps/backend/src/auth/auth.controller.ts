import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'harsh@gate.com' },
        name: { type: 'string', example: 'Harsh Vardhan' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'name', 'password'],
    },
  })
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'harsh@gate.com' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  @ApiOperation({ summary: 'Authenticate with Google ID token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string', example: 'eyJhbGci...' },
      },
      required: ['token'],
    },
  })
  async googleAuth(@Body() body: any) {
    return this.authService.googleAuth({
      token: body.token,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh-token')
  @ApiOperation({ summary: 'Retrieve a fresh JWT token for current user' })
  async refreshToken(@Req() req: any) {
    return this.authService.refreshToken(req.user.userId);
  }
}
