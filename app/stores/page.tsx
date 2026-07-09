import { StoreDirectory } from '@/components/catalog/store-directory';
import { getNetworkStores, getStorefrontAbout } from '@/lib/provider';

export default async function StoresPage() {
  const [about, stores] = await Promise.all([
    getStorefrontAbout().catch(() => null),
    getNetworkStores().catch(() => [])
  ]);

  return (
    <section className="container" style={{ padding: '32px 0 56px' }}>
      <div className="section-title">
        <div>
          <h1>{about?.is_network ? 'Marketplace stores' : 'Stores'}</h1>
          <p className="muted">Browse storefronts available in this Fleetbase Storefront network.</p>
        </div>
      </div>
      <StoreDirectory stores={stores} />
      {stores.length === 0 && <p className="muted">No stores are available yet.</p>}
    </section>
  );
}
