import React, { useEffect, useState } from "react";
import Factory  from "./Contracts/Factory.json";
import Wallet from "./Contracts/Wallet.json";
import Token from "./Contracts/Token.json";

import { ethers } from "ethers";
import {config} from "./config"
import { Biconomy } from "@biconomy/mexa";

export default function App() {

  const [factoryContract, setFactoryContract] = useState();
  const [token_, setToken] =  useState("");
  const [amount_ , setAmount] = useState(0);
  const [ctoken_, setCToken] =  useState("");
  const [camount_ , setCAmount] = useState(0);
  var dict = {'USDC': '0x005A32A2ba4516cFD6e999726262a8A1e2A8147b',
              'USDT': '0x509Ee0d083DdF8AC028f2a56731412edD63223B9'};


  const biconomy = new Biconomy(window.ethereum, {
    apiKey: config.apikey,
    debug: true,
    contractAddresses: [config.factoryAddress], // list of contract address you want to enable gasless on
  });

  const handleTokenChange= e =>{
    setToken(e.target.value)
    
  }

  const handleAmountChange = e =>{
    setAmount(e.target.value)
  }

  const handleClaimTokenChange= e =>{
    setCToken(e.target.value)
    
  }

  const handleClaimAmountChange = e =>{
    setCAmount(e.target.value)
  }

  /****************************************************************************************** */
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
      await biconomy.init();
      
    } catch (error) {
      console.log(error);
    }
  };

/******************************************************************************************* */

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
    debugger;
    const walletAddress =  await contract.getWallet();
    console.log(walletAddress);
    debugger;
    if(walletAddress !== 0){ 
      return true;
    }
    else return false;
  }
 /************************************Deposit ************************************* */
  const handleEthDeposit =  async() =>{
    if(isWalletDeployed()){
      const walletAddress = await factoryContract.getWallet();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: walletAddress,
        value : ethers.utils.parseEther(amount_)
      });

      console.log("tx", tx);

    }
    else{
      await deployNewWallet();

      const walletAddress = await factoryContract.getWallet();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: walletAddress,
        value : ethers.utils.parseEther(amount_)
      });

      console.log("tx", tx);


    }
  }

  const handleTokenDeposit =  async() =>{
  if(isWalletDeployed()){
    const walletAddress = await factoryContract.getWallet();

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const tokenContract =  new ethers.Contract(
      dict[token_],
      Token.abi,
      signer
    );
    debugger;
    const approve = await tokenContract.approve(walletAddress, amount_);
    console.log(approve);

    const contract = new ethers.Contract(
      walletAddress,
      Wallet.abi,
      signer
    );
    debugger;
    const deposit = await contract.deposit(dict[token_], amount_);
    console.log(deposit);
    debugger;
  }
  else{

    await deployNewWallet();
    const walletAddress = await factoryContract.getWallet();

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(
      walletAddress,
      Wallet.abi,
      signer
    );

    const deposit = await contract.deposit(dict[token_], amount_);
    console.log(deposit);

  }
  }

  const handleDeposit = async() =>{
    if(token_ === 'ETH'){
      await handleEthDeposit();
    }
    else{
      await handleTokenDeposit();
    }
  }

/*************************************Withdraw ***************************************/

const handleEthWithdraw = async() =>{
  if(isWalletDeployed()){

    let factoryAddress = config.factoryAddress;
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const contract = new ethers.Contract(
      factoryAddress,
      Factory.abi,
      biconomy.ethersProvider
    );

    const withdraw = await contract.claimEthers(ethers.utils.parseEther(amount_));
    console.log( ethers.utils.parseEther(amount_));
    console.log(withdraw)

  }
  else{
    console.log("Please Deposit First")
  }
}

const handleTokenWithdraw = async() =>{
  if(isWalletDeployed()){

    let factoryAddress = config.factoryAddress;
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    const contract = new ethers.Contract(
      factoryAddress,
      Factory.abi,
      biconomy.ethersProvider
    );

    const withdraw = await contract.claimTokens(dict[token_], amount_);
    console.log( ethers.utils.parseEther(amount_));
    console.log(withdraw)

  }
  else{
    console.log("Please Deposit First")
  }
}
const handleWithdraw =async() =>{

    if(token_ === 'ETH'){
      await handleEthWithdraw();
    }
    else{
      await handleTokenWithdraw();
    }
}
  useEffect(() => {
    connectWallet();
  }, []);

  return (
      <>
      <form onSubmit={handleDeposit}>
      <label>
        Deposit
      </label>
      <select
        name="tokens"
        value={token_}
        onChange={handleTokenChange}
      >
        <option value="ETH">ETH</option>
        <option value="USDC">USDC</option>
        <option value="USDT">USDT</option>
      </select>
      <input
        type="text"
        name="amount"
        value={amount_}
        onChange={handleAmountChange} />
      <input type="submit" />
    </form>
    <form onSubmit={handleWithdraw}>
        <label>
          Claim
        </label>
        <select
          name="tokens"
          value={ctoken_}
          onChange={handleClaimTokenChange}
        >
          <option value="ETH">ETH</option>
          <option value="USDC">USDC</option>
          <option value="USDT">USDT</option>
        </select>
        <input
          type="text"
          name="amount"
          value={camount_}
          onChange={handleClaimAmountChange} />
        <input type="submit" />
      </form>
      </>
  );
}
