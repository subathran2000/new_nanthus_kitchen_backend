import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASSWORD"),
      },
    });
  }

  private getFromAddress(): string {
    const fromName = this.configService.get<string>(
      "SMTP_FROM_NAME",
      "New Nanthu's Kitchen"
    );
    const fromEmail = this.configService.get<string>(
      "SMTP_FROM_EMAIL",
      "noreply@nanthuskitchen.com"
    );
    return `"${fromName}" <${fromEmail}>`;
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>(
      "FRONTEND_URL",
      "http://localhost:5173"
    );
  }

  private getRestaurantInfo() {
    return {
      name: this.configService.get<string>(
        "RESTAURANT_NAME",
        "New Nanthu's Kitchen"
      ),
      markhamAddress: this.configService.get<string>(
        "RESTAURANT_ADDRESS_MARKHAM",
        "72-30 Karachi Dr, L3S 0B6"
      ),
      scarboroughAddress: this.configService.get<string>(
        "RESTAURANT_ADDRESS_SCARBOROUGH",
        "80 Nashdene Rd, M1V 5E4"
      ),
    };
  }

  private getEmailFooter(): string {
    const restaurant = this.getRestaurantInfo();
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p style="margin: 5px 0;"><strong>${restaurant.name}</strong></p>
        <p style="margin: 5px 0;">Markham: ${restaurant.markhamAddress}</p>
        <p style="margin: 5px 0;">Scarborough: ${restaurant.scarboroughAddress}</p>
        <p style="margin: 15px 0;">
          <a href="${this.getFrontendUrl()}" style="color: #d32f2f;">Visit our website</a>
        </p>
      </div>
    `;
  }

  private getEmailTemplate(content: string): string {
    const restaurant = this.getRestaurantInfo();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${restaurant.name}</h1>
        </div>
        <div style="background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
          ${content}
          ${this.getEmailFooter()}
        </div>
      </body>
      </html>
    `;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.getFromAddress(),
        to,
        subject,
        html: this.getEmailTemplate(html),
      });
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  // Alternative method for object-based parameters (used by newsletter service)
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    return this.sendEmail(options.to, options.subject, options.html);
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string
  ): Promise<boolean> {
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    const html = `
      <h2 style="color: #d32f2f;">Welcome, ${firstName}!</h2>
      <p>Thank you for registering with New Nanthu's Kitchen Admin Portal.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `;

    return this.sendEmail(
      email,
      "Verify Your Email - New Nanthu's Kitchen",
      html
    );
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string
  ): Promise<boolean> {
    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    const html = `
      <h2 style="color: #d32f2f;">Password Reset Request</h2>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password for your New Nanthu's Kitchen Admin account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    `;

    return this.sendEmail(email, "Password Reset - New Nanthu's Kitchen", html);
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <h2 style="color: #d32f2f;">Welcome to New Nanthu's Kitchen!</h2>
      <p>Hi ${firstName},</p>
      <p>Your account has been successfully created and verified.</p>
      <p>You can now access the admin portal to manage:</p>
      <ul>
        <li>Menu items and categories</li>
        <li>Events and specials</li>
        <li>Opening hours</li>
        <li>Newsletter subscribers</li>
        <li>And more!</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${this.getFrontendUrl()}/login" 
           style="background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Go to Admin Portal
        </a>
      </div>
      <p>If you have any questions, please don't hesitate to reach out.</p>
    `;

    return this.sendEmail(email, "Welcome to New Nanthu's Kitchen Admin", html);
  }

  async sendNewsletterEmail(
    email: string,
    subject: string,
    content: string,
    unsubscribeToken: string
  ): Promise<boolean> {
    const unsubscribeUrl = `${this.configService.get<string>("BACKEND_URL")}/api/public/newsletter/unsubscribe/${unsubscribeToken}`;

    const html = `
      ${content}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>You're receiving this email because you subscribed to our newsletter.</p>
        <p><a href="${unsubscribeUrl}" style="color: #d32f2f;">Unsubscribe</a></p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log("Email service connected successfully");
      return true;
    } catch (error) {
      this.logger.error("Email service connection failed:", error);
      return false;
    }
  }
}
