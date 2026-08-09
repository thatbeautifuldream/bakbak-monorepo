import { patchV1Me } from "@repo/api-client/sdk"
import type { PatchV1MeData } from "@repo/api-client/types"

type Body<T> = NonNullable<T>
type InnerData<T> = T extends { data: infer D } ? D : never

const unwrap = <T extends { data: unknown }>(r: { data: T }): InnerData<T> =>
  (r.data as { data: InnerData<T> }).data

export const MO = {
  UpdateProfile: () => ({
    mutationFn: (body: Body<PatchV1MeData["body"]>) =>
      patchV1Me({ body, throwOnError: true }).then(unwrap),
  }),
}
