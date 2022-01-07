const Drawing = artifacts.require("Drawing");
const secret =
  "0x0acef64895b5433669e8cb500b0765aa763d61b3ceda5b945a1a09c7e1a67059";
const commit =
  "0x2b2145a9bfb587d068d539108454867f3c9b038a2008e273e1b0a6060db49034";

const totalParticipant = 200;
const numWinners = 300;
// const revealNum1 = 15;
// const remainNum = 1000;
// const revealNum2 = numWinners - revealNum1 - remainNum;

const users = [...Array(totalParticipant).keys()];

const expectThrowsAsync = async (method) => {
  let error = false;
  try {
    await method();
  } catch (err) {
    error = true;
  }
  assert.equal(error, true);
};

contract("Drawing", () => {
  let instance;
  before(async () => {
    instance = await Drawing.new(numWinners, "");
  });

  it("does not allow during open state", async () => {
    expectThrowsAsync(() => instance.adminBatchEnroll(users));
    expectThrowsAsync(() => instance.revealAllWinners(secret));
    expectThrowsAsync(() => instance.endEnrollment());
  });

  it("enrolls users", async () => {
    await instance.startEnrollment("", commit);
    const batch = 100;
    const enrolling = [...users];
    let enrolledUsers = [];
    for (let i = 0; i < enrolling.length; i += batch) {
      const receipt1 = await instance.adminBatchEnroll(
        enrolling.slice(i, i + batch)
      );
      const batchEnrolledUsers = receipt1.logs[0].args.participants.map((obj) =>
        obj.toNumber()
      );
      enrolledUsers = enrolledUsers.concat(batchEnrolledUsers);
    }
    assert.deepEqual(users, enrolledUsers);
  });

  // it("disenrolls only enrolled users", async () => {
  //   const receipt1 = await instance.adminBatchDisenroll([10000000000, 1, 2, 3]);
  //   const disenrolledUsers = receipt1.logs.map((log) =>
  //     log.args.participant.toNumber()
  //   );
  //   assert.equal(disenrolledUsers.length, 3);
  // });

  it("does not allow during start state", async () => {
    expectThrowsAsync(() => instance.startEnrollment("", commit));
    expectThrowsAsync(() => instance.revealAllWinners(secret));
  });

  it("does not allow during end state", async () => {
    await instance.endEnrollment();
    await instance.calculateWinners();
    expectThrowsAsync(() => instance.startEnrollment("", commit));
    expectThrowsAsync(() => instance.adminBatchEnroll([13, 14]));
    expectThrowsAsync(() => instance.endEnrollment());
  });

  it("does not allow revealing a seed that does not hash to the commit", () => {
    expectThrowsAsync(() => instance.revealAllWinners(commit));
  });

  // it("reveals random winners", async () => {
  //   const receipt = await instance.revealNextWinners(revealNum1);
  //   const winners = receipt.logs.map((log) => log.args.winner.toNumber());
  //   expect(winners.length).to.equal(revealNum1);
  //   while (winners.length) {
  //     const winner = winners.pop();
  //     expect(users).to.include(winner);
  //     expect(winners).to.not.include(winner);
  //   }
  //   const receipt1 = await instance.revealNextWinners(revealNum2);
  //   const obj = {
  //     to: receipt1.receipt.to,
  //     gasUsed: receipt1.receipt.gasUsed,
  //     cumulativeGasUsed: receipt1.receipt.cumulativeGasUsed
  //   };
  //   console.log("receipt1", obj);

  //   const winners2 = receipt1.logs.map((log) => log.args.winner.toNumber());
  //   expect(winners2.length).to.equal(revealNum2);
  //   while (winners.length) {
  //     const winner = winners2.pop();
  //     expect(users).to.include(winners2);
  //     expect(winners2).to.not.include(winner);
  //   }
  // });

  it("reveals all winners", async () => {
    const receipt = await instance.revealAllWinners(secret);
    const obj = {
      to: receipt.receipt.to,
      gasUsed: receipt.receipt.gasUsed,
      cumulativeGasUsed: receipt.receipt.cumulativeGasUsed
    };
    console.log("receipt", obj);
    const winners = receipt.logs[0].args.winners.map((obj) => obj.toNumber());
    expect(winners.length).to.equal(Math.min(numWinners, totalParticipant));
    while (winners.length) {
      const winner = winners.pop();
      expect(users).to.include(winner);
      expect(winners).to.not.include(winner);
    }
  });
  2;
  // it("does not reveal any more winners once all revealed", async () => {
  //   expectThrowsAsync(() => instance.revealNextWinners(10));
  // });
});
