import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsappService } from "../shared/whatsapp.service";
import { NriService } from "./nri.service";

@Injectable()
export class NriCron {
  private readonly logger = new Logger(NriCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly nriService: NriService,
  ) {}

  @Cron("0 * * * *") // Runs every hour to check user timezones!
  async sendDailyMorningDigest() {
    this.logger.log(
      "Checking for landlords who need their 8 AM morning digest...",
    );
    const nowUtc = new Date();

    // In a real implementation we would convert the current UTC hour to the landlord's timezone
    // to see if it's exactly 8 AM there. For MVP, assuming they roughly fall into typical NRI bands
    // Or just run it once at 9 AM IST. The prompt says "8am landlord's timezone".

    const landlords = await this.prisma.user.findMany({
      where: { role: "LANDLORD", isActive: true, isNRI: true },
    });

    for (const landlord of landlords) {
      if (!landlord.phone) continue;

      // Simplistic check: If it's roughly 8 AM in their requested timezone
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: landlord.timezone || "Asia/Kolkata",
      });

      const localHour = parseInt(formatter.format(nowUtc), 10);

      // If it's 8 AM (24 hour format '8'), trigger the digest
      if (localHour === 8) {
        try {
          const text = await this.nriService.getMorningDigest(landlord.id);
          const cleanPhone = landlord.phone.replace(/\+/g, "");
          if (text) {
            await this.whatsappService.sendCustomMessage(cleanPhone, text);
            this.logger.log(
              `Dispatched 8 AM morning digest to ${landlord.firstName}`,
            );
          }
        } catch (e) {
          this.logger.error("Failed to send morning digest", e);
        }
      }
    }
  }

  @Cron("0 10 1 * *")
  async requestPropertyPhotos() {
    this.logger.log("Running monthly photo request for NRI properties...");

    const localContacts = await this.prisma.user.findMany({
      where: { role: "LOCAL_CONTACT", isActive: true },
    });

    for (const contact of localContacts) {
      if (!contact.phone) continue;

      const landlords = await this.prisma.user.findMany({
        where: { poaHolderPhone: contact.phone },
        include: { propertiesOwned: true },
      });

      for (const landlord of landlords) {
        for (const property of landlord.propertiesOwned) {
          try {
            const cleanPhone = contact.phone.replace(/\+/g, "");
            await this.whatsappService.sendCustomMessage(
              cleanPhone,
              `Please take 5 photos of ${property.name} and reply with them here.\n${landlord.firstName || "The landlord"} will be notified once received.`,
            );
          } catch (e) {
            this.logger.error(
              `Failed to send photo request for ${property.name}`,
              e,
            );
          }
        }
      }
    }
  }

  @Cron("0 9 5 * *")
  async sendTdsDepositReminder() {
    this.logger.log("Sending TDS deposit reminders...");

    const activeLeases = await this.prisma.lease.findMany({
      where: { hasTdsObligation: true, status: "ACTIVE" },
      include: { tenant: true, landlord: true },
    });

    for (const lease of activeLeases) {
      if (!lease.tenant.phone) continue;
      const amount = (Number(lease.monthlyRent) * lease.tdsRate).toFixed(0);
      const cleanPhone = lease.tenant.phone.replace(/\+/g, "");

      const message = `⚠️ TDS Reminder — Action Required\n\nYou have 2 days to deposit TDS for rent paid to ${lease.landlord.firstName || "your landlord"}.\n\nTDS amount: ₹${amount}\nDeadline: 7th of this month\n\nDeposit at: https://onlineservices.tin.egov-nsdl.com\nChallan: ITNS 281\n\nOnce deposited, reply "tds done" to confirm.`;

      try {
        await this.whatsappService.sendCustomMessage(cleanPhone, message);
      } catch (e) {
        this.logger.error("Failed to send TDS reminder", e);
      }
    }
  }

  @Cron("0 9 7 * *")
  async sendTdsDeadlineAlert() {
    this.logger.log("Sending TDS deadline alerts...");

    const activeLeases = await this.prisma.lease.findMany({
      where: { hasTdsObligation: true, status: "ACTIVE" },
      include: { tenant: true },
    });

    for (const lease of activeLeases) {
      if (!lease.tenant.phone) continue;

      const cleanPhone = lease.tenant.phone.replace(/\+/g, "");
      const message = `🚨 Urgent: Today is the TDS deposit deadline for your rent payment. Please ensure Form 26QC/ITNS 281 is filed today to avoid penalties.`;

      try {
        await this.whatsappService.sendCustomMessage(cleanPhone, message);
      } catch (e) {
        this.logger.error("Failed to send TDS deadline alert", e);
      }
    }
  }

  @Cron("0 9 1 1,4,7,10 *")
  async sendForm27QReminder() {
    this.logger.log("Sending Form 27Q filing reminders...");

    const activeLeases = await this.prisma.lease.findMany({
      where: { hasTdsObligation: true, status: "ACTIVE" },
      include: { tenant: true },
    });

    for (const lease of activeLeases) {
      if (!lease.tenant.phone) continue;

      const cleanPhone = lease.tenant.phone.replace(/\+/g, "");
      const message = `📊 Quarterly TDS Update: Form 27Q filing is due this month for your NRI landlord. Please ensure your CA files the return by the 31st to issue Form 16A.`;

      try {
        await this.whatsappService.sendCustomMessage(cleanPhone, message);
      } catch (e) {
        this.logger.error("Failed to send Form 27Q reminder", e);
      }
    }
  }
}
