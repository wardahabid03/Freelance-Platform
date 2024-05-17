
document.addEventListener('DOMContentLoaded', () => {

  const urlParams = new URLSearchParams(window.location.search);
    const clientid= urlParams.get('userId');


  // Fetch client payment summary
  fetch(`/client_payment_summary/${clientid}`)
    .then(response => response.json())
    .then(summary => {
      const paymentSummary = document.getElementById('payment-summary');
      console.log(summary);
      paymentSummary.innerHTML = `
        <div class="summaryContainer">
          <div class="payment-summary">
            <p>Total Payment:${summary.TOTAL_PAYMENT}</p>
          </div>
          <div class="payment-summary">
            <p>This Month's Payment: ${summary.THIS_MONTH_PAYMENT}</p>
          </div>
          <p>Due Payment: ${summary.DUE_PAYMENTS}</p>
          </div>
        </div>
      `;
    })
    .catch(error => console.error(error));

  // Fetch due payments
  fetch(`/due_payments/${clientid}`)
    .then(response => response.json())
    .then(payments => {

  
      const paymentList = document.getElementById('payment-list');
      payments.forEach(payment => {
        const paymentItem = document.createElement('div');
        paymentItem.innerHTML = `
          <div class="paymentCard">
            <div class="paymentCardContent">
            <p>Project Name:${payment[1]}</p>
              <p>Freelancer Name:${payment[2]}</p>
              <p>Amount:${payment[3]}</p>
            </div>
            <button onclick="initiatePayment(${payment[0]},${payment[3]})">Process Payment</button>
          </div>
        `;
        paymentList.appendChild(paymentItem);
      });
    })
    .catch(error => console.error(error));

  window.initiatePayment = function(paymentId, amount) {
    // Display a modal or a form to gather payment information (e.g., payment method details)
    // For simplicity, you can use the Stripe Elements to create a payment form
    const paymentMethod = prompt('Enter payment method and verification number'); //4242 4242 4242 4242

    // Once payment details are obtained, call the processPayment function
    processPayment(paymentId, paymentMethod, amount); // Pass the payment method details as needed
    location.reload();
  };

  window.processPayment = function(paymentId, paymentMethod, amount) {
    fetch(`/processing_Payments/${paymentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentMethod }, { amount }),
    })
      .then(response => response.json())
      .then(result => {
        console.log(result);
        location.reload;
      })
      .catch(error => console.error(error));
  };
});

