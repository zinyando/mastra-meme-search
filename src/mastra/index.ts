import { Mastra } from "@mastra/core";

import { memeRagWorkflow } from "./workflows";

export const mastra = new Mastra({
  workflows: {
    memeRagWorkflow,
  },
});
