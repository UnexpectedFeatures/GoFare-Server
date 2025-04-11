// associations.js
import { UserAccount } from "./userAccountModel.js";
import Wallet from "./walletModel.js";

UserAccount.associate = function (models) {
  UserAccount.hasOne(models.WalletModel, {
    foreignKey: "Wallet_id",
    as: "wallet",
  });
};

Wallet.associate = function (models) {
    Wallet.belongsTo(models.UserAccount, {
    foreignKey: "Wallet_id",
    as: "user",
  });
};
