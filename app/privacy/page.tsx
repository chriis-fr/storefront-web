export const metadata = { title: 'Privacy & Data Policy' };

export default function PrivacyPage() {
  return (
    <section className="container" style={{ padding: '40px 0 64px', maxWidth: 760 }}>
      <h1>Privacy &amp; Data Policy</h1>
      <div className="stack" style={{ gap: 16, marginTop: 16, lineHeight: 1.6 }}>
        <p className="muted">How we handle the information you give us when you order.</p>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>What we collect</h2>
          <p>Your name, phone number, email (if provided), delivery address, saved M-Pesa number,
            and your order and payment history. We record your consent (age confirmation and
            acceptance of these terms) with a timestamp.</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>How we use it</h2>
          <p>To process and deliver your orders, take payment, keep your order history and receipts,
            and contact you about your orders. We do not sell your personal data.</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Your choices</h2>
          <p>You can edit your saved details (name, addresses, M-Pesa number) in your account,
            and request removal of your account by contacting the store.</p>
        </div>

        <p className="muted" style={{ fontSize: 13 }}>
          This is a template. Replace it with your store’s full privacy policy before going live.
        </p>
      </div>
    </section>
  );
}
