import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  chart?: React.ReactNode;
}

export function StatCard({ title, value, icon, trend, chart }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="p-2 bg-primary-light rounded-lg w-fit mb-3 text-primary">
            {icon}
          </div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.positive ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.positive ? 'text-success' : 'text-danger'
                }`}
              >
                {trend.value}
              </span>
            </div>
          )}
        </div>
        {chart && <div className="ml-4">{chart}</div>}
      </div>
    </Card>
  );
}
