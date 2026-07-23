import { api, unwrap } from "../api"
import { getAuthUser } from "@/utils/auth"
import type { ApiResponse } from "@/types/auth"
import type { ProcessTeamRecord, ProcessTeamRequest, ProcessTeamUpdateRequest } from "@/types/processTeam"

export const processTeamApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProcessTeams: builder.query<ProcessTeamRecord[], void>({
      query: () => "/process-team",
      transformResponse: unwrap,
      providesTags: [{ type: "ProcessTeam", id: "LIST" }],
    }),
    createProcessTeam: builder.mutation<ApiResponse<ProcessTeamRecord>, ProcessTeamRequest>({
      query: (body) => ({
        url: "/process-team",
        method: "POST",
        params: { employeeId: getAuthUser()?.employeeId ?? "" },
        body,
      }),
      invalidatesTags: [{ type: "ProcessTeam", id: "LIST" }],
    }),
    updateProcessTeam: builder.mutation<ApiResponse<ProcessTeamRecord>, { processTeamId: number; body: ProcessTeamUpdateRequest }>({
      query: ({ processTeamId, body }) => ({
        url: `/process-team/${processTeamId}`,
        method: "PUT",
        params: { employeeId: getAuthUser()?.employeeId ?? "" },
        body,
      }),
      invalidatesTags: [{ type: "ProcessTeam", id: "LIST" }],
    }),
    // The backend only exposes a single-id DELETE, so a multi-row selection fans out into one
    // request per id here instead of a single batch call.
    deleteProcessTeams: builder.mutation<ApiResponse<null>, number[]>({
      queryFn: async (processTeamIds, _queryApi, _extraOptions, baseQuery) => {
        const employeeId = getAuthUser()?.employeeId ?? ""
        let lastData: ApiResponse<null> | null = null
        for (const processTeamId of processTeamIds) {
          const result = await baseQuery({
            url: `/process-team/${processTeamId}`,
            method: "DELETE",
            params: { employeeId },
          })
          if (result.error) return { error: result.error }
          lastData = result.data as ApiResponse<null>
        }
        return { data: lastData ?? { success: true, message: "", data: null } }
      },
      invalidatesTags: [{ type: "ProcessTeam", id: "LIST" }],
    }),
  }),
})

export const {
  useGetProcessTeamsQuery,
  useCreateProcessTeamMutation,
  useUpdateProcessTeamMutation,
  useDeleteProcessTeamsMutation,
} = processTeamApi
