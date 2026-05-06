/**
 * /api/sync
 * Syncs race results + driver consistency scores from Jolpica → Supabase.
 * Can be called manually, or scheduled via a cron service.
 * Protected by CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

const supa = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
    : null;

async function jolpica(path: string) {
    const r = await fetch(`${JOLPICA_BASE}${path}`, { next: { revalidate: 0 } });
    if (!r.ok) throw new Error(`Jolpica ${r.status}`);
    return (await r.json()).MRData;
}

export async function GET(req: NextRequest) {
    // Optional auth guard
    const secret = req.nextUrl.searchParams.get('secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supa) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const yearStr = req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear() - 1);
    const year = parseInt(yearStr);

    const log: string[] = [];

    try {
        // ── 1. Sync race + sprint results ────────────────────────
        log.push(`Fetching ${year} race results...`);
        const [raceData, sprintData] = await Promise.all([
            jolpica(`/${year}/results.json?limit=1000`),
            jolpica(`/${year}/sprint.json?limit=1000`).catch(() => ({ RaceTable: { Races: [] } }))
        ]);

        const raceList = (raceData as any).RaceTable.Races;
        const sprintList = (sprintData as any).RaceTable.Races;
        const allRaces = [...raceList, ...sprintList];

        const resultRows: any[] = [];
        const driverMap = new Map<string, { code: string; name: string; constructorId: string; constructorName: string; positions: number[]; dnfs: number }>();

        for (const race of allRaces) {
            const isSprint = !race.Results && race.SprintResults;
            const results = isSprint ? race.SprintResults : race.Results;
            const winner = results?.[0];
            const p2 = results?.[1];
            const p3 = results?.[2];
            const rnd = parseInt(race.round);

            for (const res of results ?? []) {
                const pos = parseInt(res.position);
                const isDNF = isNaN(pos) || !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'].includes(res.positionText);
                const drvId = res.Driver.driverId;
                const code = res.Driver.code ?? res.Driver.familyName.slice(0, 3).toUpperCase();
                const name = `${res.Driver.givenName} ${res.Driver.familyName}`;

                resultRows.push({
                    year,
                    round: rnd,
                    race_name: race.raceName + (isSprint ? " (Sprint)" : ""),
                    driver_code: code,
                    driver_name: name,
                    constructor_id: res.Constructor.constructorId,
                    constructor_name: res.Constructor.name,
                    position: isDNF ? 20 : pos,
                    points: parseFloat(res.points) || 0,
                    status: res.status,
                    winner_name: winner ? `${winner.Driver.givenName} ${winner.Driver.familyName}` : '',
                    p2_name: p2 ? `${p2.Driver.givenName} ${p2.Driver.familyName}` : '',
                    p3_name: p3 ? `${p3.Driver.givenName} ${p3.Driver.familyName}` : '',
                    winner_pts: winner ? parseInt(winner.points) : null,
                    p2_pts: p2 ? parseInt(p2.points) : null,
                    p3_pts: p3 ? parseInt(p3.points) : null,
                    is_sprint: isSprint
                });

                // Aggregate for consistency
                if (!driverMap.has(drvId)) {
                    driverMap.set(drvId, { code, name, constructorId: res.Constructor.constructorId, constructorName: res.Constructor.name, positions: [], dnfs: 0 });
                }
                const entry = driverMap.get(drvId)!;
                if (isDNF) { entry.dnfs++; entry.positions.push(20); }
                else entry.positions.push(pos);
            }
        }

        // Batch upsert race results
        const chunkSize = 100;
        for (let i = 0; i < resultRows.length; i += chunkSize) {
            const chunk = resultRows.slice(i, i + chunkSize);
            const { error } = await supa.from('race_results_history')
                .upsert(chunk, { onConflict: 'year,round,driver_code,is_sprint' });
            if (error) log.push(`Results upsert warning: ${error.message}`);
        }
        log.push(`✓ Synced ${resultRows.length} total session rows (Races + Sprints)`);

        // ── 2. Compute + sync consistency scores ─────────────────
        log.push('Computing consistency scores...');
        const MAX_POS = 20;
        const consistencyRows = [];

        for (const [driverId, entry] of driverMap.entries()) {
            const last10 = entry.positions.slice(-10);
            if (!last10.length) continue;
            const avg = last10.reduce((a, b) => a + b, 0) / last10.length;
            const score = Math.max(0, Math.min(100, ((MAX_POS - avg) / (MAX_POS - 1)) * 100));

            consistencyRows.push({
                driver_id: driverId,
                driver_code: entry.code,
                driver_name: entry.name,
                constructor_id: entry.constructorId,
                constructor_name: entry.constructorName,
                season: year,
                avg_position: parseFloat(avg.toFixed(2)),
                consistency_score: parseFloat(score.toFixed(1)),
                wins: entry.positions.filter(p => p === 1).length,
                podiums: entry.positions.filter(p => p <= 3 && p >= 1).length,
                dnfs: entry.dnfs,
                races: entry.positions.length,
                recent_form: last10,
                updated_at: new Date().toISOString(),
            });
        }

        const { error: dcErr } = await supa
            .from('driver_consistency')
            .upsert(consistencyRows, { onConflict: 'driver_id' });
        if (dcErr) log.push(`Consistency upsert warning: ${dcErr.message}`);
        else log.push(`✓ Synced ${consistencyRows.length} driver consistency scores`);

        return NextResponse.json({
            ok: true,
            year,
            races: raceList.length,
            results: resultRows.length,
            drivers: consistencyRows.length,
            log,
        });

    } catch (e) {
        return NextResponse.json({ ok: false, error: String(e), log }, { status: 500 });
    }
}
