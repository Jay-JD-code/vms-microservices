// Mock data for demo mode when backend services aren't running
import type { Vendor, Order, Payment, DocumentEntity, PerformanceReview, DashboardStats } from "@/types";

export const mockVendors: Vendor[] = [
  { id: "v1", companyName: "Acme Industrial Supplies", contactPerson: "John Smith", email: "john@acme.com", phone: "+1-555-0101", status: "APPROVED", createdAt: "2026-01-15" },
  { id: "v2", companyName: "Global Tech Solutions", contactPerson: "Sarah Chen", email: "sarah@globaltech.com", phone: "+1-555-0102", status: "APPROVED", createdAt: "2026-01-20" },
  { id: "v3", companyName: "Premier Logistics Co.", contactPerson: "Mike Johnson", email: "mike@premierlog.com", phone: "+1-555-0103", status: "PENDING", createdAt: "2026-02-10" },
  { id: "v4", companyName: "Eastern Materials Ltd.", contactPerson: "Li Wei", email: "liwei@eastern.com", phone: "+1-555-0104", status: "APPROVED", createdAt: "2026-02-18" },
  { id: "v5", companyName: "Summit Office Products", contactPerson: "Jane Doe", email: "jane@summit.com", phone: "+1-555-0105", status: "PENDING", createdAt: "2026-03-01" },
  { id: "v6", companyName: "Reliable Parts Inc.", contactPerson: "Tom Brown", email: "tom@reliable.com", phone: "+1-555-0106", status: "SUSPENDED", createdAt: "2025-11-05" },
  { id: "v7", companyName: "Pacific Manufacturing", contactPerson: "Amy Lee", email: "amy@pacific.com", phone: "+1-555-0107", status: "APPROVED", createdAt: "2026-03-10" },
];

export const mockOrders: Order[] = [
  { id: 1001, vendorId: "v1", vendorName: "Acme Industrial Supplies", items: [{ productName: "Steel Bolts M8", quantity: 5000, unitPrice: 0.12 }, { productName: "Washers M8", quantity: 5000, unitPrice: 0.05 }], totalAmount: 850.00, status: "DELIVERED", createdAt: "2026-02-15", updatedAt: "2026-03-01" },
  { id: 1002, vendorId: "v2", vendorName: "Global Tech Solutions", items: [{ productName: "Server RAM 32GB", quantity: 20, unitPrice: 89.99 }], totalAmount: 1799.80, status: "SHIPPED", createdAt: "2026-03-05", updatedAt: "2026-03-12" },
  { id: 1003, vendorId: "v4", vendorName: "Eastern Materials Ltd.", items: [{ productName: "Copper Wire 2mm", quantity: 200, unitPrice: 4.50 }], totalAmount: 900.00, status: "APPROVED", createdAt: "2026-03-10" },
  { id: 1004, vendorId: "v1", vendorName: "Acme Industrial Supplies", items: [{ productName: "Industrial Adhesive", quantity: 100, unitPrice: 12.00 }], totalAmount: 1200.00, status: "CREATED", createdAt: "2026-03-18" },
  { id: 1005, vendorId: "v7", vendorName: "Pacific Manufacturing", items: [{ productName: "Plastic Casing A", quantity: 500, unitPrice: 3.20 }], totalAmount: 1600.00, status: "COMPLETED", createdAt: "2026-01-20", updatedAt: "2026-02-28" },
  { id: 1006, vendorId: "v2", vendorName: "Global Tech Solutions", items: [{ productName: "Network Cables Cat6", quantity: 100, unitPrice: 8.50 }], totalAmount: 850.00, status: "CANCELLED", createdAt: "2026-02-01" },
];

export const mockPayments: Payment[] = [
  { id: 2001, orderId: 1001, vendorId: "v1", vendorName: "Acme Industrial Supplies", amount: 850.00, method: "BANK_TRANSFER", status: "COMPLETED", createdAt: "2026-03-02" },
  { id: 2002, orderId: 1005, vendorId: "v7", vendorName: "Pacific Manufacturing", amount: 1600.00, method: "BANK_TRANSFER", status: "COMPLETED", createdAt: "2026-03-01" },
  { id: 2003, orderId: 1002, vendorId: "v2", vendorName: "Global Tech Solutions", amount: 1799.80, method: "CHECK", status: "PENDING", createdAt: "2026-03-15" },
  { id: 2004, orderId: 1003, vendorId: "v4", vendorName: "Eastern Materials Ltd.", amount: 900.00, method: "BANK_TRANSFER", status: "PENDING", createdAt: "2026-03-18" },
  { id: 2005, orderId: 1004, vendorId: "v1", vendorName: "Acme Industrial Supplies", amount: 1200.00, method: "CREDIT_CARD", status: "FAILED", createdAt: "2026-03-20" },
];

export const mockDocuments: DocumentEntity[] = [
  { id: 3001, vendorId: "v1", vendorName: "Acme Industrial Supplies", documentType: "CONTRACT", fileName: "acme_contract_2026.pdf", filePath: "/docs/acme_contract.pdf", uploadedAt: "2026-01-15" },
  { id: 3002, vendorId: "v1", vendorName: "Acme Industrial Supplies", documentType: "INSURANCE", fileName: "acme_insurance.pdf", filePath: "/docs/acme_insurance.pdf", uploadedAt: "2026-01-16" },
  { id: 3003, vendorId: "v2", vendorName: "Global Tech Solutions", documentType: "LICENSE", fileName: "globaltech_license.pdf", filePath: "/docs/gt_license.pdf", uploadedAt: "2026-01-22" },
  { id: 3004, vendorId: "v4", vendorName: "Eastern Materials Ltd.", documentType: "TAX_FORM", fileName: "eastern_w9.pdf", filePath: "/docs/eastern_w9.pdf", uploadedAt: "2026-02-20" },
  { id: 3005, vendorId: "v7", vendorName: "Pacific Manufacturing", documentType: "CONTRACT", fileName: "pacific_agreement.pdf", filePath: "/docs/pacific.pdf", uploadedAt: "2026-03-11" },
];

export const mockPerformance: PerformanceReview[] = [
  { id: 4001, vendorId: "v1", vendorName: "Acme Industrial Supplies", deliveryScore: 92, qualityScore: 88, complianceScore: 95, overallScore: 91.7, calculatedAt: "2026-03-15" },
  { id: 4002, vendorId: "v2", vendorName: "Global Tech Solutions", deliveryScore: 85, qualityScore: 94, complianceScore: 90, overallScore: 89.7, calculatedAt: "2026-03-15" },
  { id: 4003, vendorId: "v4", vendorName: "Eastern Materials Ltd.", deliveryScore: 78, qualityScore: 82, complianceScore: 88, overallScore: 82.7, calculatedAt: "2026-03-15" },
  { id: 4004, vendorId: "v7", vendorName: "Pacific Manufacturing", deliveryScore: 96, qualityScore: 91, complianceScore: 93, overallScore: 93.3, calculatedAt: "2026-03-15" },
];

export const mockDashboardStats: DashboardStats = {
  totalVendors: 7,
  activeVendors: 4,
  pendingApprovals: 2,
  totalOrders: 6,
  pendingPayments: 2,
  totalPaymentsAmount: 6349.80,
};
