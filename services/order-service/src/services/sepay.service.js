const { SePayPgClient } = require('sepay-pg-node');

class SePayService {
  constructor() {
    this.env = process.env.SEPAY_ENV || 'sandbox';
    this.merchantId = process.env.SEPAY_MERCHANT_ID;
    this.secretKey = process.env.SEPAY_SECRET_KEY;
    this.returnUrl = process.env.SEPAY_RETURN_URL;

    console.log('================ SEPAY INIT ================');
    console.log('env =', this.env);
    console.log('merchantId =', this.merchantId || '(missing)');
    console.log('secretKey exists =', !!this.secretKey);
    console.log('secretKey length =', this.secretKey ? this.secretKey.length : 0);
    console.log('returnUrl =', this.returnUrl || '(missing)');
    console.log('============================================');

    if (!this.merchantId) {
      throw new Error('SEPAY_MERCHANT_ID is missing');
    }

    if (!this.secretKey) {
      throw new Error('SEPAY_SECRET_KEY is missing');
    }

    if (!this.returnUrl) {
      throw new Error('SEPAY_RETURN_URL is missing');
    }

    this.client = new SePayPgClient({
      env: this.env,
      merchant_id: this.merchantId,
      secret_key: this.secretKey,
    });
  }

  createPayment(orderId, amount, orderCode) {
    try {
      const safeAmount = Number(Math.round(Number(amount)));
      const safeOrderCode = String(orderCode || '').trim();

      if (!safeOrderCode) {
        throw new Error('orderCode is required');
      }

      if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
        throw new Error(`Invalid SePay amount: ${amount}`);
      }

      const fields = this.client.checkout.initOneTimePaymentFields({
        operation: 'PURCHASE',
        payment_method: 'BANK_TRANSFER',
        order_invoice_number: safeOrderCode,
        order_amount: safeAmount,
        currency: 'VND',
        order_description: `Thanh toan don hang ${safeOrderCode}`,
        success_url: `${this.returnUrl}?success=true&order=${encodeURIComponent(safeOrderCode)}&method=sepay`,
        cancel_url: `${this.returnUrl}?success=false&order=${encodeURIComponent(safeOrderCode)}&method=sepay`,
        error_url: `${this.returnUrl}?success=false&order=${encodeURIComponent(safeOrderCode)}&method=sepay`,
        custom_data: JSON.stringify({
          orderId: String(orderId || ''),
          orderCode: safeOrderCode
        })
      });

      const checkoutUrl = this.client.checkout.initCheckoutUrl();

      console.log('================ SEPAY CREATE PAYMENT ================');
      console.log('orderId =', orderId);
      console.log('orderCode =', safeOrderCode);
      console.log('amount(raw) =', amount);
      console.log('amount(safe) =', safeAmount);
      console.log('checkoutUrl =', checkoutUrl);
      console.log('fields =', JSON.stringify(fields, null, 2));
      console.log('======================================================');

      return {
        fields,
        checkoutUrl,
        orderCode: safeOrderCode
      };
    } catch (error) {
      console.error('❌ SePay createPayment error:', error);
      throw error;
    }
  }

  generatePaymentForm(orderId, amount, orderCode) {
    const paymentData = this.createPayment(orderId, amount, orderCode);

    let html = `<!DOCTYPE html>
    <html>
    <head><title>Đang chuyển hướng thanh toán...</title></head>
    <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif">
      <div style="text-align:center">
        <h2>⏳ Đang chuyển hướng đến cổng thanh toán SePay...</h2>
        <p>Vui lòng không tắt trình duyệt.</p>
        <form id="sepay-form" action="${paymentData.checkoutUrl}" method="POST">`;

    Object.entries(paymentData.fields).forEach(([key, value]) => {
      html += `<input type="hidden" name="${key}" value="${String(value)}" />`;
    });

    html += `</form>
        <script>document.getElementById('sepay-form').submit();</script>
      </div>
    </body>
    </html>`;

    return html;
  }

  handleIPN(data) {
    console.log('📩 SePay IPN data:', JSON.stringify(data, null, 2));

    if (data.notification_type === 'ORDER_PAID') {
      const orderInvoiceNumber = data.order?.order_invoice_number;
      const transactionStatus = data.transaction?.transaction_status;
      const transactionAmount = parseFloat(data.transaction?.transaction_amount);

      return {
        success: transactionStatus === 'APPROVED',
        orderCode: orderInvoiceNumber,
        amount: transactionAmount,
        transactionId: data.transaction?.transaction_id,
        paymentMethod: data.transaction?.payment_method
      };
    }

    return { success: false };
  }
}

module.exports = new SePayService();
