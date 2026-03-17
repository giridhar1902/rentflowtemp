import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AppAuthGuard } from "./common/auth/app-auth.guard";
import { AppRolesGuard } from "./common/auth/app-roles.guard";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { ChatModule } from "./chat/chat.module";
import { DocumentsModule } from "./documents/documents.module";
import { HealthModule } from "./health/health.module";
import { LeasesModule } from "./leases/leases.module";
import { MaintenanceModule } from "./maintenance/maintenance.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PropertiesModule } from "./properties/properties.module";
import { PaymentsModule } from "./payments/payments.module";
import { UsersModule } from "./users/users.module";
import { UnitsModule } from "./units/units.module";
import { BedsModule } from "./beds/beds.module";
import { TenantsModule } from "./tenants/tenants.module";
import { UtilitiesModule } from "./utilities/utilities.module";
import { SharedModule } from "./shared/shared.module";
import { NriModule } from "./nri/nri.module";
import { WhatsappBotModule } from "./whatsapp-bot/whatsapp-bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SharedModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    LeasesModule,
    BillingModule,
    MaintenanceModule,
    ChatModule,
    NotificationsModule,
    DocumentsModule,
    PaymentsModule,
    UnitsModule,
    BedsModule,
    TenantsModule,
    UtilitiesModule,
    NriModule,
    WhatsappBotModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AppAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AppRolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: "*path", method: RequestMethod.ALL });
  }
}
