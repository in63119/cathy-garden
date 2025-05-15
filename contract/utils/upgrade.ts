import { ethers as hre } from "hardhat";
import { makeAbi } from "./abiGenerator";
import { ethers } from "ethers";
import Proxy from "../abis/GardenProxy.json";

async function main() {
  const [admin] = await hre.getSigners();
  const proxy = new ethers.Contract(Proxy.address, Proxy.abi, admin);
  //   const V2 = await hre.getContractFactory("V2");

  console.log("Deploying Contract...");

  /*
    업그레이드를 실행합니다. Proxy 컨트랙트에서 upgrade 함수를 실행시켜야 합니다. 
  */
  //   const v2;

  /* setting */
  console.log("Contract deployed to:", v2.target);
  await makeAbi("V2", `${proxy.target}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
