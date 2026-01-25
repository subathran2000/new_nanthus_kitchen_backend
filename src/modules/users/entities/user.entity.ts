import { Entity, Column, BeforeInsert, BeforeUpdate, Index } from "typeorm";
import * as bcrypt from "bcrypt";
import { BaseEntity } from "../../../common/entities/base.entity";
import { UserRole } from "../../../common/enums";
import { Exclude } from "class-transformer";

@Entity("users")
@Index(["email"], { unique: true })
@Index(["role"])
@Index(["isActive"])
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: "first_name" })
  firstName: string;

  @Column({ name: "last_name" })
  lastName: string;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", name: "profile_image", nullable: true })
  profileImage: string | null;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.VISITOR,
  })
  role: UserRole;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @Column({ name: "is_email_verified", default: false })
  isEmailVerified: boolean;

  @Index()
  @Column({ type: "varchar", name: "email_verification_token", nullable: true })
  @Exclude()
  emailVerificationToken: string | null;

  @Column({
    type: "timestamp",
    name: "email_verification_expires",
    nullable: true,
  })
  @Exclude()
  emailVerificationExpires: Date | null;

  @Index()
  @Column({ type: "varchar", name: "password_reset_token", nullable: true })
  @Exclude()
  passwordResetToken: string | null;

  @Column({ type: "timestamp", name: "password_reset_expires", nullable: true })
  @Exclude()
  passwordResetExpires: Date | null;

  @Index()
  @Column({ type: "varchar", name: "refresh_token", nullable: true })
  @Exclude()
  refreshToken: string | null;

  @Column({ type: "timestamp", name: "last_login_at", nullable: true })
  lastLoginAt: Date | null;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith("$2b$")) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
