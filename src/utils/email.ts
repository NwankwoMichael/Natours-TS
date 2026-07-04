import nodemailer from "nodemailer";
import pug from "pug";
import path from "path";
import { convert } from "html-to-text";

// Define a type or interface for the User parameter
interface EmailUser {
  email: string;
  name: string;
}

export default class Email {
  // Explicitly declare class property types
  public to: string;
  public firstName: string;
  public url: string;
  public from: string;

  constructor(user: EmailUser, url: string) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Michael <${process.env.EMAIL_FROM}>`;
  }

  //   CLASS INSTANCES

  // Create a transporter
  private newTransport() {
    if (process.env.NODE_ENV === "production") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      } as any);
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  public async send(template: string, subject: string): Promise<void> {
    // Render the email based on the pug template
    const templatePath = path.join(
      process.cwd(),
      "views",
      "email",
      `${template}.pug`,
    );

    const html = pug.renderFile(templatePath, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // Define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    console.log("Email recipent:", this.to);

    // Create a transport and send mail
    await this.newTransport().sendMail(mailOptions);
  }

  public async sendWelcome(): Promise<void> {
    await this.send("welcome", "welcome to Natours-ts family!");
  }

  public async sendPasswordReset(): Promise<void> {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes!",
    );
  }
}
