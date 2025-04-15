import { useEffect, useRef } from 'react';

export default function PayPalButton({ amount, onSuccess }) {
  const paypalRef = useRef();

  useEffect(() => {
    window.paypal.Buttons({
      style: {
        layout: 'horizontal',
        color: 'blue',
        shape: 'pill',
        label: 'paypal'
      },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amount.toString()
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        const details = await actions.order.capture();
        onSuccess(details); // Call your parent with PayPal data
      },
      onError: (err) => {
        console.error('PayPal Checkout onError', err);
        alert('An error occurred with PayPal.');
      }
    }).render(paypalRef.current);
  }, [amount, onSuccess]);

  return <div ref={paypalRef} />;
}
