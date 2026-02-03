import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsString() name!: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @IsOptional() phone?: string;
  @IsString() @MinLength(6) password!: string;
}

export class NgoInfoDto {
  @IsString() name!: string; // Organization name
  @IsString() @IsOptional() subtype?: string; // e.g., 'Health NGO', 'Education NGO'
  @IsString() @IsOptional() city?: string;
  @IsArray() @IsString({ each: true }) categories!: string[]; // Working areas/categories
  @IsString() @IsOptional() contactEmail?: string;
  @IsString() @IsOptional() contactPhone?: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() registrationNumber?: string;
  @IsNumber() @IsOptional() @Min(1900) establishedYear?: number;
  @IsString() @IsOptional() website?: string;
}

export class NgoRegisterDto {
  @IsString() name!: string;
  @IsString() @MinLength(6) password!: string;
  @ValidateNested() @Type(() => NgoInfoDto) ngoInfo!: NgoInfoDto;
}

export class LoginDto {
  @IsString() identifier!: string; // email, phone, or name for ngo-user
  @IsString() @MinLength(6) password!: string;
  @IsEnum(['admin', 'ngo', 'ngo-user']) @IsOptional() userType?: 'admin' | 'ngo' | 'ngo-user';
  @IsString() @IsOptional() ngoName?: string; // Required for ngo-user login
}

export class RefreshDto {
  @IsString() refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsString() identifier!: string; // email, phone, or name
  @IsEnum(['admin', 'ngo', 'ngo-user']) userType!: 'admin' | 'ngo' | 'ngo-user';
  @IsString() @IsOptional() ngoName?: string; // Required for ngo-user
}

export class ResetPasswordDto {
  @IsString() identifier!: string;
  @IsEnum(['admin', 'ngo', 'ngo-user']) userType!: 'admin' | 'ngo' | 'ngo-user';
  @IsString() @IsOptional() ngoName?: string;
  @IsString() @MinLength(6) newPassword!: string;
  @IsString() verificationCode!: string;
}