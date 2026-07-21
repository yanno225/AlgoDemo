import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { UsersService } from './services/users.service';
import { UsersAdminController } from './users-admin.controller';

/**
 * Module Auth & Identité — socle transverse (CDC §9.3, Dev A).
 * JwtModule est déclaré `global` : le RolesGuard partagé (src/common/guards),
 * consommé par les contrôleurs des AUTRES modules (ex. Référentiel), peut
 * ainsi injecter JwtService sans que ces modules n'importent AuthModule.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        // Le typage strict de `expiresIn` (StringValue de la lib "ms") n'accepte pas un
        // `string` générique venant du ConfigService — la valeur ("15m", "7d"...) reste
        // valide à l'exécution. AuthService/RolesGuard passent de toute façon secret et
        // expiresIn explicitement à chaque sign()/verify(), ceci n'est qu'un défaut.
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [AuthController, UsersAdminController],
  providers: [AuthService, UsersService, OtpService],
  exports: [UsersService],
})
export class AuthModule {}
