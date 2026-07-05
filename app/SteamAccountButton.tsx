"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SteamAccountButton() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  async function fetchAccount() {
    setLoading(true);
    try {
      const res = await fetch('/api/steam/account');
      const json = await res.json();
      setData(json);
    } catch (e) {
      setData({ ok: false, error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={fetchAccount} disabled={loading}>
        {loading ? 'Loading…' : 'Fetch Steam Account'}
      </Button>
      {data && (
        <pre className="mt-4 max-w-xl overflow-auto text-xs bg-zinc-100 p-3 rounded text-black">{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
