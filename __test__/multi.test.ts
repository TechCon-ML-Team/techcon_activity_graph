import { Fetcher } from '../src/fetcher';
import axios from 'axios';

jest.mock('axios');

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

const makeViewerResponse = (dates: string[], counts: number[]) => ({
    data: {
        data: {
            viewer: {
                name: 'TestUser',
                contributionsCollection: {
                    contributionCalendar: {
                        weeks: [
                            {
                                contributionDays: dates.map((date, i) => ({
                                    date,
                                    contributionCount: counts[i],
                                })),
                            },
                        ],
                    },
                },
            },
        },
        errors: undefined,
    },
});

const makeErrorResponse = (type = 'UNAUTHORIZED') => ({
    data: {
        errors: [{ type, message: 'Bad credentials' }],
    },
});

describe('Fetcher.fetchAllContributions', () => {
    const SAVED_ENV = process.env;

    beforeEach(() => {
        process.env = { ...SAVED_ENV };
        Object.keys(process.env)
            .filter((k) => k.startsWith('TOKEN_'))
            .forEach((k) => delete process.env[k]);
    });

    afterEach(() => {
        process.env = SAVED_ENV;
        jest.clearAllMocks();
    });

    it('returns error string when no TOKEN_* vars are configured', async () => {
        const result = await Fetcher.fetchAllContributions(31);
        expect(typeof result).toBe('string');
        expect(result as string).toMatch(/No TOKEN_/);
    });

    it('aggregates contributions from two tokens by date', async () => {
        process.env.TOKEN_user1 = 'token1';
        process.env.TOKEN_user2 = 'token2';

        // Both calls return the same data: user1 and user2 each contribute [3, 2, 5]
        mockedAxios.mockResolvedValue(
            makeViewerResponse(
                ['2026-03-15', '2026-03-16', '2026-03-17'],
                [3, 2, 5],
            ) as any,
        );

        const result = await Fetcher.fetchAllContributions(31);

        expect(typeof result).toBe('object');
        if (typeof result === 'object') {
            expect(result.name).toBe('TechCon-ML-Team');
            // Each date doubled: 3+3=6, 2+2=4, 5+5=10
            const counts = result.contributions.map((c) => c.contributionCount);
            expect(counts).toContain(6);
            expect(counts).toContain(4);
            expect(counts).toContain(10);
        }
    });

    it('uses day-of-month as chart label', async () => {
        process.env.TOKEN_user1 = 'token1';

        mockedAxios.mockResolvedValue(
            makeViewerResponse(['2026-03-17'], [5]) as any,
        );

        const result = await Fetcher.fetchAllContributions(31);

        expect(typeof result).toBe('object');
        if (typeof result === 'object') {
            expect(result.contributions[0].date).toBe('17');
        }
    });

    it('succeeds with partial data when one token returns an API error', async () => {
        process.env.TOKEN_good = 'good_token';
        process.env.TOKEN_bad = 'bad_token';

        mockedAxios
            .mockResolvedValueOnce(makeViewerResponse(['2026-03-17'], [7]) as any)
            .mockResolvedValueOnce(makeErrorResponse() as any);

        const result = await Fetcher.fetchAllContributions(31);

        // Should still return data from the good token
        expect(typeof result).toBe('object');
        if (typeof result === 'object') {
            expect(result.contributions.some((c) => c.contributionCount === 7)).toBe(true);
        }
    });

    it('returns error string when all tokens fail', async () => {
        process.env.TOKEN_bad = 'bad_token';

        mockedAxios.mockResolvedValue(makeErrorResponse() as any);

        const result = await Fetcher.fetchAllContributions(31);
        expect(typeof result).toBe('string');
    });
});
