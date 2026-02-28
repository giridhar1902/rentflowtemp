import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Public } from "../common/auth/public.decorator";
import { getRequestUser } from "../common/auth/request-user";
import { CreateDocumentUploadDto } from "./dto/create-document-upload.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";
import { DocumentsService } from "./documents.service";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("status")
  getStatus() {
    return { module: "documents", status: "ok" };
  }

  @Get()
  list(@Req() request: Request, @Query() query: ListDocumentsDto) {
    const user = getRequestUser(request);
    return this.documentsService.listDocuments(user, query);
  }

  @Post("uploads/sign")
  createUploadUrl(
    @Req() request: Request,
    @Body() payload: CreateDocumentUploadDto,
  ) {
    const user = getRequestUser(request);
    return this.documentsService.createUploadUrl(user, payload);
  }

  @Get(":documentId/download-url")
  createDownloadUrl(
    @Req() request: Request,
    @Param("documentId") documentId: string,
  ) {
    const user = getRequestUser(request);
    return this.documentsService.createDownloadUrl(user, documentId);
  }

  @Public()
  @Put("upload/:token")
  uploadWithSignedToken(
    @Param("token") token: string,
    @Req() request: Request,
  ) {
    if (!Buffer.isBuffer(request.body)) {
      throw new BadRequestException(
        "Upload endpoint expects a raw binary body",
      );
    }

    const contentType =
      typeof request.headers["content-type"] === "string"
        ? request.headers["content-type"]
        : undefined;

    return this.documentsService.uploadWithSignedToken(
      token,
      request.body,
      contentType,
    );
  }

  @Public()
  @Get("download/:token")
  async downloadWithSignedToken(
    @Param("token") token: string,
    @Res() response: Response,
  ) {
    await this.documentsService.downloadWithSignedToken(token, response);
  }
}
