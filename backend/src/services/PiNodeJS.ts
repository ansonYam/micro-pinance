import PiNetwork from "pi-backend";
import env from "../environments";

const apiKey = env.pi_api_key;
const walletPrivateSeed = env.wallet_private_seed;
const pi = new PiNetwork(apiKey, walletPrivateSeed);

export default function initializePiNetwork(): PiNetwork {
    return new PiNetwork(apiKey, walletPrivateSeed);
}
