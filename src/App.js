import React, { useEffect, useState } from "react";
import Factory  from "./Contracts/Factory.json";
import Wallet from "./Contracts/Wallet.json";
import Token from "./Contracts/Token.json";

import { ethers } from "ethers";
import {config} from "./config"
import { Biconomy } from "@biconomy/mexa";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [factoryContract, setFactoryContract] = useState();
  const [tokenContract, setTokenContract] = useState();
  const [bicoContract, setBicoContract] = useState();
  const [token_, setToken] =  useState("");
  const [amount_ , setAmount] = useState(0);
  const [ctoken_, setCToken] =  useState("");
  const [camount_ , setCAmount] = useState(0);

  var dict = {'USDC': config.tokenAddress,
              'USDT': '0x509Ee0d083DdF8AC028f2a56731412edD63223B9'};



  const handleTokenChange= e =>{
    setToken(e.target.value)
  }

  const handleAmountChange = e =>{
    setAmount(e.target.value)
  }

  const handleClaimTokenChange = e =>{
    setCToken(e.target.value)
    
  }

  const handleClaimAmountChange = e =>{
    setCAmount(e.target.value)
  }

  const setContractInstances = async() =>{

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      config.factoryAddress,
      Factory,
      signer
    );

    setFactoryContract(contract);

    const tContract = new ethers.Contract(
      config.tokenAddress,
      Token,
      signer
    )  

    setTokenContract(tContract);

    const biconomy = new Biconomy(window.ethereum, {
      apiKey: config.apikey,
      debug: true,
      contractAddresses: [config.factoryAddress] 
    });
    console.log(biconomy);  
    console.log('Biconomy instantiated');

    const Contract = new ethers.Contract(
    config.factoryAddress,
    Factory,
    biconomy.ethersProvider
    );

    setBicoContract(Contract);

    await biconomy.init();
    
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
      setCurrentAccount(accounts[0]);
      
      console.log("Connected", accounts[0]);

      
    } catch (error) {
      console.log(error);
    }
  };

/******************************************************************************************* */

  /**
   * API to deploy the Wallet from factory 
   */
  const deployNewWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    
    const deployed = await factoryContract.createTLSCW();
    await deployed.wait();
    console.log(deployed);
  };

  const isWalletDeployed = async() =>{
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    let  result ;

    const walletAddress = await factoryContract.registry(currentAccount);
    console.log(walletAddress);
    if(walletAddress != '0x0000000000000000000000000000000000000000'){ 
      result =  true ;
    }
    else result = false;
    return result;
  }
 /************************************Deposit ************************************* */

  const handleEthDeposit =  async() =>{
    console.log('In Eth Deposit')
    if(await isWalletDeployed()){
      
      const walletAddress = await factoryContract.registry(currentAccount);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: walletAddress,
        value : ethers.utils.parseEther(amount_)
      });
      await tx.wait();
      console.log("tx", tx);

    }
    else{
      console.log('Wallet not deployed. Deploying the wallet');
      await deployNewWallet();

      const walletAddress = await factoryContract.registry(currentAccount);
      console.log(walletAddress);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: walletAddress,
        value : ethers.utils.parseEther(amount_)
      });
      await tx.wait();

      console.log("tx", tx);

    }
  }

  const handleTokenDeposit =  async() =>{
    if(isWalletDeployed()){  
      
      const walletAddress = await factoryContract.registry(currentAccount);

      const approve = await tokenContract.approve(walletAddress, amount_);
      await approve.wait();
      console.log(approve);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log(provider)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        walletAddress,
        Wallet.abi,
        signer
      );
      
      const deposit = await contract.deposit(dict[token_], amount_);
      await deposit.wait();
      console.log(deposit);
      
    }
    else{

      await deployNewWallet();
      const walletAddress = await factoryContract.registry(currentAccount);

      const approve = await tokenContract.approve(walletAddress, amount_);
      await approve.await();
      console.log(approve);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        walletAddress,
        Wallet.abi,
        signer
      );
      
      const deposit = await contract.deposit(dict[token_], amount_);
      await deposit.wait();
      console.log(deposit);

    }
  }

  const handleDeposit = async(e) =>{
    e.preventDefault();
    await setContractInstances();
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

    const withdraw = await bicoContract.claimEthers(ethers.utils.parseEther(camount_));
    await withdraw.wait();
    console.log( ethers.utils.parseEther(camount_));
    console.log(withdraw)

  }
  else{
    console.log("Please Deposit First")
  }
}

const handleTokenWithdraw = async() =>{
  if(isWalletDeployed()){

    const withdraw = await bicoContract.claimTokens(dict[ctoken_], camount_);
    await withdraw.wait();
    console.log( ethers.utils.parseEther(camount_));
    console.log(withdraw)

  }
  else{
    console.log("Please Deposit First")
  }
}

const handleWithdraw =async(e) =>{

    e.preventDefault();
    await setContractInstances();
    if(ctoken_ === 'ETH'){
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
      <h1> DepositToken : {token_}</h1>
      <h1> Deposit Amount : {amount_}</h1>
      <h1> ClaimToken : {ctoken_}</h1>
      <h1> Claim Amount: {camount_}</h1>
      </>
  );
}
