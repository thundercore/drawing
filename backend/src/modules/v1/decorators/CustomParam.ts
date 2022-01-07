import { createParamDecorator } from "@nestjs/common";

export const CustomParam = createParamDecorator((data: string, req) => {
  return req.params[data];
});
