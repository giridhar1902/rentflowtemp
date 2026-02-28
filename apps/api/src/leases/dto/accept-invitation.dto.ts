import { IsString, Length } from "class-validator";

export class AcceptInvitationDto {
  @IsString()
  @Length(4, 12)
  code!: string;
}
