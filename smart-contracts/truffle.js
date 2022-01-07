const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    develop: {
      host: "localhost",
      port: 9545,
      network_id: "*",
      gas: 100000000
    },
    ganache: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    thunder: {
      provider: () => {
        const credentials = require("../credentials.json");
        // const config = require('../config/config')
        return new HDWalletProvider(
          credentials.mnemonic,
          "https://testnet-rpc.thundercore.com:8544",
          0
        );
      },
      network_id: "18",
      gas: 69000000
    }
  },
  compilers: {
    solc: {
      version: "0.5.8", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // see the solidity docs for advice about optimization and evmversion
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium"
      }
    }
  }
};
