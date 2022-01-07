import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiUseTags
} from "@nestjs/swagger";
import {
  DrawingCreationDto,
  EnrollmentDto,
  RevealWinnersDto,
  StartEnrollmentDto
} from "../types/request";
import { DrawingService } from "../../Drawing/services/DrawingService";
import {
  DrawingCreationResponse,
  EndEnrollmentResponse,
  EnrollmentResponse,
  RevealWinnersResponse,
  StartEnrollmentResponse
} from "../types/response";
import { Contract } from "ethers";
import { MakeDrawingStateValidation } from "../pipes/ValidateContractState";
import { ContractAddressToContractPipe } from "../pipes/ContractAddressToContractPipe";
import { DrawingState } from "../../Drawing/constants/DrawingStates";
import { CustomParam } from "../decorators/CustomParam";

@ApiUseTags("drawing")
@Controller("drawing")
export class DrawingController {
  constructor(private readonly drawingService: DrawingService) {}

  @ApiOperation({ title: "Create Drawing" })
  @ApiCreatedResponse({
    type: DrawingCreationResponse,
    description: "Deploys a drawing contract to interact with in the future"
  })
  @ApiResponse({
    status: 422,
    description: "Request body validation failed"
  })
  @Post("")
  async CreateDrawing(
    @Body() body: DrawingCreationDto
  ): Promise<DrawingCreationResponse> {
    console.log(`[CreateDrawing] body: ${JSON.stringify(body)}`);

    if (body.numberOfWinners > 1000) {
      throw new HttpException(
        "Incorrect parameter - numberOfWinners cannot exceed 1000.",
        HttpStatus.BAD_REQUEST
      );
    }

    return {
      ...(await this.drawingService.deployContract(
        body.numberOfWinners,
        body.name
      )),
      numberOfWinners: body.numberOfWinners,
      name: body.name
    };
  }

  @ApiOperation({ title: "Start Enrollment Process" })
  @ApiResponse({
    status: 200,
    type: StartEnrollmentResponse,
    description:
      "Starts the enrollment process. You will be able to add users afterwards"
  })
  @ApiResponse({
    status: 422,
    description: "Request body validation failed"
  })
  @Post("/:contractAddress/start")
  async StartEnrollment(
    @CustomParam(
      "contractAddress",
      ContractAddressToContractPipe,
      MakeDrawingStateValidation(DrawingState.Open)
    )
    contract: Contract,
    @Body() body: StartEnrollmentDto
  ): Promise<StartEnrollmentResponse> {
    console.log(
      `[StartEnrollment] contract: ${contract.address}, body: ${JSON.stringify(
        body
      )}`
    );
    return await this.drawingService.startDrawing(contract as any, body.rules);
  }

  @ApiOperation({ title: "Enroll users" })
  @ApiCreatedResponse({
    type: EnrollmentResponse,
    description:
      "Enrolls users. Only allowed to call this when the drawing is still in the enrollment phase."
  })
  @ApiResponse({
    status: 422,
    description: "Request body validation failed"
  })
  @Post("/:contractAddress/users")
  async Enroll(
    @CustomParam(
      "contractAddress",
      ContractAddressToContractPipe,
      MakeDrawingStateValidation(DrawingState.EnrollmentStarted)
    )
    contract: Contract,
    @Body() body: EnrollmentDto
  ): Promise<EnrollmentResponse> {
    console.log(
      `[Enroll] contract: ${contract.address}, user count: ${body.users.length}`
    );
    return await this.drawingService.enrollUsers(contract, body.users);
  }

  @ApiOperation({ title: "Ends Enrollment Phase" })
  @ApiResponse({
    status: 200,
    type: EndEnrollmentResponse,
    description: "Enrollment Phase ended"
  })
  @Post("/:contractAddress/end")
  async EndEnrollment(
    @CustomParam(
      "contractAddress",
      ContractAddressToContractPipe,
      MakeDrawingStateValidation(DrawingState.EnrollmentStarted)
    )
    contract: Contract
  ): Promise<EndEnrollmentResponse> {
    console.log(`[EndEnrollment] contract: ${contract.address}`);
    const response = await this.drawingService.endEnrollment(contract);
    await this.drawingService.calculateWinners(contract);
    return response;
  }

  @ApiOperation({ title: "Reveal Winners" })
  @ApiResponse({
    status: 200,
    type: RevealWinnersResponse,
    description: "Reveals the initial seed and selects all the winners"
  })
  @Post("/:contractAddress/reveal")
  async RevealWinners(
    @CustomParam("contractAddress", ContractAddressToContractPipe)
    contract: Contract,
    @Body() body: RevealWinnersDto
  ): Promise<RevealWinnersResponse> {
    console.log(
      `[RevealWinners] contract: ${contract.address}, body: ${JSON.stringify(
        body
      )}`
    );
    return await this.drawingService.revealWinners(contract, body.secret);
  }
}
