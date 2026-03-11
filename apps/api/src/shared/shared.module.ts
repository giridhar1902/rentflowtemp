import { Module, Global } from "@nestjs/common";
import { WhatsappService } from "./whatsapp.service";
import { ReceiptService } from "./receipt.service";
import { CurrencyService } from "./currency.service";

@Global()
@Module({
  providers: [WhatsappService, ReceiptService, CurrencyService],
  exports: [WhatsappService, ReceiptService, CurrencyService],
})
export class SharedModule {}
