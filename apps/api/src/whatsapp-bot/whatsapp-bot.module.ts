import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WhatsappBotController } from "./whatsapp-bot.controller";
import { WhatsappBotService } from "./whatsapp-bot.service";
import { IntentClassifierService } from "./agent/intent-classifier.service";
import { ToolExecutorService } from "./agent/tool-executor.service";
import { LandlordContextService } from "./context/landlord-context.service";
import { ConversationMemoryService } from "./memory/conversation-memory.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SharedModule } from "../shared/shared.module";

@Module({
  imports: [ConfigModule, PrismaModule, SharedModule],
  controllers: [WhatsappBotController],
  providers: [
    WhatsappBotService,
    IntentClassifierService,
    ToolExecutorService,
    LandlordContextService,
    ConversationMemoryService,
  ],
})
export class WhatsappBotModule {}
