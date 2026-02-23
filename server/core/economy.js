import { ITEM_DEFS } from '../shared/constants.js';

export class GameEconomy {
    constructor(world) {
        this.world = world;
        this.bank = {
            accounts: {},
            transactions: [],
            loans: [],
            savings: {}
        };

        this.shops = {
            listings: {},   // Player listings
            categories: {}  // Shop categories
        };

        this.initShop();
    }

    initShop() {
        this.shops.categories = {
            "weapons": { name: "⚔️ Weapons", icon: "🔪" },
            "tools": { name: "🛠️ Tools", icon: "⛏️" },
            "food": { name: "🍖 Food", icon: "🍎" },
            "materials": { name: "📦 Materials", icon: "🧱" },
            "potions": { name: "�� Potions", icon: "✨" }
        };
    }

    // ============= BANKING FUNCTIONS =============

    createAccount(player) {
        if (!this.bank.accounts[player.id]) {
            this.bank.accounts[player.id] = {
                playerName: player.name,
                balance: 0,
                accountNumber: this.generateAccountNumber(),
                createdAt: Date.now(),
                savingsBalance: 0,
                creditScore: 100,
                transactions: []
            };
            return {
                success: true,
                message: `✅ Bank account created for ${player.name}`,
                account: this.bank.accounts[player.id]
            };
        }
        return { success: false, message: "❌ Account already exists!" };
    }

    generateAccountNumber() {
        return 'BANK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    deposit(player, amount) {
        const account = this.bank.accounts[player.id];

        if (!account) return { success: false, message: "❌ No bank account! Use /bank create" };
        if (player.gold < amount) return { success: false, message: "❌ Insufficient gold!" };

        player.gold -= amount;
        account.balance += amount;

        this.recordTransaction(player.id, "deposit", amount);

        return {
            success: true,
            message: `💰 Deposited ${amount}g. New balance: ${account.balance}g`
        };
    }

    withdraw(player, amount) {
        const account = this.bank.accounts[player.id];

        if (!account) return { success: false, message: "❌ No bank account! Use /bank create" };
        if (account.balance < amount) return { success: false, message: "❌ Insufficient funds!" };

        account.balance -= amount;
        player.gold += amount;

        this.recordTransaction(player.id, "withdraw", amount);

        return {
            success: true,
            message: `💸 Withdrew ${amount}g. New balance: ${account.balance}g`
        };
    }

    transfer(fromPlayer, toPlayerId, amount, note = "") {
        const fromAccount = this.bank.accounts[fromPlayer.id];
        const toAccount = this.bank.accounts[toPlayerId];

        if (!fromAccount || !toAccount) return { success: false, message: "❌ One or both accounts don't exist!" };
        if (fromAccount.balance < amount) return { success: false, message: "❌ Insufficient funds!" };

        const fee = Math.floor(amount * 0.01);
        const netAmount = amount - fee;

        fromAccount.balance -= amount;
        toAccount.balance += netAmount;

        this.recordTransaction(fromPlayer.id, "transfer_out", amount, toPlayerId, note);
        this.recordTransaction(toPlayerId, "transfer_in", netAmount, fromPlayer.id, note);

        return {
            success: true,
            message: `💱 Transferred ${amount}g to ${toAccount.playerName} (Fee: ${fee}g)`
        };
    }

    recordTransaction(playerId, type, amount, otherParty = null, note = "") {
        if (!this.bank.accounts[playerId]) return;
        const transaction = {
            id: this.bank.transactions.length + 1,
            type: type,
            amount: amount,
            otherParty: otherParty,
            note: note,
            timestamp: Date.now(),
            balance: this.bank.accounts[playerId].balance
        };
        this.bank.transactions.push(transaction);
        this.bank.accounts[playerId].transactions.push(transaction);
    }

    openSavings(player) {
        const account = this.bank.accounts[player.id];

        if (!account) return { success: false, message: "❌ Need a bank account first!" };
        if (account.savingsOpened) return { success: false, message: "❌ Savings already open!" };

        const activationFee = 1000;
        if (account.balance < activationFee) return { success: false, message: `❌ Need ${activationFee}g in bank to open savings!` };

        account.balance -= activationFee;
        account.savingsBalance = 0;
        account.savingsOpened = true;
        account.lastInterestTime = Date.now();

        return { success: true, message: `🏦 Savings account opened! 5% annual interest rate.` };
    }

    requestLoan(player, amount, installments) {
        const account = this.bank.accounts[player.id];

        if (!account) return { success: false, message: "❌ No bank account!" };
        if (amount < 100 || amount > 10000) return { success: false, message: "❌ Loan amount must be between 100g and 10,000g" };
        if (installments < 3 || installments > 24) return { success: false, message: "❌ Installments must be between 3 and 24" };

        const baseInterest = 0.03;
        const interestPerInstallment = 0.002;
        const totalInterest = baseInterest + (interestPerInstallment * (installments - 3));
        const totalOwed = Math.floor(amount * (1 + totalInterest));
        const paymentAmount = Math.floor(totalOwed / installments);

        const loan = {
            id: this.bank.loans.length + 1,
            playerId: player.id,
            principal: amount,
            totalOwed: totalOwed,
            remaining: totalOwed,
            installments: installments,
            paymentAmount: paymentAmount,
            nextPayment: Date.now() + (7 * 24 * 3600000),
            issuedAt: Date.now(),
            status: "active"
        };

        this.bank.loans.push(loan);
        account.balance += amount;

        return {
            success: true,
            message: `✅ Loan approved! Received ${amount}g. Total to repay: ${totalOwed}g in ${installments} payments of ${paymentAmount}g.`
        };
    }

