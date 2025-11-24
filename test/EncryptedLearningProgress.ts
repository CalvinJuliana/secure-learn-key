import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { EncryptedLearningProgress, EncryptedLearningProgress__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedLearningProgress")) as EncryptedLearningProgress__factory;
  const contract = (await factory.deploy()) as EncryptedLearningProgress;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("EncryptedLearningProgress", function () {
  let signers: Signers;
  let contract: EncryptedLearningProgress;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("encrypted study minutes should be uninitialized after deployment", async function () {
    const encryptedMinutes = await contract.getEncryptedStudyMinutes(signers.alice.address);
    // Expect initial count to be bytes32(0) after deployment,
    // (meaning the encrypted value is uninitialized)
    expect(encryptedMinutes).to.eq(ethers.ZeroHash);
  });

  it("encrypted task count should be uninitialized after deployment", async function () {
    const encryptedTaskCount = await contract.getEncryptedTaskCount(signers.alice.address);
    expect(encryptedTaskCount).to.eq(ethers.ZeroHash);
  });

  it("add study minutes", async function () {
    const clearMinutes = 30;

    // Encrypt minutes as a euint32
    const encryptedMinutes = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(clearMinutes)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encryptedMinutes.handles[0], encryptedMinutes.inputProof);
    await tx.wait();

    const encryptedTotal = await contract.getEncryptedStudyMinutes(signers.alice.address);
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(clearMinutes);
  });

  it("accumulate study minutes", async function () {
    const firstSession = 30;
    const secondSession = 45;

    // First session
    const encrypted1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(firstSession)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encrypted1.handles[0], encrypted1.inputProof);
    await tx.wait();

    // Second session
    const encrypted2 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(secondSession)
      .encrypt();

    tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encrypted2.handles[0], encrypted2.inputProof);
    await tx.wait();

    const encryptedTotal = await contract.getEncryptedStudyMinutes(signers.alice.address);
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(firstSession + secondSession);
  });

  it("complete task", async function () {
    const clearTaskCount = 1;

    // Encrypt task count as a euint32
    const encryptedTask = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(clearTaskCount)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .completeTask(encryptedTask.handles[0], encryptedTask.inputProof);
    await tx.wait();

    const encryptedTotal = await contract.getEncryptedTaskCount(signers.alice.address);
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(clearTaskCount);
  });

  it("accumulate task completions", async function () {
    const task1 = 1;
    const task2 = 1;

    // Complete first task
    const encrypted1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(task1)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .completeTask(encrypted1.handles[0], encrypted1.inputProof);
    await tx.wait();

    // Complete second task
    const encrypted2 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(task2)
      .encrypt();

    tx = await contract
      .connect(signers.alice)
      .completeTask(encrypted2.handles[0], encrypted2.inputProof);
    await tx.wait();

    const encryptedTotal = await contract.getEncryptedTaskCount(signers.alice.address);
    const decryptedTotal = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedTotal,
      contractAddress,
      signers.alice,
    );

    expect(decryptedTotal).to.eq(task1 + task2);
  });

  it("user isolation - different users have separate progress", async function () {
    const aliceMinutes = 30;
    const bobMinutes = 60;

    // Alice adds minutes
    const encryptedAlice = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(aliceMinutes)
      .encrypt();

    let tx = await contract
      .connect(signers.alice)
      .addStudyMinutes(encryptedAlice.handles[0], encryptedAlice.inputProof);
    await tx.wait();

    // Bob adds minutes
    const encryptedBob = await fhevm
      .createEncryptedInput(contractAddress, signers.bob.address)
      .add32(bobMinutes)
      .encrypt();

    tx = await contract
      .connect(signers.bob)
      .addStudyMinutes(encryptedBob.handles[0], encryptedBob.inputProof);
    await tx.wait();

    // Verify Alice's total
    const aliceEncrypted = await contract.getEncryptedStudyMinutes(signers.alice.address);
    const aliceDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      aliceEncrypted,
      contractAddress,
      signers.alice,
    );
    expect(aliceDecrypted).to.eq(aliceMinutes);

    // Verify Bob's total
    const bobEncrypted = await contract.getEncryptedStudyMinutes(signers.bob.address);
    const bobDecrypted = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      bobEncrypted,
      contractAddress,
      signers.bob,
    );
    expect(bobDecrypted).to.eq(bobMinutes);
  });
});

