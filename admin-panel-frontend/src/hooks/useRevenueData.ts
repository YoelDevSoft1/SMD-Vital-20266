import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';

export function useRevenueData() {
  return useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: async () => {
      const response = await adminService.getRevenueAnalytics(12);
      return response.data.data; // Acceder a response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
}
