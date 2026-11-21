import { describe, expect, it } from "vitest";
import { createMemoryStores } from "./memoryStores";
import { runStoreContract } from "./storeContract";

runStoreContract(createMemoryStores, { describe, it, expect });
