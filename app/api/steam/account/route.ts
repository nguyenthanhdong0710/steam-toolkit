import { NextResponse } from 'next/server';
import { getAccountSummary } from '../../../../lib/steam-client';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeSensitive = url.searchParams.get('includeSensitive') === 'true';
    const includeOwnedApps = url.searchParams.get('includeOwnedApps') === 'true';
    const includeFriendsList = url.searchParams.get('includeFriendsList') === 'true';
    const includeGroupsList = url.searchParams.get('includeGroupsList') === 'true';
    const includeInventory = url.searchParams.get('includeInventory') === 'true';

    const account = await getAccountSummary({
      includeSensitive,
      includeOwnedApps,
      includeFriendsList,
      includeGroupsList,
      includeInventory,
    });

    return NextResponse.json({ ok: true, account });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
