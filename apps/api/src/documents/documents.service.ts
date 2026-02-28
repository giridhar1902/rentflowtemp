import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { LeaseStatus, Prisma, UserRole } from "@prisma/client";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { Response } from "express";
import { RequestUser } from "../common/auth/request-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDocumentUploadDto } from "./dto/create-document-upload.dto";
import { ListDocumentsDto } from "./dto/list-documents.dto";

type SignedTokenAction = "upload" | "download";

type SignedTokenPayload = {
  action: SignedTokenAction;
  documentId: string;
  exp: number;
  nonce: string;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDocuments(user: RequestUser, query: ListDocumentsDto) {
    const where: Prisma.DocumentWhereInput = {
      ...this.buildDocumentAccessWhere(user),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.leaseId ? { leaseId: query.leaseId } : {}),
      ...(query.maintenanceRequestId
        ? { maintenanceRequestId: query.maintenanceRequestId }
        : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    return this.prisma.document.findMany({
      where,
      include: documentInclude,
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 100,
    });
  }

  async createUploadUrl(user: RequestUser, payload: CreateDocumentUploadDto) {
    const fileName = sanitizeFileName(payload.fileName);
    if (!this.isAllowedMimeType(payload.mimeType)) {
      throw new BadRequestException("Unsupported mimeType for document upload");
    }
    if (payload.sizeBytes > this.getMaxUploadBytes()) {
      throw new BadRequestException("File exceeds configured size limit");
    }

    const relation = await this.resolveAndValidateDocumentRelation(
      user,
      payload,
    );

    const created = await this.prisma.document.create({
      data: {
        uploadedById: user.id,
        propertyId: relation.propertyId,
        leaseId: relation.leaseId,
        maintenanceRequestId: relation.maintenanceRequestId,
        type: payload.type,
        storagePath: this.buildStoragePath(fileName),
        fileName,
        mimeType: payload.mimeType.trim().toLowerCase(),
        sizeBytes: payload.sizeBytes,
      },
      include: documentInclude,
    });

    const expiresAt = new Date(Date.now() + this.getUploadTokenTtlMs());
    const token = this.signToken({
      action: "upload",
      documentId: created.id,
      exp: expiresAt.getTime(),
      nonce: randomBytes(8).toString("hex"),
    });

    return {
      document: created,
      uploadUrl: `${this.getApiPublicBaseUrl()}/v1/documents/upload/${token}`,
      expiresAt: expiresAt.toISOString(),
      maxBytes: this.getMaxUploadBytes(),
    };
  }

  async createDownloadUrl(user: RequestUser, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: documentInclude,
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    this.assertCanAccessDocument(user, document);

    const expiresAt = new Date(Date.now() + this.getDownloadTokenTtlMs());
    const token = this.signToken({
      action: "download",
      documentId,
      exp: expiresAt.getTime(),
      nonce: randomBytes(8).toString("hex"),
    });

    return {
      documentId,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      downloadUrl: `${this.getApiPublicBaseUrl()}/v1/documents/download/${token}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async uploadWithSignedToken(
    token: string,
    binaryBody: Buffer,
    contentTypeHeader: string | undefined,
  ) {
    const payload = this.verifySignedToken(token, "upload");

    const document = await this.prisma.document.findUnique({
      where: { id: payload.documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found for upload");
    }

    if (!Buffer.isBuffer(binaryBody) || binaryBody.length === 0) {
      throw new BadRequestException(
        "Upload body must be non-empty binary data",
      );
    }

    if (binaryBody.length > this.getMaxUploadBytes()) {
      throw new BadRequestException(
        "Uploaded body exceeds configured size limit",
      );
    }

    if (binaryBody.length > document.sizeBytes) {
      throw new BadRequestException(
        "Uploaded file is larger than the pre-signed size",
      );
    }

    const contentType = (contentTypeHeader ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (contentType && contentType !== document.mimeType.toLowerCase()) {
      throw new BadRequestException(
        "Uploaded content-type does not match pre-signed document mimeType",
      );
    }

    const absolutePath = this.resolveAbsoluteStoragePath(document.storagePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });

    try {
      await fs.writeFile(absolutePath, binaryBody, { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new BadRequestException(
          "Signed upload URL has already been used",
        );
      }
      throw error;
    }

    if (binaryBody.length !== document.sizeBytes) {
      await this.prisma.document.update({
        where: { id: document.id },
        data: {
          sizeBytes: binaryBody.length,
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: document.uploadedById,
        entityType: "DOCUMENT",
        entityId: document.id,
        action: "DOCUMENT_UPLOADED",
        metadata: {
          sizeBytes: binaryBody.length,
          mimeType: document.mimeType,
        },
      },
    });

    return {
      uploaded: true,
      documentId: document.id,
      sizeBytes: binaryBody.length,
    };
  }

  async downloadWithSignedToken(token: string, response: Response) {
    const payload = this.verifySignedToken(token, "download");

    const document = await this.prisma.document.findUnique({
      where: { id: payload.documentId },
    });

    if (!document) {
      throw new NotFoundException("Document not found");
    }

    const absolutePath = this.resolveAbsoluteStoragePath(document.storagePath);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new NotFoundException("Document file is not available");
      }
      throw error;
    }

    response.setHeader("Content-Type", document.mimeType);
    response.setHeader("Content-Length", String(fileBuffer.byteLength));
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${escapeHeaderValue(document.fileName)}"`,
    );
    response.send(fileBuffer);
  }

  private async resolveAndValidateDocumentRelation(
    user: RequestUser,
    payload: CreateDocumentUploadDto,
  ) {
    let propertyId = payload.propertyId;
    let leaseId = payload.leaseId;
    let maintenanceRequestId = payload.maintenanceRequestId;

    if (maintenanceRequestId) {
      const request = await this.prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceRequestId },
        select: {
          id: true,
          propertyId: true,
          leaseId: true,
          requesterId: true,
          property: {
            select: {
              ownerId: true,
            },
          },
          lease: {
            select: {
              tenantId: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException("Maintenance request not found");
      }

      if (
        user.role !== UserRole.ADMIN &&
        request.property.ownerId !== user.id &&
        request.requesterId !== user.id &&
        request.lease?.tenantId !== user.id
      ) {
        throw new ForbiddenException(
          "You cannot upload documents for this maintenance request",
        );
      }

      propertyId = request.propertyId;
      leaseId = request.leaseId ?? leaseId;
      maintenanceRequestId = request.id;
    }

    if (leaseId) {
      const lease = await this.prisma.lease.findUnique({
        where: { id: leaseId },
        select: {
          id: true,
          propertyId: true,
          landlordId: true,
          tenantId: true,
        },
      });

      if (!lease) {
        throw new NotFoundException("Lease not found");
      }

      if (
        user.role !== UserRole.ADMIN &&
        lease.landlordId !== user.id &&
        lease.tenantId !== user.id
      ) {
        throw new ForbiddenException(
          "You cannot upload documents for this lease",
        );
      }

      propertyId = lease.propertyId;
      leaseId = lease.id;
    }

    if (propertyId) {
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          ownerId: true,
          leases: {
            where: {
              status: {
                in: [
                  LeaseStatus.DRAFT,
                  LeaseStatus.ACTIVE,
                  LeaseStatus.EXPIRED,
                ],
              },
              tenantId: user.id,
            },
            select: {
              id: true,
            },
            take: 1,
          },
        },
      });

      if (!property) {
        throw new NotFoundException("Property not found");
      }

      if (user.role === UserRole.ADMIN) {
        return { propertyId, leaseId, maintenanceRequestId };
      }

      if (user.role === UserRole.LANDLORD && property.ownerId === user.id) {
        return { propertyId, leaseId, maintenanceRequestId };
      }

      if (user.role === UserRole.TENANT && property.leases.length > 0) {
        return { propertyId, leaseId, maintenanceRequestId };
      }

      throw new ForbiddenException(
        "You do not have access to upload documents for this property",
      );
    }

    return {
      propertyId,
      leaseId,
      maintenanceRequestId,
    };
  }

  private assertCanAccessDocument(
    user: RequestUser,
    document: {
      uploadedById: string;
      property: { ownerId: string; leases: Array<{ tenantId: string }> } | null;
      lease: { landlordId: string; tenantId: string } | null;
      maintenanceRequest: {
        requesterId: string;
        property: { ownerId: string };
        lease: { tenantId: string } | null;
      } | null;
    },
  ) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    if (document.uploadedById === user.id) {
      return;
    }

    if (
      user.role === UserRole.LANDLORD &&
      (document.property?.ownerId === user.id ||
        document.lease?.landlordId === user.id ||
        document.maintenanceRequest?.property.ownerId === user.id)
    ) {
      return;
    }

    if (
      user.role === UserRole.TENANT &&
      (document.lease?.tenantId === user.id ||
        document.maintenanceRequest?.requesterId === user.id ||
        document.maintenanceRequest?.lease?.tenantId === user.id ||
        document.property?.leases.some((lease) => lease.tenantId === user.id))
    ) {
      return;
    }

    throw new ForbiddenException("You do not have access to this document");
  }

  private buildDocumentAccessWhere(
    user: RequestUser,
  ): Prisma.DocumentWhereInput {
    if (user.role === UserRole.ADMIN) {
      return {};
    }

    if (user.role === UserRole.LANDLORD) {
      return {
        OR: [
          { uploadedById: user.id },
          { property: { ownerId: user.id } },
          { lease: { landlordId: user.id } },
          { maintenanceRequest: { property: { ownerId: user.id } } },
        ],
      };
    }

    return {
      OR: [
        { uploadedById: user.id },
        { lease: { tenantId: user.id } },
        { maintenanceRequest: { requesterId: user.id } },
        { maintenanceRequest: { lease: { tenantId: user.id } } },
        {
          property: {
            leases: {
              some: {
                tenantId: user.id,
                status: {
                  in: [
                    LeaseStatus.DRAFT,
                    LeaseStatus.ACTIVE,
                    LeaseStatus.EXPIRED,
                  ],
                },
              },
            },
          },
        },
      ],
    };
  }

  private resolveAbsoluteStoragePath(storagePath: string) {
    const root = this.getStorageRoot();
    const absolutePath = path.resolve(root, storagePath);

    if (
      absolutePath !== root &&
      !absolutePath.startsWith(`${root}${path.sep}`)
    ) {
      throw new UnauthorizedException("Invalid document storage path");
    }

    return absolutePath;
  }

  private buildStoragePath(fileName: string) {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const nonce = randomBytes(6).toString("hex");
    return `${year}/${month}/${Date.now()}-${nonce}-${fileName}`;
  }

  private signToken(payload: SignedTokenPayload) {
    const serialized = Buffer.from(JSON.stringify(payload)).toString(
      "base64url",
    );
    const signature = createHmac("sha256", this.getSigningSecret())
      .update(serialized)
      .digest("base64url");
    return `${serialized}.${signature}`;
  }

  private verifySignedToken(token: string, expectedAction: SignedTokenAction) {
    const [serialized, signature] = token.split(".");

    if (!serialized || !signature) {
      throw new UnauthorizedException("Signed URL token is malformed");
    }

    const expectedSignature = createHmac("sha256", this.getSigningSecret())
      .update(serialized)
      .digest("base64url");

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (providedBuffer.length !== expectedBuffer.length) {
      throw new UnauthorizedException("Signed URL signature is invalid");
    }

    const valid = timingSafeEqual(providedBuffer, expectedBuffer);

    if (!valid) {
      throw new UnauthorizedException("Signed URL signature is invalid");
    }

    let payload: SignedTokenPayload;
    try {
      payload = JSON.parse(
        Buffer.from(serialized, "base64url").toString("utf8"),
      ) as SignedTokenPayload;
    } catch {
      throw new UnauthorizedException("Signed URL payload is invalid");
    }

    if (payload.action !== expectedAction) {
      throw new UnauthorizedException("Signed URL action is invalid");
    }

    if (payload.exp < Date.now()) {
      throw new UnauthorizedException("Signed URL has expired");
    }

    return payload;
  }

  private isAllowedMimeType(mimeType: string) {
    const normalized = mimeType.trim().toLowerCase();
    return (
      normalized.startsWith("image/") ||
      normalized === "application/pdf" ||
      normalized === "text/plain"
    );
  }

  private getMaxUploadBytes() {
    return Number(process.env.DOCUMENT_MAX_FILE_SIZE_BYTES ?? "15728640");
  }

  private getUploadTokenTtlMs() {
    return Number(process.env.DOCUMENT_UPLOAD_URL_TTL_MS ?? "600000");
  }

  private getDownloadTokenTtlMs() {
    return Number(process.env.DOCUMENT_DOWNLOAD_URL_TTL_MS ?? "300000");
  }

  private getSigningSecret() {
    const explicit = process.env.DOCUMENT_SIGNING_SECRET?.trim();
    if (explicit) {
      return explicit;
    }

    const fallback = process.env.SUPABASE_JWT_SECRET?.trim();
    if (fallback) {
      return fallback;
    }

    if ((process.env.NODE_ENV ?? "development") === "production") {
      throw new Error("DOCUMENT_SIGNING_SECRET is required in production");
    }

    return "dev-insecure-document-signing-secret";
  }

  private getStorageRoot() {
    const configured = process.env.DOCUMENT_STORAGE_ROOT?.trim();
    if (configured) {
      return path.resolve(configured);
    }

    return path.resolve(process.cwd(), ".local-storage", "documents");
  }

  private getApiPublicBaseUrl() {
    const configured = process.env.API_PUBLIC_BASE_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, "");
    }

    const port = Number(process.env.PORT ?? 4000);
    return `http://localhost:${port}`;
  }
}

const documentInclude = {
  uploadedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  },
  property: {
    select: {
      id: true,
      ownerId: true,
      name: true,
      leases: {
        where: {
          status: {
            in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE, LeaseStatus.EXPIRED],
          },
        },
        select: {
          tenantId: true,
        },
      },
    },
  },
  lease: {
    select: {
      id: true,
      landlordId: true,
      tenantId: true,
      unit: {
        select: {
          id: true,
          name: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  maintenanceRequest: {
    select: {
      id: true,
      requesterId: true,
      title: true,
      property: {
        select: {
          ownerId: true,
          name: true,
        },
      },
      lease: {
        select: {
          tenantId: true,
        },
      },
    },
  },
} satisfies Prisma.DocumentInclude;

const sanitizeFileName = (fileName: string) =>
  fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 120) || "document";

const escapeHeaderValue = (value: string) => value.replace(/"/g, "");
