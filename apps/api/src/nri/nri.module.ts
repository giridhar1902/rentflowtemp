import { Module } from "@nestjs/common";
import { NriController } from "./nri.controller";
import { NriWebhookController } from "./nri-webhook.controller";
import { NriService } from "./nri.service";
import { NriCron } from "./nri.cron";

@Module({
  controllers: [NriController, NriWebhookController],
  providers: [NriService, NriCron],
})
export class NriModule {}
