import createClient from 'openapi-fetch'
import type { paths } from './schema'

// Same origin in dev (Vite proxy) and production (Caddy), so no base URL.
export const api = createClient<paths>()

type RecommendQuery = NonNullable<paths['/api/recommend/']['get']['parameters']['query']>

export const getCrops = () => api.GET('/api/crops/')
export const getRecommend = (query: RecommendQuery) => api.GET('/api/recommend/', { params: { query } })

// Derived from what the client returns rather than from `paths`:
// openapi-fetch widens tuples, so the two don't match exactly.
export type Crop = NonNullable<Awaited<ReturnType<typeof getCrops>>['data']>[number]
export type RecommendResponse = NonNullable<Awaited<ReturnType<typeof getRecommend>>['data']>
export type Result = RecommendResponse['results'][number]
export type Site = RecommendResponse['site']
export type Reason = Result['reasons'][number]
export type Verdict = Result['verdict']
export type Texture = Site['soil']['texture']
