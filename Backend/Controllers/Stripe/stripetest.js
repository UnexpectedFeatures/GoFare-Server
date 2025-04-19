import stripe from "../../Services/stripe.js";

async function transferToCustomer() {
  try {
    const transfer = await stripe.transfers.create({
      amount: 100, 
      currency: "usd",
      destination: "cus_S95f2i3dJjOoKI", 
      description: "Transfer of $1 USD to customer",
    });

    console.log("Transfer successful:", transfer.id);
    return transfer;
  } catch (error) {
    console.error("Error creating transfer:", error);
    throw error;
  }
}

transferToCustomer();
