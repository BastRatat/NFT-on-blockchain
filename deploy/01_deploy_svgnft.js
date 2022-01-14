const { deployments, ethers } = require("hardhat");
const fs = require("fs");
const { hrtime } = require("process");
const { networkConfig } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  log("---------------");

  const SVGNFT = await deploy("SVGNFT", {
    from: deployer,
    log: true,
  });

  log(`You have deployed an NFT contract to ${SVGNFT.address}`);

  const filePath = "./images/star.svg";
  const svg = fs.readFileSync(filePath, { encoding: "utf-8" });
  const svgNFTContract = await ethers.getContractFactory("SVGNFT");
  const accounts = await hre.ethers.getSigners();
  const signer = accounts[0];
  const svgNFT = new ethers.Contract(
    SVGNFT.address,
    svgNFTContract.interface,
    signer
  );
  const networkName = networkConfig[chainId].name;
  log(
    `Verify with:\n npx hardhat verify --network ${networkName} ${svgNFT.address}`
  );

  const transactionResponse = await svgNFT.create(svg);
  const receipt = await transactionResponse.wait(1);
  log("NFT has been successfully created");
  log(`token URI:  ${await svgNFT.tokenURI(0)}`);
};
