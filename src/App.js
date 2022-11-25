import React, { useEffect, useState } from "react";
import Factory  from "./Contracts/Factory.json";
import Wallet from "./Contracts/Wallet.json";

import { ethers } from "ethers";
import {config} from "./config"

export default function App() {
  const [factoryContract, setFactoryContract] = useState();
  const [walletContract, setWalletContract] =  useState();

  const connectWallet = async () => {

    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * API to deploy the Wallet from factory 
   */
  const deployNewWallet = async () => {
    let factoryAddress = config.factoryAddress;

    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      factoryAddress,
      Factory.abi,
      signer
    );

    const deployed = await contract.createTLSCW();
    console.log(deployed);
  };

  const isWalletDeployed = async() =>{

    let factoryAddress = config.factoryAddress;

    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      factoryAddress,
      Factory.abi,
      signer
    );
    setFactoryContract(contract);

    const walletAddress =  contract.getWallet();
    if(walletAddress !== 0){ 
      return true;
    }
    else return false;
  }

  const handleEthDeposit =  async(amount) =>{
    if(isWalletDeployed()){
      const walletAddress = await factoryContract.getWallet();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: walletAddress,
        value : ethers.utils.parseEther(amount)
      });

      console.log("tx", tx);

    }
    else{

    }
  }

  const handleTokenDeposit =  async() =>{

  }
  useEffect(() => {
    connectWallet();
  }, []);

  return (
      <form onSubmit={handleEthDeposit}>
        <h1>
          Deposit ETH
        </h1>
        <input
          type ="text"
          name = "ethers"
          placeholder = "Amount in ETh"
        />
      </form>
  );
}
