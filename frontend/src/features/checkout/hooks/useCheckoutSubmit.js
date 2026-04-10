import { useState } from 'react';
import { CardElement } from '@stripe/react-stripe-js';

const API = 'http://localhost:3004/api/orders';
const authHeader = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

export const useCheckoutSubmit = (deps) => {
  const {
    formData, cart, subtotal, shippingFee, finalTotal, discountAmount,
    appliedDiscount, navigate, stripe, elements,
    checkoutItems, isBuyNow, isPartialCart, removeFromCart, clearCart,
    saveAddress   // ← từ useAddressBook
  } = deps;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dọn giỏ hàng sau thanh toán
  const handlePostPayment = async () => {
    if (isBuyNow) return;
    if (isPartialCart && checkoutItems?.length > 0) {
      for (const item of checkoutItems) {
        if (item.productId) await removeFromCart(item.productId);
      }
    } else {
      await clearCart();
    }
  };

  // Tạo đơn hàng trên server
  const createOrder = async (paymentMethodType) => {
    const res = await fetch(`${API}/create`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        ...formData,
        items: checkoutItems,
        subtotal,
        shippingFee,
        total: finalTotal,
        paymentMethod: paymentMethodType,
        discountCode: appliedDiscount?.discount?.code,
        discountAmount,
        reservationId: cart.reservationId
      })
    });
    return res.json();
  };

  // ─── COD ─────────────────────────────────────────────────────────────────
  const handleCodPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await createOrder('cod');
      if (result.success) {
        await handlePostPayment();
        saveAddress?.(formData);
        navigate(`/checkout/success?success=true&order=${result.data.orderCode}&method=cod`);
      } else {
        setError(result.message || 'Đặt hàng thất bại');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── STRIPE ──────────────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    try {
      const orderResult = await createOrder('stripe');
      if (!orderResult.success) throw new Error(orderResult.message);
      const order = orderResult.data;

      const paymentRes = await fetch(`${API}/create-stripe-payment`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ orderId: order.id, amount: finalTotal })
      });
      const paymentResult = await paymentRes.json();
      if (!paymentResult.success) throw new Error(paymentResult.message);

      const { error: stripeError } = await stripe.confirmCardPayment(
        paymentResult.data.clientSecret,
        { payment_method: { card: elements.getElement(CardElement), billing_details: { name: formData.customerName, email: formData.email } } }
      );
      if (stripeError) throw new Error(stripeError.message);

      await fetch(`${API}/verify-stripe`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ orderId: order.id })
      });

      await handlePostPayment();
      saveAddress?.(formData);
      navigate(`/checkout/success?success=true&order=${order.orderCode}&method=stripe`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── SEPAY ───────────────────────────────────────────────────────────────
  const handleSePayPayment = async () => {
    setLoading(true);
    setError('');
    try {
      const orderResult = await createOrder('sepay');
      if (!orderResult.success) throw new Error(orderResult.message);
      const order = orderResult.data;

      const paymentRes = await fetch(`${API}/create-sepay-payment`, {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({
          orderId: order.id,
          amount: Math.round(Number(finalTotal)),
          orderCode: order.orderCode
        })
      });
      const paymentResult = await paymentRes.json();

      if (paymentResult.success) {
        // SePay: lưu địa chỉ TRƯỚC khi redirect (vì user sẽ rời trang)
        saveAddress?.(formData);    // Lưu trước khi redirect
        // SePay sẽ redirect về: /checkout/success?success=true&order=...&method=sepay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentResult.data.checkoutUrl;
        form.style.display = 'none';
        Object.entries(paymentResult.data.fields).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden'; input.name = key; input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      } else {
        throw new Error('Không thể tạo thanh toán SePay');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const submitOrder = async (paymentMethod) => {
    switch (paymentMethod) {
      case 'cod':    await handleCodPayment();    break;
      case 'stripe': await handleStripePayment(); break;
      case 'sepay':  await handleSePayPayment();  break;
      default: setError('Phương thức thanh toán không hợp lệ');
    }
  };

  return { loading, error, submitOrder };
};
