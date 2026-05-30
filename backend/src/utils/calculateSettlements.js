export function calculateSettlements(expenses, members, settledRecords = []) {
  const memberLabelMap = new Map(
    members.map((member) => {
      const memberId = (member._id || member).toString();
      const label = member.name || member.email || memberId;
      return [memberId, label];
    })
  );
  const balanceMap = new Map([...memberLabelMap.keys()].map((id) => [id, 0]));

  for (const expense of expenses) {
    const paidBy = expense.paidBy.toString();
    balanceMap.set(paidBy, (balanceMap.get(paidBy) || 0) + expense.amount);

    for (const share of expense.shares) {
      const userId = share.user.toString();
      balanceMap.set(userId, (balanceMap.get(userId) || 0) - share.amount);
    }
  }

  for (const settledRecord of settledRecords) {
    const fromUserId = (settledRecord.fromUser?._id || settledRecord.fromUser || settledRecord.from).toString();
    const toUserId = (settledRecord.toUser?._id || settledRecord.toUser || settledRecord.to).toString();
    const amount = Number(settledRecord.amount || 0);

    balanceMap.set(fromUserId, (balanceMap.get(fromUserId) || 0) + amount);
    balanceMap.set(toUserId, (balanceMap.get(toUserId) || 0) - amount);
  }

  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of balanceMap.entries()) {
    if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
    if (balance > 0.01) creditors.push({ userId, amount: balance });
  }

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);

    settlements.push({
      fromUserId: debtors[i].userId,
      toUserId: creditors[j].userId,
      from: memberLabelMap.get(debtors[i].userId) || debtors[i].userId,
      to: memberLabelMap.get(creditors[j].userId) || creditors[j].userId,
      amount: Number(amount.toFixed(2))
    });

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount <= 0.01) i += 1;
    if (creditors[j].amount <= 0.01) j += 1;
  }

  return settlements;
}
