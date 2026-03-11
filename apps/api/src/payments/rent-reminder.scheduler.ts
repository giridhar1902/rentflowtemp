import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentsService } from "./payments.service";

@Injectable()
export class RentReminderScheduler {
  private readonly logger = new Logger(RentReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Cron("0 9 * * *") // Every day at 9:00 AM
  async sendDailyReminders() {
    this.logger.log("Running Daily Reminder Cron at 9 AM...");

    // Safety check - generate monthlies first if today is the 1st
    if (new Date().getDate() === 1) {
      await this.paymentsService.generateMonthlyPayments();
    }

    const upcomingDateLimit = new Date();
    upcomingDateLimit.setDate(upcomingDateLimit.getDate() + 3);

    const upcomingPayments = await this.prisma.payment.findMany({
      where: {
        status: "PENDING",
        reminderSentAt: null,
        dueDate: {
          lte: upcomingDateLimit,
          gte: new Date(),
        },
      },
    });

    if (upcomingPayments.length === 0) {
      this.logger.log("No upcoming payments require reminders today.");
      return;
    }

    for (const payment of upcomingPayments) {
      try {
        await this.paymentsService.sendRentReminder(payment.id);
        this.logger.log(`Sent reminder for Payment ${payment.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to send reminder for Payment ${payment.id}`,
          err,
        );
      }
    }
  }

  @Cron("0 10 * * *") // Every day at 10:00 AM
  async markOverduePayments() {
    this.logger.log("Running Overdue Marker Cron at 10 AM...");
    const result = await this.prisma.payment.updateMany({
      where: {
        status: "PENDING",
        dueDate: { lt: new Date() },
      },
      data: { status: "OVERDUE" },
    });
    this.logger.log(`Marked ${result.count} payments as OVERDUE.`);
  }
}
