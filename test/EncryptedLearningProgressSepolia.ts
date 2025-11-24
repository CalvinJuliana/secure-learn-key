import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedLearningProgress } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedLearningProgressSepolia", function () {
  let signers: Signers;
  let contract: EncryptedLearningProgress;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedLearningProgress");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("EncryptedLearningProgress", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("add study minutes and decrypt", async function () {
    steps = 8;

    this.timeout(4 * 40000);

    progress("Encrypting study minutes '30'...");
    const encryptedMinutes = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(30)
      .encrypt();

    progress(
      `Call addStudyMinutes(30) contract=${contractAddress} handle=${ethers.hexlify(encryptedMinutes.handles[0])} signer=${signers.alice.address}...`,
    );
    let tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encryptedMinutes.handles[0], encryptedMinutes.inputProof);
    await tx.wait();

    progress(`Call getEncryptedStudyMinutes()...`);
    const encryptedTotal = await contract.getEncryptedStudyMinutes(signers.alice.address);
    expect(encryptedTotal).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting getEncryptedStudyMinutes()=${encryptedTotal}...`);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );
    progress(`Clear getEncryptedStudyMinutes()=${clearTotal}`);

    expect(clearTotal).to.eq(30);
  });

  it("accumulate study minutes", async function () {
    steps = 12;

    this.timeout(4 * 60000);

    progress("Encrypting first session '30' minutes...");
    const encrypted1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(30)
      .encrypt();

    progress(`Call addStudyMinutes(30)...`);
    let tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encrypted1.handles[0], encrypted1.inputProof);
    await tx.wait();

    progress("Encrypting second session '45' minutes...");
    const encrypted2 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(45)
      .encrypt();

    progress(`Call addStudyMinutes(45)...`);
    tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encrypted2.handles[0], encrypted2.inputProof);
    await tx.wait();

    progress(`Call getEncryptedStudyMinutes()...`);
    const encryptedTotal = await contract.getEncryptedStudyMinutes(signers.alice.address);

    progress(`Decrypting getEncryptedStudyMinutes()=${encryptedTotal}...`);
    const clearTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );
    progress(`Clear getEncryptedStudyMinutes()=${clearTotal}`);

    expect(clearTotal).to.eq(75);
  });
});

