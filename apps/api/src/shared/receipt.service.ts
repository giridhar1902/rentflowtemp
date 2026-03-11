import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL") || "";
    const supabaseKey =
      this.configService.get<string>("SUPABASE_SERVICE_ROLE_KEY") || "";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async generateReceipt(
    paymentId: string,
    landlordName: string,
    propertyAddress: string,
    tenantName: string,
    tenantPhone: string,
    amount: number,
    monthYear: string,
    paymentMethod: string,
    receiptDate: Date,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { height } = page.getSize();
    let currentY = height - 50;

    const drawText = (
      text: string,
      x: number,
      f = font,
      size = 12,
      color = rgb(0, 0, 0),
    ) => {
      page.drawText(text, { x, y: currentY, size, font: f, color });
      currentY -= size + 8;
    };

    const drawLine = () => {
      page.drawLine({
        start: { x: 50, y: currentY },
        end: { x: 550, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 15;
    };

    // Header
    currentY -= 10;
    drawText("RENTMATE", 50, boldFont, 18);
    currentY += 20;
    drawText("RECEIPT", 450, boldFont, 18);
    currentY -= 10;
    drawLine();

    // Meta details
    drawText(`Receipt No: REC-${paymentId.slice(-8).toUpperCase()}`, 50);
    drawText(
      `Date: ${receiptDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      50,
    );
    currentY -= 15;

    // Landlord
    drawText("FROM (Landlord):", 50, boldFont, 11);
    drawText(landlordName || "RentMate Landlord", 50, font, 11);
    drawText(propertyAddress || "N/A", 50, font, 11);
    currentY -= 10;

    // Tenant
    drawText("TO (Tenant):", 50, boldFont, 11);
    drawText(tenantName || "Tenant", 50, font, 11);
    drawText(`+91 ${tenantPhone.replace("+91", "")}`, 50, font, 11);
    currentY -= 15;
    drawLine();

    // Line items
    drawText("Description", 50, boldFont, 11);
    currentY += 19;
    drawText("Amount", 450, boldFont, 11);

    drawText(`Rent — ${monthYear}`, 50, font, 11);
    currentY += 19;
    drawText(`INR ${amount.toLocaleString()}`, 450, font, 11);
    currentY -= 10;
    drawLine();

    // Summary
    drawText("TOTAL PAID", 50, boldFont, 11);
    currentY += 19;
    drawText(`INR ${amount.toLocaleString()}`, 450, boldFont, 11);

    drawText(`Payment Method: ${paymentMethod}`, 50, font, 11);

    currentY = 50;
    drawLine();
    drawText(
      "This is a computer-generated receipt.",
      50,
      font,
      9,
      rgb(0.5, 0.5, 0.5),
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async uploadReceiptToSupabase(
    pdfBuffer: Buffer,
    paymentId: string,
  ): Promise<string> {
    const fileName = `${paymentId}.pdf`;

    const { error } = await this.supabase.storage
      .from("receipts")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload receipt ${fileName}`, error);
      throw new Error("Receipt storage upload failed.");
    }

    const { data } = this.supabase.storage
      .from("receipts")
      .getPublicUrl(fileName);

    return data.publicUrl;
  }
}
