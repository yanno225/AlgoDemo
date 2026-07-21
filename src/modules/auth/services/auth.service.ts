import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { Role } from '../../../common/enums/role.enum';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { UpdateConsentDto } from '../dto/update-consent.dto';
import { User } from '../entities/user.entity';
import { OtpService } from './otp.service';
import { UsersService } from './users.service';

const BCRYPT_ROUNDS = 10;

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existant = await this.usersService.findByEmail(dto.email);
    if (existant) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const motDePasseHash = await bcrypt.hash(dto.motDePasse, BCRYPT_ROUNDS);
    const { codeHash, expireLe } = await this.otpService.genererEtEnvoyer(dto.email);

    await this.usersService.creer({
      email: dto.email,
      motDePasseHash,
      nom: dto.nom,
      prenom: dto.prenom,
      telephone: dto.telephone,
      role: Role.UTILISATEUR,
      otpCodeHash: codeHash,
      otpExpireLe: expireLe,
    });

    return {
      message:
        "Inscription réussie : un code de vérification a été envoyé pour confirmer l'email",
    };
  }

  async verifyEmail(email: string, code: string): Promise<{ message: string }> {
    const user = await this.trouverParEmailOuEchouer(email);
    const valide = await this.otpService.verifier(code, user.otpCodeHash, user.otpExpireLe);
    if (!valide) {
      throw new UnauthorizedException('Code de vérification invalide ou expiré');
    }
    user.emailVerifie = true;
    user.otpCodeHash = null;
    user.otpExpireLe = null;
    await this.usersService.save(user);
    return { message: 'Email vérifié avec succès' };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    // Réponse identique que le compte existe ou non : évite l'énumération d'emails
    if (user && !user.emailVerifie) {
      const { codeHash, expireLe } = await this.otpService.genererEtEnvoyer(email);
      user.otpCodeHash = codeHash;
      user.otpExpireLe = expireLe;
      await this.usersService.save(user);
    }
    return { message: 'Si le compte existe, un nouveau code a été envoyé' };
  }

  async login(dto: LoginDto): Promise<TokensDto | { deuxFaRequis: true }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.motDePasse, user.motDePasseHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    if (user.anonymise || user.estBloque) {
      throw new ForbiddenException('Ce compte est bloqué');
    }
    if (!user.emailVerifie) {
      throw new ForbiddenException("L'email doit être vérifié avant connexion");
    }
    if (!user.compteValide) {
      throw new ForbiddenException("Ce compte est en attente de validation par un administrateur");
    }

    if (user.deuxFaActif) {
      if (!dto.codeOtp) {
        return { deuxFaRequis: true };
      }
      if (!authenticator.check(dto.codeOtp, user.deuxFaSecret ?? '')) {
        throw new UnauthorizedException('Code 2FA invalide');
      }
    }

    return this.emettreTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Token invalide');
    }

    const user = await this.usersService.findById(payload.sub);
    if (
      !user.refreshTokenHash ||
      user.estBloque ||
      user.anonymise ||
      !(await bcrypt.compare(refreshToken, user.refreshTokenHash))
    ) {
      throw new UnauthorizedException('Refresh token invalide ou révoqué');
    }

    return this.emettreTokens(user);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    user.refreshTokenHash = null;
    await this.usersService.save(user);
  }

  async enable2Fa(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.usersService.findById(userId);
    const secret = authenticator.generateSecret();
    user.deuxFaSecret = secret;
    user.deuxFaActif = false; // n'est actif qu'après confirmation via confirm2Fa
    await this.usersService.save(user);
    return {
      secret,
      otpauthUrl: authenticator.keyuri(user.email, 'AlgoDémo', secret),
    };
  }

  async confirm2Fa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user.deuxFaSecret || !authenticator.check(code, user.deuxFaSecret)) {
      throw new UnauthorizedException('Code 2FA invalide');
    }
    user.deuxFaActif = true;
    await this.usersService.save(user);
    return { message: 'Authentification à deux facteurs activée' };
  }

  async disable2Fa(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user.deuxFaSecret || !authenticator.check(code, user.deuxFaSecret)) {
      throw new UnauthorizedException('Code 2FA invalide');
    }
    user.deuxFaActif = false;
    user.deuxFaSecret = null;
    await this.usersService.save(user);
    return { message: 'Authentification à deux facteurs désactivée' };
  }

  async updateConsent(userId: string, dto: UpdateConsentDto): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (dto.consentementNotifications !== undefined) {
      user.consentementNotifications = dto.consentementNotifications;
    }
    if (dto.politiqueConfidentialiteAcceptee) {
      user.politiqueConfidentialiteAccepteeLe = new Date();
    }
    return this.usersService.save(user);
  }

  /** RGPD — demanderAnonymisation() (§9.3, zones à risque) : anonymisation immédiate + révocation */
  async demanderAnonymisation(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    user.email = `anonyme-${user.id}@algodemo.invalid`;
    user.nom = 'Anonyme';
    user.prenom = 'Anonyme';
    user.telephone = null;
    user.motDePasseHash = await bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS);
    user.refreshTokenHash = null;
    user.deuxFaActif = false;
    user.deuxFaSecret = null;
    user.anonymise = true;
    user.estBloque = true;
    await this.usersService.save(user);
    return { message: 'Compte anonymisé' };
  }

  private async emettreTokens(user: User): Promise<TokensDto> {
    // Cast sur `expiresIn` : voir le commentaire dans auth.module.ts (typage StringValue de "ms")
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      } as JwtSignOptions,
    );
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      } as JwtSignOptions,
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.save(user);

    return { accessToken, refreshToken };
  }

  private async trouverParEmailOuEchouer(email: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Compte introuvable');
    }
    return user;
  }
}
