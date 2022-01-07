import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min
} from "class-validator";
import { ApiModelProperty } from "@nestjs/swagger";

export class DrawingCreationDto {
  @ApiModelProperty({
    description: "Drawing name"
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiModelProperty({
    description: "Number of winners to be selected"
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  numberOfWinners: number;
}

export class StartEnrollmentDto {
  @ApiModelProperty({
    description: "Drawing rules"
  })
  @IsNotEmpty()
  @IsString()
  rules: string;
}

export class EnrollmentDto {
  @ApiModelProperty({
    type: Number,
    isArray: true,
    description: "Ids of the users to be enrolled"
  })
  @IsArray()
  @IsNumber(undefined, { each: true })
  users: number[];
}

export class RevealWinnersDto {
  @ApiModelProperty({
    description: "The initial secret used to start the drawing"
  })
  @IsString()
  secret: string;
}
