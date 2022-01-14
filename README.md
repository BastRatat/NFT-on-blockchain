# NFT: add an SVG to blockchain on an ETH test network

### ERC721 standard

Documentation:
[ERC721, non-fungible token standard](https://eips.ethereum.org/EIPS/eip-721)

ERC721 Metadata JSON Schema:

```json
{
  "title": "Asset Metadata",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Identifies the asset to which this NFT represents"
    },
    "description": {
      "type": "string",
      "description": "Describes the asset to which this NFT represents"
    },
    "image": {
      "type": "string",
      "description": "A URI pointing to a resource with mime type image/* representing the asset to which this NFT represents. Consider making any images at a width between 320 and 1080 pixels and aspect ratio between 1.91:1 and 4:5 inclusive."
    }
  }
}
```

### Packages

```shell
yarn add @nomiclabs/hardhat-etherscan @openzeppelin/contracts base64-sol dotenv fs hardhat-deploy hardhat-shorthand
```

### Smart contract development

Contract inherits from openzeppelin ERC721URIStorage extension, allowing to make us of two methods:

- \_safeMint()
- \_setTokenURI()

**Constructor**

- name: SVG NFT
- symbol: SvgNFT

```solidity
constructor() ERC721("SVG NFT", "SvgNFT") {
  tokenCounter = 0;
}
```

**Storage VS memory variable**

```solidity
string memory name = "Bastien"; // memory, used to hold temporary values
string name = "Bastien"; // storage, every contract has its own storage and it is persistent between function calls
```

**Contract workflow**

- mint the the new token. If a given token ID already exists, the mint operation is reverted
- convert an svg element into a base 64 encoded string
- create a tokenURI containing a name, description, an image and attributes
- emit an event that stores the tokenCounter and tokenURI in transaction logs that are stored on blockchain and are accessible using the contract address
- increment the tokenCounter

The create() is expected to get called in the deployment script or by the client whether we want to link our contract to a front-end application.

```solidity
function create(string memory svg) public {
  _safeMint(msg.sender, tokenCounter);
  string memory imageURI = SVGtoImageURI(svg);
  string memory tokenURI = formatTokenURI(imageURI);
  _setTokenURI(tokenCounter, tokenURI);
  emit CreatedSVGNFT(tokenCounter, tokenURI);
  tokenCounter = tokenCounter + 1;
}
```

### Configurations

**environment variables**

Please store in a .env file the following information as string:

- RINKEBY_RPC_URL: create an app on [alchemy](https://dashboard.alchemyapi.io/), click view details and view key
- MNEMONIC: your mnemonic from your Metamask account
- ETHERSCAN_API_KEY: go to your etherscan account and generate a new API key by clicking the more tab and add key

**hardhat.config.js**

```javascript
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("dotenv").config();

const MNEMONIC = process.env.MNEMONIC;
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: {
        mnemonic: MNEMONIC,
      },
      saveDeployments: true,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  solidity: "0.8.0",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
};
```

- network, set rinkeby as your choosen network and pass the environment variable from alchemy
- log in to your metamask account using the mnemonic
- allow interactions with etherscan by pasting your API key
- specify your solidity version (must be the same as the one within your contract)
- take the first account from your Metamask list of accounts

**hardhat.config.js**

```javascript
const networkConfig = {
  31337: {
    name: "localhost",
  },
  4: {
    name: "rinkeby",
  },
};

module.exports = { networkConfig };
```

- default network is localhost
- ETH test network is set to the test network Rinkeby

### Deployment

```javascript
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
```

- deploys the SVGNFT contract on the blockchain
- logs the contract address
- imports the SVG
- creates an instance of the SVGNFT contract using the getContractFactory method
- retrieves accounts and signer
- creates and logs the tokenURI

### Usage

Run the following commands:

```shell
npx hardhat deploy --network rinkeby
npx hardhat verify --network
```

- go on etherscan and paste your contract address. Running the verify command should gives you access to your contract code.
- copy and paste your tokenURI in your browser
- copy and paste your image from the tokenURI to your browser to retrieve your SVG
- copy your contract address on Opensea (test networks) to be able to interact if your NFT
