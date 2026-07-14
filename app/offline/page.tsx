export const metadata = { title: 'Offline' };

export default function OfflinePage() {
  return (
    <section className="container" style={{ padding: '64px 0', maxWidth: 480, textAlign: 'center' }}>
      <h1>You’re offline</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        We couldn’t reach the store. Check your connection and try again — pages you’ve
        already visited are still available.
      </p>
    </section>
  );
}
