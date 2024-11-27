import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    kaiaTestnet: {
      url: "https://public-en-kairos.node.kaia.io",
      accounts: [process.env.PRIVATE_KEY || ""],
    },
  },
};

export default config;
