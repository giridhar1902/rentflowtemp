import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RentReminderScheduler } from "./rent-reminder.scheduler";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RentReminderScheduler],
  exports: [PaymentsService],
})
export class PaymentsModule {}
