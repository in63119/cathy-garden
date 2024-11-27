import { ethers } from "hardhat";
import { makeAbi } from "./abiGenerator";

async function main() {
  const Login = await ethers.getContractFactory("Login");

  console.log("Deploying Contract...");

  const login = await Login.deploy();
  await login.waitForDeployment();

  /* setting */

  // await vendingMachine.setC2eContractAddress(
  //   "0x75F7D6bEb76125f4eE30f059051f73081020E210"
  // );
  // await cyb.setAdmin(deployer.address, true);
  // await cyb.setProbabilities(8000, 850, 850, 300);

  /* abi */
  // await makeAbi("CYB", `${cyb.target}`);
  // console.log("Contract deployed to:", cyb.target);

  // await makeAbi("MultiSender", `${multiSender.target}`);
  // console.log("Contract deployed to:", multiSender.target);

  // await makeAbi("C2E", `${c2e.target}`);
  // console.log("Contract deployed to:", c2e.target);

  await makeAbi("Login", `${login.target}`);
  console.log("Contract deployed to:", login.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
