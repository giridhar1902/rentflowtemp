import { Controller, Post, Body } from "@nestjs/common";
import { Public } from "../common/auth/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsappService } from "../shared/whatsapp.service";
import { ConfigService } from "@nestjs/config";
import { NriService } from "./nri.service";

@Controller("webhooks/nri")
export class NriWebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
    private readonly nriService: NriService,
  ) {}

  @Public()
  @Post("whatsapp")
  async handleWhatsappWebhook(@Body() payload: any) {
    if (payload?.type !== "whatsapp") return { received: true };

    const messageType = payload?.data?.message?.type;
    const fromPhone = payload?.data?.message?.from;

    if (!fromPhone) {
      return { success: false, reason: "Missing phone data" };
    }

    if (messageType === "text") {
      const textRaw = payload.data.message.text?.toString() || "";
      const text = textRaw.trim().toLowerCase();

      // Find the landlord who owns this phone number
      const landlord = await this.prisma.user.findFirst({
        where: { phone: { endsWith: fromPhone.slice(-10) } },
      });

      if (!landlord) {
        return { success: false, reason: "Sender is not registered" };
      }

      let reply = "";
      if (text === "morning") {
        reply = await this.nriService.getMorningDigest(landlord.id);
      } else if (text === "income") {
        reply = await this.nriService.getIncomeBotText(landlord.id);
      } else if (text === "tds") {
        reply = await this.nriService.getTdsBotText(landlord.id);
      }

      if (reply) {
        await this.whatsappService.sendCustomMessage(fromPhone, reply);
      }
      return { success: true };
    }

    // Check if it's an image message from Interakt
    if (messageType === "image") {
      const imageInfo = payload.data.message.image;

      if (!fromPhone || !imageInfo?.url) {
        return { success: false, reason: "Missing data" };
      }

      // Format the phone number to match the DB
      const dbPhone = fromPhone.startsWith("91")
        ? `+${fromPhone}`
        : `+${fromPhone}`; // Interakt might send without plus

      // Find if this phone belongs to a LOCAL_CONTACT
      const contactUser = await this.prisma.user.findFirst({
        where: {
          phone: { endsWith: fromPhone.slice(-10) },
          role: "LOCAL_CONTACT",
        }, // Match last 10 digits
      });

      if (!contactUser) {
        return {
          success: false,
          reason: "Sender is not a recognized local contact",
        };
      }

      // Find landlords who have this phone as poaHolderPhone
      const landlords = await this.prisma.user.findMany({
        where: { poaHolderPhone: contactUser.phone },
        include: { propertiesOwned: true },
      });

      if (landlords.length === 0) {
        return { success: false, reason: "Not associated with any landlord" };
      }

      // Step: Download image from CDN
      let cdnBuffer: Buffer;
      try {
        const cdnRes = await fetch(imageInfo.url);
        cdnBuffer = Buffer.from(await cdnRes.arrayBuffer());
      } catch (e) {
        return { success: false, reason: "Failed to fetch image" };
      }

      // For MVP, if they are managing multiple properties, pick the first active one,
      // or assume we need to process it for all.
      const property = landlords[0].propertiesOwned[0];
      if (!property) return { success: false, reason: "No property found" };

      // Step: Upload to Supabase Storage
      const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
      const supabaseKey = this.configService.get<string>(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

      if (supabaseUrl && supabaseKey) {
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
        const path = `property-photos/${property.id}/${yearMonth}/${fileName}`;

        try {
          // Upload directly to supabase storage API via REST
          const blob = new Blob([cdnBuffer], { type: "image/jpeg" });
          await fetch(
            `${supabaseUrl}/storage/v1/object/public/rentmate-assets/${path}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: blob,
            },
          );

          // Also record the document in DB if needed
          await this.prisma.document.create({
            data: {
              propertyId: property.id,
              uploadedById: contactUser.id,
              storagePath: `${supabaseUrl}/storage/v1/object/public/rentmate-assets/${path}`,
              type: "OTHER",
              fileName: imageInfo.caption || "Property Photo.jpg",
              mimeType: "image/jpeg",
              sizeBytes: cdnBuffer.length,
            },
          });

          // Step: Notify NRI landlord via WhatsApp
          const cleanLandlordPhone = landlords[0].phone?.replace(/\+/g, "");
          if (cleanLandlordPhone) {
            await this.whatsappService.sendCustomMessage(
              cleanLandlordPhone,
              `📸 ${contactUser.firstName} has uploaded 1 photo of ${property.name}. View them in the app.`,
            );
          }
        } catch (e) {
          console.error("Supabase upload failed", e);
        }
      }

      return { success: true };
    }

    return { received: true };
  }
}
