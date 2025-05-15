import { ethers } from "hardhat";
import { makeAbi } from "./abiGenerator";

async function main() {
  const GardenProxy = await ethers.getContractFactory("GardenProxy");
  const Garden = await ethers.getContractFactory("Garden");

  console.log("Deploying Contract...");

  const garden = await Garden.deploy();
  await garden.waitForDeployment();

  const gardenProxy = await GardenProxy.deploy(garden.target);
  await gardenProxy.waitForDeployment();

  /* setting */

  await makeAbi("GardenProxy", `${gardenProxy.target}`);
  console.log("Contract deployed to:", gardenProxy.target);

  await makeAbi("Garden", `${gardenProxy.target}`);
  console.log("Contract deployed to:", garden.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
