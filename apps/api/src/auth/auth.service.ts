import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.schema';
import { Org } from '../orgs/orgs.schema';
import { NgoUser } from '../ngo-users/ngo-user.schema';
import { NgoUsersService } from '../ngo-users/ngo-users.service';
import { NgoRegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto';

// Simple in-memory store for verification codes (in production, use Redis or DB)
const verificationCodes = new Map<string, { code: string; expires: Date }>();

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private users: Model<User>,
    @InjectModel(Org.name) private orgs: Model<Org>,
    private ngoUsersService: NgoUsersService,
    private jwt: JwtService,
  ) {}

  async register({ name, email, phone, password }: { name: string; email?: string; phone?: string; password: string }) {
    if (!email && !phone) throw new BadRequestException('email or phone required');
    const existing = await this.users.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) throw new BadRequestException('User already exists');
    const passwordHash = await argon2.hash(password);
    const u = await this.users.create({ name, email, phone, passwordHash, roles: ['admin'] });
    const tokens = this.signPair(String(u._id), u.roles);
    return { user: this.publicUser(u), ...tokens };
  }

  async registerNgoUser(dto: {
    ngoName: string;
    name: string;
    position: string;
    mobileNo: string;
    password: string;
  }) {
    // Check if NGO user already exists
    const existingUser = await this.ngoUsersService.findByCredentials(dto.ngoName, dto.name);
    if (existingUser) {
      throw new BadRequestException('NGO user already exists with this NGO name and name');
    }

    // Create NGO user
    const ngoUser = await this.ngoUsersService.create(dto);
    const tokens = this.signPair(String(ngoUser.id), ['ngo-user']);

    return {
      user: this.publicNgoUserFromSchema(ngoUser),
      ...tokens,
    };
  }

  async registerNgo(dto: NgoRegisterDto) {
    // Check if NGO already exists with same name or email/phone
    const existingNgo = await this.orgs.findOne({
      $or: [
        { name: dto.ngoInfo.name, type: 'NGO' },
        { contactEmail: dto.ngoInfo.contactEmail },
        { contactPhone: dto.ngoInfo.contactPhone }
      ]
    });
    if (existingNgo) {
      throw new BadRequestException('NGO already registered with this name, email, or phone');
    }

    // Create NGO organization only (no user record)
    const passwordHash = await argon2.hash(dto.password);
    const orgData = {
      name: dto.ngoInfo.name,
      type: 'NGO' as const,
      subtype: dto.ngoInfo.subtype,
      city: dto.ngoInfo.city,
      categories: dto.ngoInfo.categories,
      contactPersonName: dto.name,
      contactEmail: dto.ngoInfo.contactEmail,
      contactPhone: dto.ngoInfo.contactPhone,
      address: dto.ngoInfo.address,
      registrationNumber: dto.ngoInfo.registrationNumber,
      establishedYear: dto.ngoInfo.establishedYear,
      website: dto.ngoInfo.website,
      passwordHash: passwordHash,
      isVerified: false, // NGO needs admin verification
      roles: ['ngo'],
    };
    
    const org = await this.orgs.create(orgData);

    return {
      message: 'NGO registration successful. Please wait for admin verification.',
      org: this.publicOrg(org),
    };
  }

  async login(identifier: string, password: string, userType?: 'admin' | 'ngo' | 'ngo-user', ngoName?: string) {
    if (userType === 'ngo-user') {
      // For NGO user login, find by ngoName and name
      if (!ngoName) {
        throw new BadRequestException('NGO name is required for NGO user login');
      }
      
      const ngoUser = await this.ngoUsersService.findByCredentials(ngoName, identifier);
      if (!ngoUser || !(await this.ngoUsersService.validatePassword(password, ngoUser.password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = this.signPair(String(ngoUser.id), ['ngo-user']);
      return {
        user: this.publicNgoUserFromSchema(ngoUser),
        ...tokens,
      };
    } else if (userType === 'ngo') {
      // For NGO login, find in org collection
      const ngoOrg = await this.orgs.findOne({
        type: 'NGO',
        $or: [
          { contactEmail: identifier },
          { contactPhone: identifier }
        ]
      });

      if (!ngoOrg || !ngoOrg.passwordHash || !(await argon2.verify(ngoOrg.passwordHash, password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if NGO is verified
      if (!ngoOrg.isVerified) {
        throw new UnauthorizedException('Your NGO account is not yet verified by admin. Please wait for verification.');
      }

      const tokens = this.signPair(String(ngoOrg._id), ngoOrg.roles || ['ngo']);
      return {
        user: this.publicNgoUser(ngoOrg),
        org: this.publicOrg(ngoOrg),
        ...tokens,
      };
    } else {
      // For admin login, search in users collection
      const user = await this.users.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
        roles: { $ne: 'ngo' }, // Exclude NGO users from admin login
      });

      if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = this.signPair(String(user._id), user.roles);
      return { user: this.publicUser(user), ...tokens };
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, { secret: process.env.JWT_SECRET });
      if (payload.typ !== 'refresh') throw new UnauthorizedException();
      const tokens = this.signPair(payload.sub, payload.roles || []);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getAvailableNgos() {
    return this.ngoUsersService.getAvailableNgos();
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { identifier, userType, ngoName } = dto;
    let userExists = false;
    let codeKey = '';

    if (userType === 'ngo-user') {
      if (!ngoName) {
        throw new BadRequestException('NGO name is required for NGO user');
      }
      const ngoUser = await this.ngoUsersService.findByCredentials(ngoName, identifier);
      if (ngoUser) {
        userExists = true;
        codeKey = `ngo-user:${ngoName}:${identifier}`;
      }
    } else if (userType === 'ngo') {
      const ngoOrg = await this.orgs.findOne({
        type: 'NGO',
        $or: [{ contactEmail: identifier }, { contactPhone: identifier }]
      });
      if (ngoOrg) {
        userExists = true;
        codeKey = `ngo:${identifier}`;
      }
    } else {
      const user = await this.users.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
      });
      if (user) {
        userExists = true;
        codeKey = `admin:${identifier}`;
      }
    }

    if (!userExists) {
      throw new BadRequestException('User not found with the provided credentials');
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    verificationCodes.set(codeKey, { code, expires });

    // In production, send this code via email/SMS
    // For now, return it in the response (for development/testing)
    console.log(`Verification code for ${codeKey}: ${code}`);

    return {
      message: 'Verification code generated. In production, this would be sent via email/SMS.',
      // Remove this in production - only for development testing
      verificationCode: code,
      expiresIn: '10 minutes'
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { identifier, userType, ngoName, newPassword, verificationCode } = dto;
    let codeKey = '';

    if (userType === 'ngo-user') {
      if (!ngoName) {
        throw new BadRequestException('NGO name is required for NGO user');
      }
      codeKey = `ngo-user:${ngoName}:${identifier}`;
    } else if (userType === 'ngo') {
      codeKey = `ngo:${identifier}`;
    } else {
      codeKey = `admin:${identifier}`;
    }

    const storedCode = verificationCodes.get(codeKey);

    if (!storedCode) {
      throw new BadRequestException('No verification code found. Please request a new one.');
    }

    if (new Date() > storedCode.expires) {
      verificationCodes.delete(codeKey);
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (storedCode.code !== verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    // Reset the password based on user type
    if (userType === 'ngo-user') {
      const ngoUser = await this.ngoUsersService.findByCredentials(ngoName!, identifier);
      if (!ngoUser) {
        throw new BadRequestException('User not found');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.ngoUsersService.updatePassword(String(ngoUser.id), hashedPassword);
    } else if (userType === 'ngo') {
      const ngoOrg = await this.orgs.findOne({
        type: 'NGO',
        $or: [{ contactEmail: identifier }, { contactPhone: identifier }]
      });
      if (!ngoOrg) {
        throw new BadRequestException('NGO not found');
      }
      const passwordHash = await argon2.hash(newPassword);
      await this.orgs.findByIdAndUpdate(ngoOrg._id, { passwordHash });
    } else {
      const user = await this.users.findOne({
        $or: [{ email: identifier }, { phone: identifier }]
      });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      const passwordHash = await argon2.hash(newPassword);
      await this.users.findByIdAndUpdate(user._id, { passwordHash });
    }

    // Clear the verification code
    verificationCodes.delete(codeKey);

    return { message: 'Password reset successfully' };
  }

  private signPair(sub: string, roles: string[]) {
    const accessToken = this.jwt.sign(
      { sub, roles, typ: 'access' },
      { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub, roles, typ: 'refresh' },
      { expiresIn: process.env.REFRESH_TOKEN_TTL || '7d' },
    );
    return { accessToken, refreshToken };
  }

  private publicUser(u: any) {
    return { id: String(u._id), name: u.name, email: u.email, phone: u.phone, roles: u.roles };
  }

  private publicNgoUser(org: any) {
    return {
      id: String(org._id),
      name: org.contactPersonName || org.name,
      email: org.contactEmail,
      phone: org.contactPhone,
      roles: org.roles || ['ngo'],
      isVerified: org.isVerified || false,
      userType: 'ngo'
    };
  }

  private publicNgoUserFromSchema(ngoUser: any) {
    return {
      id: String(ngoUser.id || ngoUser._id),
      name: ngoUser.name,
      ngoName: ngoUser.ngoName,
      position: ngoUser.position,
      mobileNo: ngoUser.mobileNo,
      roles: ['ngo-user'],
      userType: 'ngo-user'
    };
  }

  private publicOrg(org: any) {
    return {
      id: String(org._id),
      name: org.name,
      type: org.type,
      subtype: org.subtype,
      city: org.city,
      categories: org.categories,
      contactPersonName: org.contactPersonName,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      address: org.address,
      registrationNumber: org.registrationNumber,
      establishedYear: org.establishedYear,
      website: org.website,
      isVerified: org.isVerified,
    };
  }
}