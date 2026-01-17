/**
 * Balance Engine Service
 * Calculates net balances and provides minimal settlement suggestions
 */

/**
 * Calculate net balances for all participants in a group
 * @param {Array} expenses - Array of expense documents
 * @param {Array} participants - Array of participant objects from group
 * @returns {Object} Balance data with net balances and detailed breakdown
 */
export const calculateBalances = (expenses, participants) => {
  const balances = {};
  const paidAmounts = {};
  const owedAmounts = {};
  const participantMap = {};

  participants.forEach(participant => {
    const participantId = participant._id.toString();
    participantMap[participantId] = participant;
    balances[participantId] = {
      participantId,
      participantName: participant.name,
      participantColor: participant.color || null,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0
    };
    paidAmounts[participantId] = 0;
    owedAmounts[participantId] = 0;
  });

  expenses.forEach(expense => {
    const payerId = expense.payer.toString();

    if (paidAmounts[payerId] !== undefined) {
      paidAmounts[payerId] += expense.amount;
    }

    if (expense.splits && Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const splitParticipantId = split.participantId.toString();
        if (owedAmounts[splitParticipantId] !== undefined) {
          owedAmounts[splitParticipantId] += split.amount;
        }
      });
    }
  });

  Object.keys(balances).forEach(participantId => {
    balances[participantId].totalPaid = Math.round(paidAmounts[participantId] * 100) / 100;
    balances[participantId].totalOwed = Math.round(owedAmounts[participantId] * 100) / 100;
    balances[participantId].netBalance = Math.round((paidAmounts[participantId] - owedAmounts[participantId]) * 100) / 100;
  });

  return {
    balances: Object.values(balances),
    participantMap
  };
};

/**
 * Create a balance matrix showing who owes whom
 * @param {Array} expenses - Array of expense documents
 * @param {Array} participants - Array of participant objects from group
 * @returns {Array} Array of balance entries showing directional debts
 */
export const calculateBalanceMatrix = (expenses, participants) => {
  const debtMatrix = {};
  const participantMap = {};

  participants.forEach(participant => {
    const participantId = participant._id.toString();
    participantMap[participantId] = participant;
    debtMatrix[participantId] = {};
  });

  expenses.forEach(expense => {
    const payerId = expense.payer.toString();
    const expenseAmount = expense.amount;

    if (expense.splits && Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const splitParticipantId = split.participantId.toString();
        const splitAmount = split.amount;

        if (splitParticipantId !== payerId) {
          if (!debtMatrix[splitParticipantId][payerId]) {
            debtMatrix[splitParticipantId][payerId] = 0;
          }
          debtMatrix[splitParticipantId][payerId] += splitAmount;
        }
      });
    }
  });

  const balanceEntries = [];
  Object.keys(debtMatrix).forEach(debtorId => {
    Object.keys(debtMatrix[debtorId]).forEach(creditorId => {
      const amount = Math.round(debtMatrix[debtorId][creditorId] * 100) / 100;
      if (amount > 0.01) {
        balanceEntries.push({
          from: {
            participantId: debtorId,
            participantName: participantMap[debtorId]?.name || 'Unknown',
            participantColor: participantMap[debtorId]?.color || null
          },
          to: {
            participantId: creditorId,
            participantName: participantMap[creditorId]?.name || 'Unknown',
            participantColor: participantMap[creditorId]?.color || null
          },
          amount: amount
        });
      }
    });
  });

  return balanceEntries;
};

/**
 * Calculate minimal settlement transactions using a simplified algorithm
 * @param {Array} expenses - Array of expense documents
 * @param {Array} participants - Array of participant objects from group
 * @returns {Array} Array of settlement transactions
 */
export const calculateMinimalSettlements = (expenses, participants) => {
  const { balances } = calculateBalances(expenses, participants);

  const creditors = balances
    .filter(b => b.netBalance > 0.01)
    .sort((a, b) => b.netBalance - a.netBalance);

  const debtors = balances
    .filter(b => b.netBalance < -0.01)
    .map(b => ({ ...b, netBalance: Math.abs(b.netBalance) }))
    .sort((a, b) => b.netBalance - a.netBalance);

  const settlements = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const settlementAmount = Math.min(creditor.netBalance, debtor.netBalance);
    const roundedAmount = Math.round(settlementAmount * 100) / 100;

    if (roundedAmount > 0.01) {
      settlements.push({
        from: {
          participantId: debtor.participantId,
          participantName: debtor.participantName,
          participantColor: debtor.participantColor
        },
        to: {
          participantId: creditor.participantId,
          participantName: creditor.participantName,
          participantColor: creditor.participantColor
        },
        amount: roundedAmount
      });
    }

    creditor.netBalance = Math.round((creditor.netBalance - settlementAmount) * 100) / 100;
    debtor.netBalance = Math.round((debtor.netBalance - settlementAmount) * 100) / 100;

    if (creditor.netBalance < 0.01) {
      creditorIndex++;
    }
    if (debtor.netBalance < 0.01) {
      debtorIndex++;
    }
  }

  return settlements;
};

/**
 * Get summary statistics for a group
 * @param {Array} expenses - Array of expense documents
 * @returns {Object} Summary statistics
 */
export const calculateSummary = (expenses) => {
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const roundedTotalSpent = Math.round(totalSpent * 100) / 100;

  return {
    totalExpenses: expenses.length,
    totalSpent: roundedTotalSpent,
    averageExpense: expenses.length > 0 
      ? Math.round((totalSpent / expenses.length) * 100) / 100 
      : 0
  };
};
