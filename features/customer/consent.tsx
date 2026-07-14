'use client';

import Link from 'next/link';

/** Age (18+) and Terms/Privacy consent checkboxes — required before account
 *  creation and at checkout (age-restricted goods such as alcohol). */
export function ConsentChecks({
  age, setAge, terms, setTerms, showTerms = true,
}: {
  age: boolean; setAge: (v: boolean) => void;
  terms: boolean; setTerms: (v: boolean) => void;
  showTerms?: boolean;
}) {
  const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.4 };
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label style={row}>
        <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
        <span>I confirm I am <strong>18 years of age or older</strong>.</span>
      </label>
      {showTerms && (
        <label style={row}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
          <span>
            I agree to the{' '}
            <Link href="/terms" target="_blank" style={{ color: 'var(--primary)' }}>Terms &amp; Conditions</Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" style={{ color: 'var(--primary)' }}>Privacy &amp; Data Policy</Link>.
          </span>
        </label>
      )}
    </div>
  );
}
