import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { getRequestUser } from "../common/auth/request-user";
import { ListChatMessagesDto } from "./dto/list-chat-messages.dto";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("status")
  getStatus() {
    return { module: "chat", status: "ok" };
  }

  @Get("threads")
  listThreads(@Req() request: Request) {
    const user = getRequestUser(request);
    return this.chatService.listThreads(user);
  }

  @Post("threads/lease/:leaseId/ensure")
  ensureLeaseThread(
    @Req() request: Request,
    @Param("leaseId") leaseId: string,
  ) {
    const user = getRequestUser(request);
    return this.chatService.ensureLeaseThread(user, leaseId);
  }

  @Get("threads/:threadId")
  getThread(@Req() request: Request, @Param("threadId") threadId: string) {
    const user = getRequestUser(request);
    return this.chatService.getThreadById(user, threadId);
  }

  @Get("threads/:threadId/messages")
  listMessages(
    @Req() request: Request,
    @Param("threadId") threadId: string,
    @Query() query: ListChatMessagesDto,
  ) {
    const user = getRequestUser(request);
    return this.chatService.listMessages(user, threadId, query);
  }

  @Post("threads/:threadId/messages")
  sendMessage(
    @Req() request: Request,
    @Param("threadId") threadId: string,
    @Body() payload: SendChatMessageDto,
  ) {
    const user = getRequestUser(request);
    return this.chatService.sendMessage(user, threadId, payload);
  }
}