    listItemForSale(player, itemId, price, quantity = 1, duration = 7) {
        const defKey = itemId.toUpperCase();
        const def = ITEM_DEFS[defKey];
        if (!def) return { success: false, message: "❌ Item not found!" };

        const removed = player.removeItem(player.inventory.find(i => i.defKey === defKey)?.id, quantity);
        if (!removed) return { success: false, message: "❌ You don't have enough of this item!" };

        const listingId = `listing_${Date.now()}_${player.id}`;

        this.shops.listings[listingId] = {
            id: listingId,
            sellerId: player.id,
            sellerName: player.name,
            itemId: defKey,
            itemName: def.name,
            quantity: quantity,
            price: price,
            listedAt: Date.now(),
            expiresAt: Date.now() + (duration * 24 * 3600000),
            status: "active"
        };

        return { success: true, message: `📦 Listed ${quantity}x ${def.name} for ${price}g each (expires in ${duration} days)` };
    }

    buyFromListing(buyer, listingId) {
        const listing = this.shops.listings[listingId];
        if (!listing || listing.status !== "active") return { success: false, message: "❌ Listing not found or expired!" };
        if (listing.sellerId === buyer.id) return { success: false, message: "❌ Can't buy your own item!" };

        const totalCost = listing.price * listing.quantity;

        const buyerAccount = this.bank.accounts[buyer.id];
        let paidFromBank = false;
        if (buyer.gold >= totalCost) {
            buyer.gold -= totalCost;
        } else if (buyerAccount && buyerAccount.balance >= totalCost) {
            buyerAccount.balance -= totalCost;
            paidFromBank = true;
            this.recordTransaction(buyer.id, "marketplace_purchase", totalCost, listing.sellerId, `Bought ${listing.itemName}`);
        } else {
            return { success: false, message: "❌ Insufficient gold!" };
        }

        const sellerAccount = this.bank.accounts[listing.sellerId];
        const marketplaceFee = Math.floor(totalCost * 0.05);
        const sellerPayout = totalCost - marketplaceFee;

        if (sellerAccount) {
            sellerAccount.balance += sellerPayout;
            this.recordTransaction(listing.sellerId, "marketplace_sale", sellerPayout, buyer.id, `Sold ${listing.itemName}`);
        } else {
            const seller = this.world.players.get(listing.sellerId);
            if (seller) seller.gold += sellerPayout;
        }

        buyer.addItem(listing.itemId, listing.quantity);
        listing.status = "sold";

        return { success: true, message: `✅ Bought ${listing.quantity}x ${listing.itemName} for ${totalCost}g.` };
    }
}

export class BankCommands {
    constructor(economy) {
        this.economy = economy;
    }

    handleCommand(player, commandStr) {
        const parts = commandStr.split(' ');
        const mainCmd = parts[0].toLowerCase();
        const subCmd = parts[1]?.toLowerCase();
        const args = parts.slice(2);

        if (mainCmd === 'bank') {
            switch (subCmd) {
                case 'create': return this.economy.createAccount(player).message;
                case 'balance': {
                    const acc = this.economy.bank.accounts[player.id];
                    return acc ? `💰 Gold: ${player.gold}g | 🏦 Bank: ${acc.balance}g | 📈 Savings: ${acc.savingsBalance}g` : "❌ No account! Use /bank create";
                }
                case 'deposit': return this.economy.deposit(player, parseInt(args[0]) || 0).message;
                case 'withdraw': return this.economy.withdraw(player, parseInt(args[0]) || 0).message;
                case 'transfer': {
                    const targetName = args[0];
                    const target = Array.from(this.economy.world.players.values()).find(p => p.name.toLowerCase() === targetName?.toLowerCase());
                    if (!target) return "❌ Player not found online!";
                    return this.economy.transfer(player, target.id, parseInt(args[1]) || 0).message;
                }
                case 'savings': return this.economy.openSavings(player).message;
                case 'loan': return this.economy.requestLoan(player, parseInt(args[0]) || 0, parseInt(args[1]) || 0).message;
                case 'history': {
                    const acc = this.economy.bank.accounts[player.id];
                    if (!acc) return "❌ No account!";
                    return "📜 Transactions:\n" + acc.transactions.slice(-5).reverse().map(t => `${t.type.toUpperCase()}: ${t.amount}g`).join('\n');
                }
            }
        } else if (mainCmd === 'shop') {
            switch (subCmd) {
                case 'offer': return this.economy.listItemForSale(player, args[0], parseInt(args[1]) || 0, parseInt(args[2]) || 1).message;
                case 'market': {
                    const list = Object.values(this.economy.shops.listings).filter(l => l.status === 'active');
                    if (list.length === 0) return "No active listings.";
                    return "📊 Market:\n" + list.map(l => `[ID: ${l.id.substring(16)}] ${l.itemName} x${l.quantity} for ${l.price}g by ${l.sellerName}`).join('\n');
                }
                case 'buy': {
                    const listId = Object.keys(this.economy.shops.listings).find(k => k.endsWith(args[0]));
                    return listId ? this.economy.buyFromListing(player, listId).message : "❌ Listing not found!";
                }
            }
        }
        return `Commands: /bank [create|balance|deposit|withdraw|transfer|savings|loan], /shop [market|offer|buy]`;
    }
}
