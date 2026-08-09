import { getV1MeOptions } from "@repo/api-client/react-query"
import type { GetV1MeResponse } from "@repo/api-client/types"

export const QO = {
  User: () => ({
    ...getV1MeOptions(),
    select: (r: GetV1MeResponse) => r.data,
    staleTime: 5 * 60_000,
  }),
}
