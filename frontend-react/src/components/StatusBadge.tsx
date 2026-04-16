import type { VendorStatus, OrderStatus, PaymentStatus } from "@/types";

type StatusType = VendorStatus | OrderStatus | PaymentStatus | string;

const statusConfig: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: "bg-success/10", text: "text-success" },
  COMPLETED: { bg: "bg-success/10", text: "text-success" },
  DELIVERED: { bg: "bg-success/10", text: "text-success" },
  PENDING: { bg: "bg-warning/10", text: "text-warning" },
  CREATED: { bg: "bg-info/10", text: "text-info" },
  SHIPPED: { bg: "bg-info/10", text: "text-info" },
  CANCELLED: { bg: "bg-muted", text: "text-muted-foreground" },
  REJECTED: { bg: "bg-destructive/10", text: "text-destructive" },
  SUSPENDED: { bg: "bg-destructive/10", text: "text-destructive" },
  FAILED: { bg: "bg-destructive/10", text: "text-destructive" },
};

export default function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status] || { bg: "bg-muted", text: "text-muted-foreground" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {status}
    </span>
  );
}
