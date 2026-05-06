// F1 API Service - Uses Jolpica (Ergast successor) and OpenF1 APIs

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const OPENF1_BASE = 'https://api.openf1.org/v1';
const PITSTOP_API_BASE = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8888'; // FastAPI backend

// ====== TYPES ======
export interface Race {
    season: string;
    round: string;
    raceName: string;
    Circuit: Circuit;
    date: string;
    time?: string;
    FirstPractice?: SessionTime;
    SecondPractice?: SessionTime;
    ThirdPractice?: SessionTime;
    Qualifying?: SessionTime;
    Sprint?: SessionTime;
    Results?: RaceResult[];
}

export interface Circuit {
    circuitId: string;
    circuitName: string;
    url: string;
    Location: {
        lat: string;
        long: string;
        locality: string;
        country: string;
    };
}

export interface SessionTime {
    date: string;
    time?: string;
}

export interface Driver {
    driverId: string;
    permanentNumber: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
}

export interface Constructor {
    constructorId: string;
    name: string;
    nationality: string;
    url: string;
}

export interface DriverStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Driver: Driver;
    Constructors: Constructor[];
}

export interface ConstructorStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Constructor: Constructor;
}

export interface RaceResult {
    number: string;
    position: string;
    positionText: string;
    points: string;
    Driver: Driver;
    Constructor: Constructor;
    grid: string;
    laps: string;
    status: string;
    Time?: { millis: string; time: string };
    FastestLap?: {
        rank: string;
        lap: string;
        Time: { time: string };
        AverageSpeed: { units: string; speed: string };
    };
}

export interface QualifyingResult {
    number: string;
    position: string;
    Driver: Driver;
    Constructor: Constructor;
    Q1?: string;
    Q2?: string;
    Q3?: string;
}

// ====== API FUNCTIONS  ======

async function fetchJolpica(endpoint: string) {
    const response = await fetch(`${JOLPICA_BASE}${endpoint}`, {
        next: { revalidate: 300 } // Cache for 5 minutes
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.MRData;
}

// Get current season race schedule
export async function getRaceSchedule(season: string = 'current'): Promise<Race[]> {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/api/calendar/${season}`);
        if (response.ok) {
            return await response.json();
        }

        // Fallback to traditional Jolpica API if backend is unavailable
        const data = await fetchJolpica(`/${season}.json`);
        return data.RaceTable.Races;
    } catch (error) {
        console.error('Error fetching race schedule:', error);
        return [];
    }
}

// Get driver standings
export async function getDriverStandings(season: string = 'current'): Promise<DriverStanding[]> {
    try {
        const data = await fetchJolpica(`/${season}/driverstandings.json`);
        return data.StandingsTable.StandingsLists[0]?.DriverStandings || [];
    } catch (error) {
        console.error('Error fetching driver standings:', error);
        return [];
    }
}

// Get constructor standings
export async function getConstructorStandings(season: string = 'current'): Promise<ConstructorStanding[]> {
    try {
        const data = await fetchJolpica(`/${season}/constructorstandings.json`);
        return data.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
    } catch (error) {
        console.error('Error fetching constructor standings:', error);
        return [];
    }
}

// Get race results
export async function getRaceResults(season: string = '2026', round?: string): Promise<Race[]> {
    const targetSeason = season === 'current' ? new Date().getFullYear().toString() : season;

    // If it's 2026, try live API first, then fallback to mock calendar
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/api/calendar/${targetSeason}`);
        if (response.ok) {
            const races = await response.json();
            return round ? races.filter((r: Race) => r.round === round) : races;
        }

        const endpoint = round
            ? `/${targetSeason}/${round}/results.json`
            : `/${targetSeason}/results.json?limit=1000`;
        const data = await fetchJolpica(endpoint);
        return data.RaceTable.Races;
    } catch (error) {
        console.error('Error fetching race results:', error);
        return [];
    }
}

// Get qualifying results
export async function getQualifyingResults(season: string, round: string): Promise<QualifyingResult[]> {
    try {
        const data = await fetchJolpica(`/${season}/${round}/qualifying.json`);
        return data.RaceTable.Races[0]?.QualifyingResults || [];
    } catch (error) {
        console.error('Error fetching qualifying results:', error);
        return [];
    }
}

// Get fastest laps for a season
export async function getFastestLaps(season: string = '2026'): Promise<Race[]> {
    const targetSeason = season === 'current' ? new Date().getFullYear().toString() : season;

    try {
        const data = await fetchJolpica(`/${targetSeason}/fastest/1/results.json`);
        return data.RaceTable.Races || [];
    } catch (error) {
        console.error('Error fetching fastest laps:', error);
        return [];
    }
}

