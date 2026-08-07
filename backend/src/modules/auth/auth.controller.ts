import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser } from '../../common/interfaces/auth-user.interface';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { Verify2FaDto } from './dto/verify-2fa.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';

const TOUS_LES_ROLES = [Role.UTILISATEUR, Role.POINT_FOCAL, Role.ADMIN];

@ApiTags('Auth')
@Controller('auth')
@UseGuards(RolesGuard) // Sans @Roles sur la route, l'accès reste public (inscription, connexion...)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: "Inscription (public) — envoie un code de vérification email/SMS" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: "Confirme l'email avec le code OTP reçu (public)" })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Renvoie un nouveau code de vérification (public)' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Connexion (public) — retourne {deuxFaRequis:true} si la 2FA est activée et qu’aucun code n’est fourni',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renouvelle les tokens à partir du refresh token (public)' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Déconnexion — révoque le refresh token courant' })
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de l’utilisateur authentifié' })
  async me(@CurrentUser() authUser: AuthUser): Promise<UserProfileDto> {
    const user = await this.usersService.findById(authUser.id);
    return UserProfileDto.depuis(user);
  }

  @Post('2fa/enable')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Démarre l'activation de la 2FA — retourne le secret et l'URL otpauth (QR code)",
  })
  enable2Fa(@CurrentUser() user: AuthUser) {
    return this.authService.enable2Fa(user.id);
  }

  @Post('2fa/confirm')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirme et active la 2FA avec un premier code TOTP valide' })
  confirm2Fa(@CurrentUser() user: AuthUser, @Body() dto: Verify2FaDto) {
    return this.authService.confirm2Fa(user.id, dto.code);
  }

  @Post('2fa/disable')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Désactive la 2FA (nécessite un code TOTP valide)' })
  disable2Fa(@CurrentUser() user: AuthUser, @Body() dto: Verify2FaDto) {
    return this.authService.disable2Fa(user.id, dto.code);
  }

  @Patch('consent')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RGPD — met à jour le consentement notifications / acceptation politique de confidentialité',
  })
  async updateConsent(@CurrentUser() user: AuthUser, @Body() dto: UpdateConsentDto) {
    const updated = await this.authService.updateConsent(user.id, dto);
    return UserProfileDto.depuis(updated);
  }

  @Post('anonymisation')
  @Roles(...TOUS_LES_ROLES)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'RGPD — demanderAnonymisation() : anonymise le compte et révoque les sessions (irréversible)',
  })
  demanderAnonymisation(@CurrentUser() user: AuthUser) {
    return this.authService.demanderAnonymisation(user.id);
  }
}
