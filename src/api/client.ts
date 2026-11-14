import createClient from 'openapi-fetch'
import type { paths } from './schema'

export const api = createClient<paths>()

type RecommendQuery = NonNullable<paths['/api/recommend/']['get']['parameters']['query']>

export const getCrops = (signal?: AbortSignal) => api.GET('/api/crops/', { signal })
export const getRecommend = (query: RecommendQuery, signal?: AbortSignal) =>
  api.GET('/api/recommend/', { params: { query }, signal })

export type Crop = NonNullable<Awaited<ReturnType<typeof getCrops>>['data']>[number]
export type RecommendResponse = NonNullable<Awaited<ReturnType<typeof getRecommend>>['data']>
export type Result = RecommendResponse['results'][number]
export type Site = RecommendResponse['site']
export type Reason = Result['reasons'][number]
export type Verdict = Result['verdict']
export type Texture = Site['soil']['texture']