// Get circuit info
export async function getCircuitInfo(circuitId: string): Promise<Circuit | null> {
    try {
        const data = await fetchJolpica(`/circuits/${circuitId}.json`);
        return data.CircuitTable.Circuits[0] || null;
    } catch (error) {
        console.error('Error fetching circuit info:', error);
        return null;
    }
}

// Get all circuits
export async function getAllCircuits(): Promise<Circuit[]> {
    try {
        const data = await fetchJolpica('/current/circuits.json');
        return data.CircuitTable.Circuits;
    } catch (error) {
        console.error('Error fetching circuits:', error);
        return [];
    }
}

// Get last race results
export async function getLastRaceResults(): Promise<Race | null> {
    try {
        const data = await fetchJolpica('/current/last/results.json');
        return data.RaceTable.Races[0] || null;
    } catch (error) {
        console.error('Error fetching last race results:', error);
        return null;
    }
}

// Get lap times for a specific race
export async function getLapTimes(season: string, round: string, lap: string): Promise<unknown> {
    try {
        const data = await fetchJolpica(`/${season}/${round}/laps/${lap}.json`);
        return data.RaceTable.Races[0];
    } catch (error) {
        console.error('Error fetching lap times:', error);
        return null;
    }
}

// ====== OpenF1 API - Live Data (High Performance) ======

async function fetchOpenF1(endpoint: string, params: Record<string, string | number> = {}) {
    const url = new URL(`${OPENF1_BASE}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
    });

    try {
        const response = await fetch(url.toString(), {
            next: { revalidate: 10 } // Fast update: 10 seconds
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error(`OpenF1 Error (${endpoint}):`, error);
        return [];
    }
}

export interface LiveTimingData {
    driver_number: number;
    meeting_key: number;
    session_key: number;
    date: string;
    [key: string]: unknown;
}

export interface SessionInfo {
    session_key: number;
    session_name: string;
    session_type: string;
    meeting_key: number;
    date_start: string;
    date_end: string;
    location: string;
    country_name: string;
    circuit_short_name: string;
}

// Get latest session info
export async function getLatestSession(): Promise<SessionInfo | null> {
    const data = await fetchOpenF1('/sessions', { session_key: 'latest' });
    return data[0] || null;
}

// Get live driver positions
export async function getLivePositions(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/position', { session_key: sessionKey });
}

// Get live weather data
export async function getLiveWeather(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/weather', { session_key: sessionKey });
}

// Get stint data (tyre usage)
export async function getStints(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/stints', { session_key: sessionKey });
}

// Get car telemetry (Speed, RPM, Gear) - The "FastF1" style data
export async function getCarData(sessionKey: number | 'latest' = 'latest', driverNumber?: number): Promise<unknown[]> {
    const params: Record<string, string | number> = { session_key: sessionKey };
    if (driverNumber) params.driver_number = driverNumber;
    return await fetchOpenF1('/car_data', params);
}

// Get lap intervals (Gaps between drivers)
export async function getIntervalData(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/intervals', { session_key: sessionKey });
}

// Get pit stop details
export async function getPitData(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/pit', { session_key: sessionKey });
}

// Get driver list
export async function getOpenF1Drivers(sessionKey: number | 'latest' = 'latest'): Promise<unknown[]> {
    return await fetchOpenF1('/drivers', { session_key: sessionKey });
}

// ------ FAST API FOR LIVE PREDICTIONS ------
export async function getFastPredict(year: number, gp: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/predict/race/${year}/${gp}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('FastAPI Error:', error);
        return { error: 'Simulation engine warming up...', fallback: true };
    }
}

export async function getLiveRecords(year: number, gp: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/predict/race/${year}/${gp}`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.predictions || [];
    } catch (error) {
        return [];
    }
}

export async function getFastResults(year: number, gp: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/results/${year}/${gp}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('FastAPI Error:', error);
        return null;
    }
}

export async function compareTelemetry(year: number, gp: string, d1: string, d2: string) {
    try {
        const response = await fetch(`${PITSTOP_API_BASE}/telemetry/compare/${year}/${gp}/${d1}/${d2}`);
        if (!response.ok) throw new Error('API offline');
        return await response.json();
    } catch (error) {
        console.error('Comparison Error:', error);
        return null;
    }
}
