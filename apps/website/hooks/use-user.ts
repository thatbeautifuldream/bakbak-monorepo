import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/lib/auth-client"
import { QO } from "@/lib/react-query/query-options"
import { MO } from "@/lib/react-query/mutation-options"

export function useUser() {
  const { data: session } = useSession()
  return useQuery({
    ...QO.User(),
    enabled: !!session,
    placeholderData: (prev) => prev,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    ...MO.UpdateProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QO.User().queryKey })
    },
  })
}
