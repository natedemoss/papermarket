import { z } from 'zod'

// Polymarket Gamma API response types
export const polymarketCategorySchema = z.enum([
    'Politics', 'Elections', 'Government',
    'Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum',
    'Finance', 'Stocks', 'Economy', 'Fed',
    'Science', 'Space', 'Climate',
    'Sports', 'NBA', 'NFL', 'Soccer',
    'Technology', 'AI', 'Tech',
    'Other'
])

export const gammaMarketSchema = z.object({
    id: z.string(), // polymarketId
    slug: z.string(), // polymarketSlug
    question: z.string(), // title
    outcomePrices: z.string(), // JSON array like ["0.62", "0.38"]
    volume: z.string(), // volume as string
    endDate: z.string().nullable(), // closesAt
    resolved: z.boolean(),
    resolutionTime: z.string().nullable(),
    winner: z.string().nullable(), // "YES" or "NO"
    image: z.string().nullable(), // imageUrl
    description: z.string().nullable(),
    tags: z.array(z.object({ label: z.string() })),
})

export type GammaMarket = z.infer<typeof gammaMarketSchema>

// Category mapping function
export function mapPolymarketCategory(tags: Array<{ label: string }>): string {
    const firstTag = tags[0]?.label || 'Other'

    const politicsTags = ['Politics', 'Elections', 'Government']
    const cryptoTags = ['Crypto', 'Cryptocurrency', 'Bitcoin', 'Ethereum']
    const financeTags = ['Finance', 'Stocks', 'Economy', 'Fed']
    const scienceTags = ['Science', 'Space', 'Climate']
    const sportsTags = ['Sports', 'NBA', 'NFL', 'Soccer']
    const techTags = ['Technology', 'AI', 'Tech']

    if (politicsTags.some(t => firstTag.includes(t))) return 'POLITICS'
    if (cryptoTags.some(t => firstTag.includes(t))) return 'CRYPTO'
    if (financeTags.some(t => firstTag.includes(t))) return 'FINANCE'
    if (scienceTags.some(t => firstTag.includes(t))) return 'SCIENCE'
    if (sportsTags.some(t => firstTag.includes(t))) return 'SPORTS'
    if (techTags.some(t => firstTag.includes(t))) return 'TECH'

    return 'OTHER'
}
