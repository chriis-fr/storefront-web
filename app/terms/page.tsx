export const metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <section className="container" style={{ padding: '40px 0 64px', maxWidth: 760 }}>
      <h1>Terms &amp; Conditions</h1>
      <div className="stack" style={{ gap: 16, marginTop: 16, lineHeight: 1.6 }}>
        <p className="muted">Please read these terms carefully before placing an order.</p>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Age restriction</h2>
          <p>Some products (including alcohol) are restricted to customers aged <strong>18 years or older</strong>.
            By creating an account and placing an order you confirm that you meet this age requirement.
            Valid ID may be requested on collection or delivery, and orders may be refused where age
            cannot be verified.</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Orders &amp; payment</h2>
          <p>Prices are shown at checkout. Payment is taken via the methods offered at checkout
            (M-Pesa, bank transfer, or as available). An order is confirmed once payment is received.</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Fulfilment</h2>
          <p>Pickup and delivery are arranged by the store. Delivery times are estimates.</p>
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          This is a template. Replace it with your store’s full terms before going live.
        </p>
      </div>
    </section>
  );
}
