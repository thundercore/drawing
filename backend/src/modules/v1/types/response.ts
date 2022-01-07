import { ApiModelProperty } from "@nestjs/swagger";

export class DrawingCreationResponse {
  @ApiModelProperty({
    description: "the contract address for the corresponding created drawing"
  })
  contractAddress: string;

  @ApiModelProperty({
    description:
      "The hash of the transaction on the chain which deployed the contract"
  })
  transactionHash: string;

  @ApiModelProperty({
    description: "The name of the drawing"
  })
  name: string;

  @ApiModelProperty()
  numberOfWinners: number;
}

export class StartEnrollmentResponse {
  @ApiModelProperty({
    description: "The pre hashed secret of the random seed. This must be kept"
  })
  secret: string;

  @ApiModelProperty({
    description:
      "The hash of the transaction on the chain which started the enrollment"
  })
  transactionHash: string;
}

export class EnrollmentResponse {
  @ApiModelProperty({
    type: String,
    isArray: true,
    description:
      "The hashes of the transactions on the chain which enrolled the users"
  })
  transactionHashes: string[];

  @ApiModelProperty({
    type: Number,
    isArray: true,
    description: "The users who where successfully enrolled"
  })
  usersEnrolled: number[];
}

export class EndEnrollmentResponse {
  @ApiModelProperty({
    description: "The pre hashed secret of the random seed. This must be kept"
  })
  endBlockNumber: number;

  @ApiModelProperty({
    description:
      "The hash of the transaction on the chain which ended the enrollment"
  })
  transactionHash: string;
}

export class RevealWinnersResponse {
  @ApiModelProperty({
    type: Number,
    isArray: true,
    description: "The winners of the transaction"
  })
  winners: number[];

  @ApiModelProperty({
    type: String,
    isArray: true,
    description:
      "The hashes of the transactions on the chain which collected the winners"
  })
  transactionHashes: string[];
}
