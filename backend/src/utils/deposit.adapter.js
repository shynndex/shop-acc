export const adaptCardDeposit = (cardDeposit) => {
  if (!cardDeposit) return null;

  return {
    _id: cardDeposit._id.toString(),
    userId: cardDeposit.user?.toString(),
    userUsername: cardDeposit.user?.username,
    userEmail: cardDeposit.user?.email,
    type: "card",
    amount: cardDeposit.receivedAmount || 0, // Số tiền thực nhận
    fee: cardDeposit.declaredValue - (cardDeposit.receivedAmount || 0), // Phí = khai báo - thực nhận
    status: cardDeposit.status,
    cardInfo: {
      provider: cardDeposit.provider,
      serial: cardDeposit.serial,
      declaredValue: cardDeposit.receivedAmount,
    },
    adminNote: cardDeposit.adminNote,
    apiStatusCode: cardDeposit.apiStatusCode,
    apiTransId: cardDeposit.apiTransId,
    createdAt: cardDeposit.createdAt,
    updatedAt: cardDeposit.updatedAt,
  };
};

export const adaptBankDeposit = (bankDeposit) => {
  if (!bankDeposit) return null;

  return {
    _id: bankDeposit._id.toString(),
    userId: bankDeposit.user?.toString(),
    userUsername: bankDeposit.user?.username,
    userEmail: bankDeposit.user?.email,
    type: "bank",
    amount: bankDeposit.amount,
    fee: 0,
    status: bankDeposit.status,
    bankInfo: {
      bankName: bankDeposit.bank?.bankName,
      accountNumber: bankDeposit.bank?.accountNumber,
      accountHolder: bankDeposit.bank?.accountHolder,
      referenceCode: bankDeposit.referenceCode,
    },
    adminNote: bankDeposit.adminNote,
    payosOrderId: bankDeposit.payosOrderId,
    transactionData: bankDeposit.transactionData,
    createdAt: bankDeposit.createdAt,
    updatedAt: bankDeposit.updatedAt,
  };
};

export const isCardDeposit = (doc) => doc?.provider !== undefined;
export const isBankDeposit = (doc) =>
  doc?.referenceCode !== undefined && doc?.orderCode !== undefined;
