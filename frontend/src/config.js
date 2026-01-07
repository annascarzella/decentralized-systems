import { getAddress } from "ethers";

export const PROXY_ADDRESS = getAddress(import.meta.env.VITE_PROXY_ADDRESS);

// network
export const REQUIRED_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID);


