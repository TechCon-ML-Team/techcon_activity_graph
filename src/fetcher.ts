import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import moment from 'moment';
import { Query, UserDetails, Week, ContributionDay, ResponseOfApi } from 'src/interfaces/interface';

dotenv.config();

interface ViewerApiResponse {
    data?: {
        viewer: {
            name: string;
            contributionsCollection: {
                contributionCalendar: {
                    weeks: Array<Week>;
                };
            };
        };
    };
    errors?: Array<{ message: string; type: string }>;
}

export class Fetcher {
    private readonly username: string;
    constructor(username: string) {
        this.username = username;
    }

    private getGraphQLQuery(from: string, to: string) {
        return {
            query: `
              query userInfo($LOGIN: String!, $FROM: DateTime!, $TO: DateTime!) {
                user(login: $LOGIN) {
                  name
                  contributionsCollection(from: $FROM, to: $TO) {
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: {
                LOGIN: this.username,
                FROM: from,
                TO: to,
            },
        };
    }

    private async fetch(graphQLQuery: Query): Promise<AxiosResponse<ResponseOfApi>> {
        return axios({
            url: 'https://api.github.com/graphql',
            method: 'POST',
            headers: {
                Authorization: `bearer ${process.env.TOKEN}`,
            },
            data: graphQLQuery,
        });
    }

    // --- Multi-user support ---

    private getViewerGraphQLQuery(from: string, to: string) {
        return {
            query: `
              query viewerInfo($FROM: DateTime!, $TO: DateTime!) {
                viewer {
                  name
                  contributionsCollection(from: $FROM, to: $TO) {
                    contributionCalendar {
                      weeks {
                        contributionDays {
                          contributionCount
                          date
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: { FROM: from, TO: to },
        };
    }

    private async fetchRawContributions(
        token: string,
        from: string,
        to: string,
    ): Promise<Array<{ date: string; contributionCount: number }> | string> {
        try {
            const response = await axios({
                url: 'https://api.github.com/graphql',
                method: 'POST',
                headers: { Authorization: `bearer ${token}` },
                data: this.getViewerGraphQLQuery(from, to),
            });
            const body: ViewerApiResponse = response.data;

            if (body.errors) {
                console.error('Viewer API Error:', body.errors);
                if (body.errors[0].type === 'RATE_LIMITED') {
                    return '💥 API rate limit exceeded.';
                }
                return 'Failed to fetch viewer contributions';
            }

            if (!body.data?.viewer) {
                return 'Invalid viewer response';
            }

            const weeks = body.data.viewer.contributionsCollection.contributionCalendar.weeks;
            const days: Array<{ date: string; contributionCount: number }> = [];
            weeks.forEach((week: Week) =>
                week.contributionDays.forEach((day: ContributionDay) => {
                    days.push({ date: day.date, contributionCount: day.contributionCount });
                }),
            );
            return days;
        } catch (error) {
            console.error('fetchRawContributions error:', error);
            return 'Network error fetching contributions';
        }
    }

    public static async fetchAllContributions(
        days: number,
        customFromDate?: string,
        customToDate?: string,
    ): Promise<UserDetails | string> {
        let from = '',
            to = '';
        if (customFromDate && customToDate) {
            from = moment(customFromDate).utc().toISOString(true);
            to = moment(customToDate).utc().toISOString(true);
        } else {
            const now = moment();
            from = moment(now).subtract(days, 'days').utc().toISOString();
            to = moment(now).add(1, 'days').utc().toISOString();
        }

        const tokens = Object.entries(process.env)
            .filter(([key]) => key.startsWith('TOKEN_'))
            .map(([, value]) => value as string)
            .filter(Boolean);

        if (tokens.length === 0) {
            return 'No TOKEN_* environment variables configured';
        }

        const instance = new Fetcher('');
        const rawResults = await Promise.all(
            tokens.map((token) => instance.fetchRawContributions(token, from, to)),
        );

        const countByDate = new Map<string, number>();
        let hasData = false;

        for (const result of rawResults) {
            if (typeof result === 'string') {
                console.error('Token fetch failed:', result);
                continue;
            }
            hasData = true;
            for (const day of result) {
                countByDate.set(day.date, (countByDate.get(day.date) ?? 0) + day.contributionCount);
            }
        }

        if (!hasData) {
            return 'Failed to fetch contributions from any configured token';
        }

        const sorted = Array.from(countByDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, contributionCount]) => ({ date, contributionCount }));

        if (!(customFromDate && customToDate)) {
            if (sorted.length > 0 && sorted[sorted.length - 1].contributionCount === 0) {
                sorted.pop();
            }
            const extra = sorted.length - days;
            if (extra > 0) sorted.splice(0, extra);
        }

        const contributions = sorted.map(({ date, contributionCount }) => ({
            date: moment(date, moment.ISO_8601).date().toString(),
            contributionCount,
        }));

        return { contributions, name: 'TechCon-ML-Team' };
    }

    public async fetchContributions(
        days: number,
        customFromDate?: string,
        customToDate?: string,
    ): Promise<UserDetails | string> {
        let from = '',
            to = '';
        if (customFromDate && customToDate) {
            from = moment(customFromDate).utc().toISOString(true);
            to = moment(customToDate).utc().toISOString(true);
        } else {
            const now = moment();
            from = moment(now).subtract(days, 'days').utc().toISOString();
            // also include the next day in case our server is behind in time with respect to GitHub
            to = moment(now).add(1, 'days').utc().toISOString();
        }

        try {
            const apiResponse = await this.fetch(this.getGraphQLQuery(from, to));

            if (apiResponse.data.errors) {
                console.error('API Error: ', apiResponse.data.errors);
                if (apiResponse.data.errors[0].type === 'RATE_LIMITED') {
                    console.log('GraphQL Error: API rate limit exceeded');
                    return '💥 API rate limit exceeded. Please deploy your own instance.';
                } else {
                    return `Can't fetch any contribution. Please check your username 😬`;
                }
            } else if (apiResponse.data.data) {
                if (apiResponse.data.data.user === null)
                    return `Can't fetch any contribution. Please check your username 😬`;
                else {
                    const userData: UserDetails = {
                        contributions: [],
                        name: apiResponse.data.data.user.name,
                    };
                    //filtering the week data from API response
                    const weeks =
                        apiResponse.data.data.user.contributionsCollection.contributionCalendar
                            .weeks;
                    // get day-contribution data
                    weeks.map((week: Week) =>
                        week.contributionDays.map((contributionDay: ContributionDay) => {
                            contributionDay.date = moment(contributionDay.date, moment.ISO_8601)
                                .date()
                                .toString();
                            userData.contributions.push(contributionDay);
                        }),
                    );

                    // if 32nd entry is 0 means:
                    // either the day hasn't really started
                    // or the user hasn't contributed today
                    const length = userData.contributions.length;
                    if (!(customFromDate && customToDate)) {
                        if (userData.contributions[length - 1].contributionCount === 0) {
                            userData.contributions.pop();
                        }
                        const extra = userData.contributions.length - days;
                        userData.contributions.splice(0, extra);
                    }
                    return userData;
                }
            } else {
                console.error('Unexpected API response structure');
                throw new Error('Unexpected API response structure');
            }
        } catch (error) {
            console.log('error: ', error);
            return `Can't fetch any contribution. Please check your username 😬`;
        }
    }
}
